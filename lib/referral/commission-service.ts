import 'server-only'

import {
  AMBASSADOR_TEAM_PROFIT_RATE,
  REFERRAL_INVESTMENT_COMMISSION_RATE,
  formatReferralRate,
  getProfitShareRate,
  getReferralRankTier,
} from '@/lib/referral/program-config'
import { getReferralAncestors } from '@/lib/referral/network'
import { getReferralProgramEnabled } from '@/lib/referral/settings'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { creditInvestorWallet } from '@/lib/payments/wallet-ledger'
import { generatePaymentReference } from '@/lib/payments/reference'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import { logEngine } from '@/lib/observability/engine-log'
import { isMissingDbFunctionError } from '@/lib/db/missing-rpc'

/** Match team-metrics: historical rows may use `profit`, live credits use `investment_profit`. */
const PROFIT_TRANSACTION_TYPES = ['profit', 'investment_profit'] as const

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for referral commissions.')
  }
  return db
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

type ClaimedCommission = Record<string, unknown>

/**
 * Atomically claim a pending commission for payout.
 * Falls back to conditional UPDATE when claim_referral_commission_payout RPC
 * is not deployed (observed missing on production).
 */
async function claimReferralCommissionPayout(
  db: ReturnType<typeof getDb>,
  commissionId: string,
  referenceId: string
): Promise<ClaimedCommission | null> {
  const { data: claimed, error } = await db.rpc('claim_referral_commission_payout', {
    p_commission_id: commissionId,
    p_reference_id: referenceId,
  })

  if (!error) return (claimed as ClaimedCommission | null) ?? null

  if (!isMissingDbFunctionError(error.message)) {
    throw new Error(error.message)
  }

  logEngine('referral.payout', 'claim_rpc_missing_using_fallback', {
    referenceId,
    commissionId,
    error: error.message,
  })

  const { data, error: updateError } = await db
    .from('referral_commissions')
    .update({ status: 'paying', reference_id: referenceId })
    .eq('id', commissionId)
    .eq('status', 'pending')
    .gt('commission_usd', 0)
    .select('*')
    .maybeSingle()

  if (updateError) throw new Error(updateError.message)
  return (data as ClaimedCommission | null) ?? null
}

async function claimReferralRankBonusPayout(
  db: ReturnType<typeof getDb>,
  rewardId: string
): Promise<ClaimedCommission | null> {
  const { data: claimed, error } = await db.rpc('claim_referral_rank_bonus_payout', {
    p_reward_id: rewardId,
  })

  if (!error) return (claimed as ClaimedCommission | null) ?? null

  if (!isMissingDbFunctionError(error.message)) {
    throw new Error(error.message)
  }

  logEngine('referral.bonus', 'rank_claim_rpc_missing_using_fallback', {
    rewardId,
    error: error.message,
  })

  const { data, error: updateError } = await db
    .from('referral_rank_rewards')
    .update({ status: 'paying' })
    .eq('id', rewardId)
    .eq('status', 'pending')
    .gt('cash_bonus_usd', 0)
    .select('*')
    .maybeSingle()

  if (updateError) throw new Error(updateError.message)
  return (data as ClaimedCommission | null) ?? null
}

