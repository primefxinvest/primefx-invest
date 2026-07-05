import 'server-only'

import {
  dailyProfitMultiplier,
  getPreviousTradingDay,
  getPreviousTradingWeek,
  weeklyProfitMultiplier,
} from '@/lib/invest/trading-calendar'
import { accrueReferralCommissionsForProfit } from '@/lib/referral/commission-service'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { creditInvestorWallet } from '@/lib/payments/wallet-ledger'
import { generatePaymentReference } from '@/lib/payments/reference'
import { logFinancialAudit } from '@/lib/payments/financial-audit'

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

type InvestmentProfitRunInput = {
  periodStart: string
  periodEnd: string
  tradingDays: number
  profitDescription: string
  calculateProfit: (amount: number, weeklyRoi: number) => number
}

async function runInvestmentProfits(input: InvestmentProfitRunInput) {
  const { periodStart, periodEnd, tradingDays, profitDescription, calculateProfit } = input
  const db = getDb()

  const { data: claimedRun, error: claimError } = await db.rpc('claim_profit_run_period', {
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_trading_days: tradingDays,
  })

  if (claimError) throw new Error(claimError.message)

  if (!claimedRun) {
    await logFinancialAudit({
      eventType: 'profit.run_skipped',
      referenceId: `${periodStart}:${periodEnd}`,
      metadata: { reason: 'period_already_claimed' },
    })
    return { skipped: true, reason: 'Period already processed', periodStart, periodEnd }
  }

  await logFinancialAudit({
    eventType: 'profit.run_claimed',
    referenceId: `${periodStart}:${periodEnd}`,
    metadata: { tradingDays },
  })

  const { data: investments, error } = await db
    .from('investments')
    .select('id, user_id, amount, current_value, roi_percentage, status, plan_id, start_date')
    .eq('status', 'Active')

  if (error) throw new Error(error.message)

  let totalProfitUsd = 0
  let processed = 0

  for (const investment of investments ?? []) {
    const amount = Number(investment.amount ?? 0)
    const weeklyRoi = Number(investment.roi_percentage ?? 0)
    if (amount <= 0 || weeklyRoi <= 0) continue

    const startDate = investment.start_date
      ? formatDate(new Date(investment.start_date as string))
      : null
    if (startDate && startDate > periodEnd) continue

    const profit = Math.round(calculateProfit(amount, weeklyRoi) * 100) / 100
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
      description: profitDescription,
      reference_id: referenceId,
      investment_id: investment.id,
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

  const roundedTotal = Math.round(totalProfitUsd * 100) / 100

  const { error: finalizeError } = await db.rpc('finalize_profit_run_period', {
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_total_profit_usd: roundedTotal,
  })

  if (finalizeError) throw new Error(finalizeError.message)

  await logFinancialAudit({
    eventType: 'profit.run_completed',
    referenceId: `${periodStart}:${periodEnd}`,
    amountUsd: roundedTotal,
    metadata: { processed, tradingDays },
  })

  return {
    skipped: false,
    periodStart,
    periodEnd,
    tradingDays,
    processed,
    totalProfitUsd: roundedTotal,
  }
}

export async function runDailyInvestmentProfits() {
  const tradingDay = getPreviousTradingDay()
  const periodStart = formatDate(tradingDay)
  const periodEnd = periodStart

  return runInvestmentProfits({
    periodStart,
    periodEnd,
    tradingDays: 1,
    profitDescription: `Daily XAU/USD profit (${periodStart})`,
    calculateProfit: (amount, weeklyRoi) => amount * dailyProfitMultiplier(weeklyRoi),
  })
}

export async function runWeeklyInvestmentProfits() {
  const { start, end, tradingDays } = getPreviousTradingWeek()
  const periodStart = formatDate(start)
  const periodEnd = formatDate(end)

  return runInvestmentProfits({
    periodStart,
    periodEnd,
    tradingDays,
    profitDescription: `Weekly XAU/USD profit (${tradingDays} trading days)`,
    calculateProfit: (amount, weeklyRoi) =>
      amount * weeklyProfitMultiplier(weeklyRoi, tradingDays),
  })
}
