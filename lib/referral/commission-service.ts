import 'server-only'

import { getProfitShareRate } from '@/lib/referral/program-config'
import { getReferralAncestors } from '@/lib/referral/network'
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
      status: commission > 0 ? 'pending' : 'cancelled',
    }
  })

  const payable = rows.filter((row) => row.commission_usd > 0)
  if (!payable.length) return

  const { error } = await db.from('referral_commissions').insert(payable)
  if (error) throw new Error(error.message)
}

export async function distributePendingReferralCommissions(periodEnd?: string) {
  const db = getDb()

  let query = db.from('referral_commissions').select('*').eq('status', 'pending').limit(500)
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

    await creditInvestorWallet(referrerId, commission)

    await db.from('transactions').insert({
      user_id: referrerId,
      type: 'referral',
      amount: commission,
      status: 'Completed',
      description: `Level ${row.level} referral profit share (${row.period_start} – ${row.period_end})`,
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

    await db
      .from('user_referral_stats')
      .upsert(
        {
          user_id: referrerId,
          lifetime_commission_usd:
            Number(stats?.lifetime_commission_usd ?? 0) + commission,
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