export async function accrueReferralCommissionsForProfit(input: {
  sourceUserId: string
  profitUsd: number
  periodStart: string
  periodEnd: string
  investmentId?: string | null
}) {
  if (input.profitUsd <= 0) return

  const enabled = await getReferralProgramEnabled()
  if (!enabled) {
    logEngine('referral.commission', 'skipped_program_disabled', {
      userId: input.sourceUserId,
      investmentId: input.investmentId,
      amountUsd: input.profitUsd,
    })
    return
  }

  const ancestors = await getReferralAncestors(input.sourceUserId, 4)
  if (!ancestors.length) {
    logEngine('referral.commission', 'skipped_no_ancestors', {
      userId: input.sourceUserId,
      investmentId: input.investmentId,
      amountUsd: input.profitUsd,
    })
    return
  }

  const db = getDb()
  const rows = ancestors.map(({ referrerId, level }) => {
    const rate = getProfitShareRate(level)
    const commission = roundUsd(input.profitUsd * rate)
    return {
      referrer_id: referrerId,
      source_user_id: input.sourceUserId,
      level,
      gross_profit_usd: input.profitUsd,
      commission_rate: rate,
      commission_usd: commission,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      commission_type: 'profit_share',
      status: commission > 0 ? 'pending' : 'cancelled',
    }
  })

  const payable = rows.filter((row) => row.commission_usd > 0)
  if (!payable.length) return

  const { error } = await db.from('referral_commissions').insert(payable)
  if (error) {
    if (error.code === '23505') {
      await logFinancialAudit({
        eventType: 'referral.commission_duplicate_blocked',
        userId: input.sourceUserId,
        referenceId: `${input.periodStart}:${input.periodEnd}`,
        amountUsd: input.profitUsd,
        metadata: { reason: 'unique_constraint', investmentId: input.investmentId },
      })
      logEngine('referral.commission', 'duplicate_blocked', {
        userId: input.sourceUserId,
        investmentId: input.investmentId,
        amountUsd: input.profitUsd,
      })
      return
    }
    logEngine('referral.commission', 'accrual_failed', {
      userId: input.sourceUserId,
      investmentId: input.investmentId,
      amountUsd: input.profitUsd,
      error: error.message,
    })
    throw new Error(error.message)
  }

  await logFinancialAudit({
    eventType: 'referral.commission_accrued',
    userId: input.sourceUserId,
    referenceId: `${input.periodStart}:${input.periodEnd}`,
    amountUsd: input.profitUsd,
    metadata: { levels: payable.length, investmentId: input.investmentId },
  })

  logEngine('referral.commission', 'profit_share_accrued', {
    userId: input.sourceUserId,
    investmentId: input.investmentId,
    amountUsd: input.profitUsd,
    levels: payable.length,
    totalCommissionUsd: roundUsd(payable.reduce((sum, row) => sum + row.commission_usd, 0)),
  })
}

/**
 * One-time 2% commission on a referred member's first qualifying deposit or investment.
 * Credits the direct referrer immediately (idempotent per referred user).
 */
