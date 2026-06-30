import 'server-only'

import { getPreviousTradingWeek, weeklyProfitMultiplier } from '@/lib/invest/trading-calendar'
import { accrueReferralCommissionsForProfit } from '@/lib/referral/commission-service'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { creditInvestorWallet } from '@/lib/payments/wallet-ledger'
import { generatePaymentReference } from '@/lib/payments/reference'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for profit runs.')
  }
  return db
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function runWeeklyInvestmentProfits() {
  const { start, end, tradingDays } = getPreviousTradingWeek()
  const periodStart = formatDate(start)
  const periodEnd = formatDate(end)
  const db = getDb()

  const { data: existing } = await db
    .from('investment_profit_runs')
    .select('id')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle()

  if (existing) {
    return { skipped: true, reason: 'Period already processed', periodStart, periodEnd }
  }

  const { data: investments, error } = await db
    .from('investments')
    .select('id, user_id, amount, current_value, roi_percentage, status, plan_id')
    .eq('status', 'Active')

  if (error) throw new Error(error.message)

  let totalProfitUsd = 0
  let processed = 0

  for (const investment of investments ?? []) {
    const amount = Number(investment.amount ?? 0)
    const weeklyRoi = Number(investment.roi_percentage ?? 0)
    if (amount <= 0 || weeklyRoi <= 0) continue

    const profit = Math.round(amount * weeklyProfitMultiplier(weeklyRoi, tradingDays) * 100) / 100
    if (profit <= 0) continue

    const userId = investment.user_id as string
    const referenceId = generatePaymentReference('profit')
    const nextValue = Number(investment.current_value ?? amount) + profit

    await db
      .from('investments')
      .update({ current_value: nextValue })
      .eq('id', investment.id)

    const { data: portfolio } = await db
      .from('portfolios')
      .select('id, current_value, profit_loss, total_invested')
      .eq('user_id', userId)
      .maybeSingle()

    if (portfolio) {
      const invested = Number(portfolio.total_invested ?? 0)
      const currentValue = Number(portfolio.current_value ?? 0) + profit
      const profitLoss = currentValue - invested
      const roi = invested > 0 ? (profitLoss / invested) * 100 : 0

      await db
        .from('portfolios')
        .update({
          current_value: currentValue,
          profit_loss: profitLoss,
          roi_percentage: Math.round(roi * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolio.id)
    }

    await creditInvestorWallet(userId, profit)
    await db.from('transactions').insert({
      user_id: userId,
      type: 'profit',
      amount: profit,
      status: 'Completed',
      description: `Weekly XAU/USD profit (${tradingDays} trading days)`,
      reference_id: referenceId,
    })

    await accrueReferralCommissionsForProfit({
      sourceUserId: userId,
      profitUsd: profit,
      periodStart,
      periodEnd,
    })

    totalProfitUsd += profit
    processed += 1
  }

  await db.from('investment_profit_runs').insert({
    period_start: periodStart,
    period_end: periodEnd,
    trading_days: tradingDays,
    total_profit_usd: Math.round(totalProfitUsd * 100) / 100,
    status: 'completed',
  })

  return {
    skipped: false,
    periodStart,
    periodEnd,
    tradingDays,
    processed,
    totalProfitUsd: Math.round(totalProfitUsd * 100) / 100,
  }
}
