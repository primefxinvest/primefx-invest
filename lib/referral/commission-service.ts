import 'server-only'

import {
  AMBASSADOR_TEAM_PROFIT_RATE,
  formatReferralRate,
  getProfitShareRate,
  getReferralRankTier,
} from '@/lib/referral/program-config'
import { getReferralAncestors } from '@/lib/referral/network'
import { getReferralProgramEnabled } from '@/lib/referral/settings'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { creditInvestorWallet } from '@/lib/payments/wallet-ledger'
import { generatePaymentReference } from '@/lib/payments/reference'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for referral commissions.')
  }
  return db
}

export async function accrueReferralCommissionsForProfit(input: {
  sourceUserId: string
  profitUsd: number
  periodStart: string
  periodEnd: string
}) {
  if (input.profitUsd <= 0) return

  const enabled = await getReferralProgramEnabled()
  if (!enabled) return

  const ancestors = await getReferralAncestors(input.sourceUserId, 4)
  if (!ancestors.length) return

  const db = getDb()
  const rows = ancestors.map(({ referrerId, level }) => {
    const rate = getProfitShareRate(level)
    const commission = Math.round(input.profitUsd * rate * 100) / 100
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
  if (error) throw new Error(error.message)
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

  const { data: referrerRow } = await db
    .from('referrals')
    .select('referrer_id')
    .eq('referred_user_id', sourceUserId)
    .maybeSingle()

  if (referrerRow?.referrer_id) {
    const { refreshUserReferralStats } = await import('@/lib/referral/network')
    await refreshUserReferralStats(referrerRow.referrer_id as string)
  }
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

    const { data: profitTx } = await db
      .from('transactions')
      .select('amount')
      .eq('type', 'profit')
      .eq('status', 'Completed')
      .in('user_id', descendantIds)
      .gte('created_at', periodStartIso)
      .lte('created_at', periodEndIso)

    const teamProfit = (profitTx ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
    if (teamProfit <= 0) continue

    const commission = Math.round(teamProfit * AMBASSADOR_TEAM_PROFIT_RATE * 100) / 100
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

    await db.from('referral_commissions').insert({
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

    accrued += 1
  }

  return { accrued }
}

export async function distributePendingReferralCommissions(periodEnd?: string) {
  const db = getDb()

  let query = db
    .from('referral_commissions')
    .select('*')
    .eq('status', 'pending')
    .limit(500)

  if (periodEnd) {
    query = query.lte('period_end', periodEnd)
  }

  const { data: pending, error } = await query
  if (error) throw new Error(error.message)
  if (!pending?.length) return { paid: 0, totalUsd: 0 }

  let paid = 0
  let totalUsd = 0

  for (const row of pending) {
    const commission = Number(row.commission_usd)
    if (commission <= 0) continue

    const referenceId = generatePaymentReference('referral')
    const referrerId = row.referrer_id as string
    const commissionType = String(row.commission_type ?? 'profit_share')

    const description =
      commissionType === 'ambassador_team'
        ? `Ambassador team profit share ${formatReferralRate(Number(row.commission_rate))} (${row.period_start} – ${row.period_end})`
        : `Level ${row.level} referral profit share (${row.period_start} – ${row.period_end})`

    await creditInvestorWallet(referrerId, commission)

    await db.from('transactions').insert({
      user_id: referrerId,
      type: 'referral',
      amount: commission,
      status: 'Completed',
      description,
      reference_id: referenceId,
    })

    await db
      .from('referral_commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        reference_id: referenceId,
      })
      .eq('id', row.id)

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

    paid += 1
    totalUsd += commission
  }

  return { paid, totalUsd: Math.round(totalUsd * 100) / 100 }
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
  if (!rewards?.length) return { paid: 0 }

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

    await creditInvestorWallet(userId, bonus)
    await db.from('transactions').insert({
      user_id: userId,
      type: 'bonus',
      amount: bonus,
      status: 'Completed',
      description: `Referral rank reward — ${reward.rank_key}`,
      reference_id: referenceId,
    })

    await db
      .from('referral_rank_rewards')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', reward.id)

    paid += 1
  }

  return { paid }
}

export async function runWeeklyReferralDistribution() {
  const { getPreviousTradingWeek } = await import('@/lib/invest/trading-calendar')
  const { start, end } = getPreviousTradingWeek()
  const periodStart = start.toISOString().slice(0, 10)
  const periodEnd = end.toISOString().slice(0, 10)

  const ambassador = await accrueAmbassadorTeamProfits({ periodStart, periodEnd })
  const commissions = await distributePendingReferralCommissions(periodEnd)
  const rankBonuses = await payPendingRankCashBonuses()

  return {
    periodStart,
    periodEnd,
    ambassador,
    commissions,
    rankBonuses,
  }
}