export async function accrueInvestmentReferralCommission(input: {
  sourceUserId: string
  amountUsd: number
  trigger: 'deposit' | 'investment'
  referenceId?: string | null
}) {
  const amountUsd = Number(input.amountUsd)
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { accrued: false as const, reason: 'invalid_amount' as const }
  }

  const enabled = await getReferralProgramEnabled()
  if (!enabled) {
    return { accrued: false as const, reason: 'disabled' as const }
  }

  const db = getDb()
  const { data: referral, error: referralError } = await db
    .from('referrals')
    .select('id, referrer_id, bonus_earned, status')
    .eq('referred_user_id', input.sourceUserId)
    .maybeSingle()

  if (referralError) {
    logEngine('referral.bonus', 'referral_lookup_failed', {
      userId: input.sourceUserId,
      error: referralError.message,
    })
    throw new Error(referralError.message)
  }

  if (!referral?.referrer_id) {
    logEngine('referral.bonus', 'investment_commission_skipped_no_referrer', {
      userId: input.sourceUserId,
      amountUsd,
      trigger: input.trigger,
    })
    return { accrued: false as const, reason: 'no_referrer' as const }
  }

  const referrerId = referral.referrer_id as string
  const referralId = referral.id as string

  const { data: existing } = await db
    .from('referral_commissions')
    .select('id, status')
    .eq('source_user_id', input.sourceUserId)
    .eq('commission_type', 'investment')
    .in('status', ['pending', 'paid', 'paying'])
    .limit(1)
    .maybeSingle()

  if (existing) {
    logEngine('referral.bonus', 'investment_commission_already_exists', {
      userId: input.sourceUserId,
      referralId,
      referenceId: input.referenceId,
      commissionId: existing.id,
      status: existing.status,
    })
    return { accrued: false as const, reason: 'already_accrued' as const }
  }

  const commission = roundUsd(amountUsd * REFERRAL_INVESTMENT_COMMISSION_RATE)
  if (commission <= 0) {
    return { accrued: false as const, reason: 'zero_commission' as const }
  }

  const eventDate = new Date().toISOString().slice(0, 10)
  const payoutReferenceId = input.referenceId || generatePaymentReference('referral')

  const { data: inserted, error: insertError } = await db
    .from('referral_commissions')
    .insert({
      referrer_id: referrerId,
      source_user_id: input.sourceUserId,
      level: 1,
      gross_profit_usd: amountUsd,
      commission_rate: REFERRAL_INVESTMENT_COMMISSION_RATE,
      commission_usd: commission,
      period_start: eventDate,
      period_end: eventDate,
      commission_type: 'investment',
      status: 'pending',
      reference_id: payoutReferenceId,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      await logFinancialAudit({
        eventType: 'referral.commission_duplicate_blocked',
        userId: referrerId,
        referenceId: payoutReferenceId,
        amountUsd: commission,
        metadata: {
          commission_type: 'investment',
          sourceUserId: input.sourceUserId,
          trigger: input.trigger,
        },
      })
      return { accrued: false as const, reason: 'duplicate' as const }
    }
    logEngine('referral.bonus', 'investment_commission_insert_failed', {
      userId: referrerId,
      referralId,
      amountUsd: commission,
      error: insertError.message,
    })
    throw new Error(insertError.message)
  }

  const commissionId = inserted.id as string

  await db
    .from('referrals')
    .update({
      bonus_earned: roundUsd(Number(referral.bonus_earned ?? 0) + commission),
      status: 'Active',
    })
    .eq('id', referralId)

  const claimed = await claimReferralCommissionPayout(db, commissionId, payoutReferenceId)

  if (!claimed) {
    logEngine('referral.bonus', 'investment_commission_claim_skipped', {
      userId: referrerId,
      referralId,
      referenceId: payoutReferenceId,
      amountUsd: commission,
    })
    return { accrued: true as const, paid: false as const, commissionUsd: commission }
  }

  let walletCredited = false
  try {
    await creditInvestorWallet(referrerId, commission)
    walletCredited = true

    logEngine('wallet.credit', 'referral_investment_commission', {
      userId: referrerId,
      referralId,
      referenceId: payoutReferenceId,
      amountUsd: commission,
    })

    const { error: txError } = await db.from('transactions').insert({
      user_id: referrerId,
      type: 'referral',
      amount: commission,
      status: 'Completed',
      description: `Referral investment commission ${formatReferralRate(REFERRAL_INVESTMENT_COMMISSION_RATE)} (${input.trigger})`,
      reference_id: payoutReferenceId,
    })

    if (txError) {
      logEngine('transaction.create', 'referral_investment_commission_tx_failed', {
        userId: referrerId,
        referralId,
        referenceId: payoutReferenceId,
        amountUsd: commission,
        error: txError.message,
      })
      throw new Error(txError.message)
    }

    const { error: markPaidError } = await db
      .from('referral_commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        reference_id: payoutReferenceId,
      })
      .eq('id', commissionId)
      .eq('status', 'paying')

    if (markPaidError) {
      logEngine('referral.bonus', 'investment_commission_mark_paid_failed', {
        userId: referrerId,
        referralId,
        referenceId: payoutReferenceId,
        amountUsd: commission,
        error: markPaidError.message,
      })
      throw new Error(markPaidError.message)
    }

    const { data: stats } = await db
      .from('user_referral_stats')
      .select('lifetime_commission_usd')
      .eq('user_id', referrerId)
      .maybeSingle()

    await db.from('user_referral_stats').upsert(
      {
        user_id: referrerId,
        lifetime_commission_usd: Number(stats?.lifetime_commission_usd ?? 0) + commission,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    await logFinancialAudit({
      eventType: 'referral.investment_commission_accrued',
      userId: referrerId,
      referenceId: payoutReferenceId,
      amountUsd: commission,
      metadata: {
        sourceUserId: input.sourceUserId,
        trigger: input.trigger,
        referralId,
        commissionId,
        grossAmountUsd: amountUsd,
      },
    })

    logEngine('referral.bonus', 'investment_commission_paid', {
      userId: referrerId,
      referralId,
      referenceId: payoutReferenceId,
      amountUsd: commission,
      trigger: input.trigger,
      sourceUserId: input.sourceUserId,
    })

    return { accrued: true as const, paid: true as const, commissionUsd: commission }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Investment commission payout failed'
    if (walletCredited) {
      // Do not reset to pending — that would double-credit on retry.
      await db
        .from('referral_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          reference_id: payoutReferenceId,
        })
        .eq('id', commissionId)
        .eq('status', 'paying')

      await logFinancialAudit({
        eventType: 'referral.commission_paid_partial',
        userId: referrerId,
        referenceId: payoutReferenceId,
        amountUsd: commission,
        metadata: { commissionId, error: message, trigger: input.trigger },
      })
    } else {
      await db
        .from('referral_commissions')
        .update({ status: 'pending', reference_id: null })
        .eq('id', commissionId)
        .eq('status', 'paying')
    }

    logEngine('referral.bonus', 'investment_commission_payout_failed', {
      userId: referrerId,
      referralId,
      referenceId: payoutReferenceId,
      amountUsd: commission,
      error: message,
      walletCredited,
    })
    throw err
  }
}

