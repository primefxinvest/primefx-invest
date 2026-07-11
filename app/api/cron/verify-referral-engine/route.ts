import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { accrueReferralCommissionsForProfit } from '@/lib/referral/commission-service'
import { accrueInvestmentReferralCommission } from '@/lib/referral/commission-service'

/**
 * Production verification helpers (CRON_SECRET required).
 * - mode=profit_share_dry: accrue then delete test pending rows for a referred investor
 * - mode=backfill_investment: pay missing 2% investment commissions (idempotent)
 * - mode=repair_payouts: finalize stuck paying rows + distribute pending investment commissions
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const mode = url.searchParams.get('mode') ?? 'profit_share_dry'
  const db = createAdminSupabaseClient()
  if (!db) {
    return NextResponse.json({ error: 'Service role unavailable' }, { status: 500 })
  }

  try {
    if (mode === 'repair_payouts') {
      const { data: stuckPaying } = await db
        .from('referral_commissions')
        .select('id, reference_id, referrer_id, commission_usd, status')
        .eq('status', 'paying')

      const repaired: Array<Record<string, unknown>> = []
      for (const row of stuckPaying ?? []) {
        if (!row.reference_id) continue
        const { data: tx } = await db
          .from('transactions')
          .select('id')
          .eq('reference_id', row.reference_id)
          .eq('type', 'referral')
          .eq('status', 'Completed')
          .maybeSingle()

        if (!tx) {
          repaired.push({ commissionId: row.id, status: 'still_paying_no_tx' })
          continue
        }

        await db
          .from('referral_commissions')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', row.id)
          .eq('status', 'paying')

        repaired.push({ commissionId: row.id, status: 'marked_paid', referenceId: row.reference_id })
      }

      const { distributePendingReferralCommissions } = await import(
        '@/lib/referral/commission-service'
      )
      const distributed = await distributePendingReferralCommissions()

      return NextResponse.json({ ok: true, mode, repaired, distributed })
    }

    if (mode === 'backfill_investment') {
      const { data: refs } = await db
        .from('referrals')
        .select('id, referrer_id, referred_user_id')

      const results: Array<Record<string, unknown>> = []
      for (const ref of refs ?? []) {
        const { data: txs } = await db
          .from('transactions')
          .select('amount, type, reference_id')
          .eq('user_id', ref.referred_user_id)
          .in('type', ['deposit', 'investment'])
          .eq('status', 'Completed')
          .order('created_at', { ascending: true })
          .limit(1)

        if (!txs?.length) {
          results.push({ sourceUserId: ref.referred_user_id, status: 'skipped_no_tx' })
          continue
        }

        const result = await accrueInvestmentReferralCommission({
          sourceUserId: ref.referred_user_id as string,
          amountUsd: Number(txs[0].amount),
          trigger: txs[0].type === 'deposit' ? 'deposit' : 'investment',
          referenceId: (txs[0].reference_id as string) ?? null,
        })
        results.push({ sourceUserId: ref.referred_user_id, ...result })
      }

      return NextResponse.json({ ok: true, mode, results })
    }

    // Prefer a descendant with the deepest upline so L2+ is exercised when available.
    const { data: network } = await db
      .from('referral_network')
      .select('descendant_id, depth')
      .order('depth', { ascending: false })
      .limit(100)

    const rankedDescendants = [...new Set((network ?? []).map((r) => r.descendant_id as string))]
    let investment: { id: string; user_id: string; amount: number } | null = null

    for (const descendantId of rankedDescendants) {
      const { data: investments } = await db
        .from('investments')
        .select('id, user_id, amount')
        .eq('user_id', descendantId)
        .ilike('status', 'active')
        .limit(1)
      if (investments?.length) {
        investment = investments[0] as { id: string; user_id: string; amount: number }
        break
      }
    }

    if (!investment) {
      return NextResponse.json({
        ok: false,
        error: 'No referred active investment found for dry-run',
      }, { status: 404 })
    }

    const sourceUserId = investment.user_id
    const period = '2099-12-31'
    const testProfit = 10

    const { data: beforeAncestors } = await db
      .from('referral_network')
      .select('ancestor_id, depth')
      .eq('descendant_id', sourceUserId)
      .order('depth', { ascending: true })

    await accrueReferralCommissionsForProfit({
      sourceUserId,
      profitUsd: testProfit,
      periodStart: period,
      periodEnd: period,
      investmentId: investment.id,
    })

    const { data: accrued } = await db
      .from('referral_commissions')
      .select('id, referrer_id, level, commission_usd, commission_rate, status, commission_type')
      .eq('source_user_id', sourceUserId)
      .eq('period_start', period)
      .eq('period_end', period)
      .eq('commission_type', 'profit_share')

    // Cleanup test rows — never pay dry-run commissions
    if (accrued?.length) {
      await db
        .from('referral_commissions')
        .delete()
        .in(
          'id',
          accrued.map((r) => r.id)
        )
    }

    const rateForLevel = (level: number) =>
      level === 1 ? 0.05 : level === 2 ? 0.02 : level === 3 ? 0.01 : level === 4 ? 0.005 : 0

    const expectedLevels = (beforeAncestors ?? []).map((row) => {
      const level = Number(row.depth)
      const rate = rateForLevel(level)
      return {
        level,
        referrerId: row.ancestor_id,
        expectedCommission: Math.round(testProfit * rate * 100) / 100,
      }
    })

    const matched =
      (accrued?.length ?? 0) === expectedLevels.length &&
      expectedLevels.every((exp) =>
        (accrued ?? []).some(
          (row) =>
            Number(row.level) === exp.level &&
            Number(row.commission_usd) === exp.expectedCommission &&
            row.referrer_id === exp.referrerId
        )
      )

    return NextResponse.json({
      ok: matched,
      mode,
      sourceUserId,
      investmentId: investment.id,
      ancestors: beforeAncestors,
      expectedLevels,
      accruedBeforeCleanup: accrued,
      cleanedUp: true,
      levelsCovered: expectedLevels.map((l) => l.level),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