/** Mark referral active on first deposit/investment. */
export async function markReferralActiveOnFirstActivity(sourceUserId: string) {
  const db = getDb()
  const { data: referral } = await db
    .from('referrals')
    .select('id, status')
    .eq('referred_user_id', sourceUserId)
    .maybeSingle()

  if (!referral || referral.status === 'Active') return

  await db.from('referrals').update({ status: 'Active' }).eq('id', referral.id)

  logEngine('referral.bonus', 'referral_marked_active', {
    userId: sourceUserId,
    referralId: referral.id,
  })

  const { data: ancestors } = await db
    .from('referral_network')
    .select('ancestor_id')
    .eq('descendant_id', sourceUserId)

  const { refreshUserReferralStats } = await import('@/lib/referral/network')
  const ancestorIds = [...new Set((ancestors ?? []).map((row) => row.ancestor_id as string))]

  if (!ancestorIds.length) {
    const { data: referrerRow } = await db
      .from('referrals')
      .select('referrer_id')
      .eq('referred_user_id', sourceUserId)
      .maybeSingle()

    if (referrerRow?.referrer_id) {
      ancestorIds.push(referrerRow.referrer_id as string)
      const { buildReferralNetworkForUser } = await import('@/lib/referral/network')
      await buildReferralNetworkForUser(sourceUserId, referrerRow.referrer_id as string)
    }
  }

  await Promise.all(ancestorIds.map((ancestorId) => refreshUserReferralStats(ancestorId)))
}

export async function accrueAmbassadorTeamProfits(input: {
  periodStart: string
  periodEnd: string
}) {
  const enabled = await getReferralProgramEnabled()
  if (!enabled) return { accrued: 0 }

  const db = getDb()
  const { data: ambassadors } = await db
    .from('user_referral_stats')
    .select('user_id')
    .eq('rank_key', 'ambassador')

  if (!ambassadors?.length) return { accrued: 0 }

  const periodStartIso = `${input.periodStart}T00:00:00.000Z`
  const periodEndIso = `${input.periodEnd}T23:59:59.999Z`
  let accrued = 0

  for (const ambassador of ambassadors) {
    const ambassadorId = ambassador.user_id as string

    const { data: descendants } = await db
      .from('referral_network')
      .select('descendant_id')
      .eq('ancestor_id', ambassadorId)

    const descendantIds = (descendants ?? []).map((row) => row.descendant_id as string)
    if (!descendantIds.length) continue

    const { data: profitTx, error: profitError } = await db
      .from('transactions')
      .select('amount')
      .in('type', [...PROFIT_TRANSACTION_TYPES])
      .eq('status', 'Completed')
      .in('user_id', descendantIds)
      .gte('created_at', periodStartIso)
      .lte('created_at', periodEndIso)

    if (profitError) {
      logEngine('referral.commission', 'ambassador_profit_query_failed', {
        userId: ambassadorId,
        error: profitError.message,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      })
      throw new Error(profitError.message)
    }

    const teamProfit = (profitTx ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
    if (teamProfit <= 0) continue

    const commission = roundUsd(teamProfit * AMBASSADOR_TEAM_PROFIT_RATE)
    if (commission <= 0) continue

    const { data: existing } = await db
      .from('referral_commissions')
      .select('id')
      .eq('referrer_id', ambassadorId)
      .eq('commission_type', 'ambassador_team')
      .eq('period_start', input.periodStart)
      .eq('period_end', input.periodEnd)
      .maybeSingle()

    if (existing) continue

    const { error: insertError } = await db.from('referral_commissions').insert({
      referrer_id: ambassadorId,
      source_user_id: ambassadorId,
      level: 0,
      gross_profit_usd: teamProfit,
      commission_rate: AMBASSADOR_TEAM_PROFIT_RATE,
      commission_usd: commission,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      commission_type: 'ambassador_team',
      status: 'pending',
    })

    if (insertError) {
      if (insertError.code === '23505') {
        await logFinancialAudit({
          eventType: 'referral.commission_duplicate_blocked',
          userId: ambassadorId,
          referenceId: `${input.periodStart}:${input.periodEnd}`,
          metadata: { commission_type: 'ambassador_team' },
        })
        continue
      }
      throw new Error(insertError.message)
    }

    logEngine('referral.commission', 'ambassador_team_accrued', {
      userId: ambassadorId,
      amountUsd: commission,
      teamProfitUsd: teamProfit,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    })

    accrued += 1
  }

  return { accrued }
}

export async function distributePendingReferralCommissions(periodEnd?: string) {
  const db = getDb()

  // Always include one-time investment commissions (pay immediately / on any run).
  // Profit-share / ambassador rows honor periodEnd when provided (Friday batch).
  let pending: Array<Record<string, unknown>> = []

  const investmentQuery = db
    .from('referral_commissions')
    .select('*')
    .eq('status', 'pending')
    .eq('commission_type', 'investment')
    .limit(200)

  const { data: investmentPending, error: investmentError } = await investmentQuery
  if (investmentError) throw new Error(investmentError.message)
  pending = [...(investmentPending ?? [])]

  let shareQuery = db
    .from('referral_commissions')
    .select('*')
    .eq('status', 'pending')
    .neq('commission_type', 'investment')
    .limit(500)

  if (periodEnd) {
    shareQuery = shareQuery.lte('period_end', periodEnd)
  }

  const { data: sharePending, error: shareError } = await shareQuery
  if (shareError) throw new Error(shareError.message)
  pending = [...pending, ...(sharePending ?? [])]

  if (!pending.length) {
    logEngine('referral.payout', 'no_pending_commissions', { periodEnd })
    return { paid: 0, totalUsd: 0 }
  }

  let paid = 0
  let totalUsd = 0

  for (const row of pending) {
    const commission = Number(row.commission_usd)
    if (commission <= 0) continue

    const referenceId = generatePaymentReference('referral')
    const referrerId = row.referrer_id as string
    const commissionType = String(row.commission_type ?? 'profit_share')

    const claimed = await claimReferralCommissionPayout(db, row.id as string, referenceId)
    if (!claimed) continue

    const description =
      commissionType === 'ambassador_team'
        ? `Ambassador team profit share ${formatReferralRate(Number(row.commission_rate))} (${row.period_start} – ${row.period_end})`
        : commissionType === 'investment'
          ? `Referral investment commission ${formatReferralRate(Number(row.commission_rate))}`
          : `Level ${row.level} referral profit share (${row.period_start} – ${row.period_end})`

    let walletCredited = false
    try {
      await creditInvestorWallet(referrerId, commission)
      walletCredited = true

      logEngine('wallet.credit', 'referral_commission_payout', {
        userId: referrerId,
        referenceId,
        amountUsd: commission,
        commissionType,
        commissionId: row.id,
      })

      const { error: txError } = await db.from('transactions').insert({
        user_id: referrerId,
        type: 'referral',
        amount: commission,
        status: 'Completed',
        description,
        reference_id: referenceId,
      })

      if (txError) throw new Error(txError.message)

      logEngine('transaction.create', 'referral_commission_paid', {
        userId: referrerId,
        referenceId,
        amountUsd: commission,
        commissionType,
      })

      await db
        .from('referral_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          reference_id: referenceId,
        })
        .eq('id', row.id)
        .eq('status', 'paying')

      const { data: stats } = await db
        .from('user_referral_stats')
        .select('lifetime_commission_usd')
        .eq('user_id', referrerId)
        .maybeSingle()

      await db.from('user_referral_stats').upsert(
        {
          user_id: referrerId,
          lifetime_commission_usd: Number(stats?.lifetime_commission_usd ?? 0) + commission,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

      await logFinancialAudit({
        eventType: 'referral.commission_paid',
        userId: referrerId,
        referenceId,
        amountUsd: commission,
        metadata: { commissionType, commissionId: row.id },
      })

      logEngine('referral.payout', 'commission_paid', {
        userId: referrerId,
        referenceId,
        amountUsd: commission,
        commissionType,
        commissionId: row.id,
      })

      paid += 1
      totalUsd += commission
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Commission payout failed'
      if (walletCredited) {
        await db
          .from('referral_commissions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            reference_id: referenceId,
          })
          .eq('id', row.id)
          .eq('status', 'paying')

        await logFinancialAudit({
          eventType: 'referral.commission_paid_partial',
          userId: referrerId,
          referenceId,
          amountUsd: commission,
          metadata: { commissionType, commissionId: row.id, error: message },
        })
      } else {
        await db
          .from('referral_commissions')
          .update({ status: 'pending', reference_id: null })
          .eq('id', row.id)
          .eq('status', 'paying')
      }

      logEngine('referral.payout', 'commission_payout_failed', {
        userId: referrerId,
        referenceId,
        amountUsd: commission,
        error: message,
        walletCredited,
        commissionId: row.id,
      })
      throw err
    }
  }

  return { paid, totalUsd: roundUsd(totalUsd) }
}

export async function payPendingRankCashBonuses(limit = 100) {
  const db = getDb()
  const { data: rewards, error } = await db
    .from('referral_rank_rewards')
    .select('*')
    .eq('status', 'pending')
    .gt('cash_bonus_usd', 0)
    .limit(limit)

  if (error) throw new Error(error.message)
  if (!rewards?.length) {
    logEngine('referral.bonus', 'no_pending_rank_bonuses', {})
    return { paid: 0 }
  }

  let paid = 0
  for (const reward of rewards) {
    const bonus = Number(reward.cash_bonus_usd)
    const userId = reward.user_id as string
    const tier = getReferralRankTier(reward.rank_key as string)

    if (!tier) {
      await db
        .from('referral_rank_rewards')
        .update({
          status: 'cancelled',
          admin_notes: 'Auto-cancelled: unknown rank tier',
        })
        .eq('id', reward.id)
      continue
    }

    const { data: stats } = await db
      .from('user_referral_stats')
      .select('active_member_count')
      .eq('user_id', userId)
      .maybeSingle()

    const activeMembers = Number(stats?.active_member_count ?? 0)
    if (activeMembers < tier.minMembers) {
      await db
        .from('referral_rank_rewards')
        .update({
          status: 'cancelled',
          admin_notes: `Auto-cancelled: ${activeMembers} active members, requires ${tier.minMembers}`,
        })
        .eq('id', reward.id)
      continue
    }

    const referenceId = generatePaymentReference('bonus')

    const claimed = await claimReferralRankBonusPayout(db, reward.id as string)
    if (!claimed) continue

    let walletCredited = false
    try {
      await creditInvestorWallet(userId, bonus)
      walletCredited = true

      logEngine('wallet.credit', 'rank_bonus_payout', {
        userId,
        referenceId,
        amountUsd: bonus,
        rankKey: reward.rank_key,
        rewardId: reward.id,
      })

      const { error: txError } = await db.from('transactions').insert({
        user_id: userId,
        type: 'bonus',
        amount: bonus,
        status: 'Completed',
        description: `Referral rank reward — ${reward.rank_key}`,
        reference_id: referenceId,
      })

      if (txError) throw new Error(txError.message)

      await db
        .from('referral_rank_rewards')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', reward.id)
        .eq('status', 'paying')

      await logFinancialAudit({
        eventType: 'referral.rank_bonus_paid',
        userId,
        referenceId,
        amountUsd: bonus,
        metadata: { rankKey: reward.rank_key, rewardId: reward.id },
      })

      logEngine('referral.bonus', 'rank_bonus_paid', {
        userId,
        referenceId,
        amountUsd: bonus,
        rankKey: reward.rank_key,
        rewardId: reward.id,
      })

      paid += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rank bonus payout failed'
      if (walletCredited) {
        await db
          .from('referral_rank_rewards')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', reward.id)
          .eq('status', 'paying')

        await logFinancialAudit({
          eventType: 'referral.rank_bonus_paid_partial',
          userId,
          referenceId,
          amountUsd: bonus,
          metadata: { rankKey: reward.rank_key, rewardId: reward.id, error: message },
        })
      } else {
        await db
          .from('referral_rank_rewards')
          .update({ status: 'pending' })
          .eq('id', reward.id)
          .eq('status', 'paying')
      }

      logEngine('referral.bonus', 'rank_bonus_payout_failed', {
        userId,
        referenceId,
        amountUsd: bonus,
        error: message,
        walletCredited,
        rewardId: reward.id,
      })
      throw err
    }
  }

  return { paid }
}

export async function runWeeklyReferralDistribution() {
  const { getPreviousTradingWeek } = await import('@/lib/invest/trading-calendar')
  const { start, end } = getPreviousTradingWeek()
  const periodStart = start.toISOString().slice(0, 10)
  const periodEnd = end.toISOString().slice(0, 10)

  logEngine('cron.execution', 'weekly_referral_distribution_start', {
    periodStart,
    periodEnd,
  })

  const ambassador = await accrueAmbassadorTeamProfits({ periodStart, periodEnd })
  const commissions = await distributePendingReferralCommissions(periodEnd)
  const rankBonuses = await payPendingRankCashBonuses()

  logEngine('cron.execution', 'weekly_referral_distribution_complete', {
    periodStart,
    periodEnd,
    ambassadorAccrued: ambassador.accrued,
    commissionsPaid: commissions.paid,
    commissionsUsd: commissions.totalUsd,
    rankBonusesPaid: rankBonuses.paid,
  })

  return {
    periodStart,
    periodEnd,
    ambassador,
    commissions,
    rankBonuses,
  }
}
