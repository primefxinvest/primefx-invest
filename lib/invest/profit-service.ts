'use server'

import 'server-only'

import {
  calculateDailyProfit,
  calculateDailyRate,
  formatProfitPeriodDate,
  getNextDailyPayoutAt,
  getPreviousCalendarDay,
  roundProfitUsd,
  roundRate,
} from '@/lib/invest/profit-engine'
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

type ProfitRunResult = {
  skipped: boolean
  reason?: string
  periodStart: string
  periodEnd: string
  processed: number
  totalProfitUsd: number
}

async function runInvestmentProfitsForPeriod(periodDate: Date): Promise<ProfitRunResult> {
  const db = getDb()
  const periodStart = formatProfitPeriodDate(periodDate)
  const periodEnd = periodStart
  const nextPayoutAt = getNextDailyPayoutAt().toISOString()

  const { data: claimedRun, error: claimError } = await db.rpc('claim_profit_run_period', {
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_trading_days: 1,
  })

  if (claimError) throw new Error(claimError.message)

  if (!claimedRun) {
    await logFinancialAudit({
      eventType: 'profit.run_skipped',
      referenceId: `${periodStart}:${periodEnd}`,
      metadata: { reason: 'period_already_claimed' },
    })
    return {
      skipped: true,
      reason: 'Period already processed',
      periodStart,
      periodEnd,
      processed: 0,
      totalProfitUsd: 0,
    }
  }

  const { data: investments, error } = await db
    .from('investments')
    .select(
      `
      id,
      user_id,
      amount,
      current_value,
      roi_percentage,
      status,
      plan_id,
      start_date,
      created_at,
      compound_mode,
      accumulated_profit,
      investment_plans (name, compound_mode, capital_lock_days)
    `
    )
    .eq('status', 'Active')

  if (error) throw new Error(error.message)

  let totalProfitUsd = 0
  let processed = 0

  for (const investment of investments ?? []) {
    const amount = Number(investment.amount ?? 0)
    const weeklyRoi = Number(investment.roi_percentage ?? 0)
    if (amount <= 0 || weeklyRoi <= 0) continue

    const startDate = investment.start_date
      ? formatProfitPeriodDate(new Date(investment.start_date as string))
      : formatProfitPeriodDate(new Date(investment.created_at as string))
    if (startDate > periodEnd) continue

    const plan = investment.investment_plans as {
      name?: string
      compound_mode?: boolean
    } | null
    const compoundMode = Boolean(investment.compound_mode ?? plan?.compound_mode ?? false)
    const currentValue = Number(investment.current_value ?? amount)

    const profit = calculateDailyProfit({
      principalUsd: amount,
      weeklyRoiPercent: weeklyRoi,
      compoundMode,
      currentValueUsd: currentValue,
    })
    if (profit <= 0) continue

    const userId = investment.user_id as string
    const investmentId = investment.id as string
    const referenceId = generatePaymentReference('profit')
    const dailyRate = roundRate(calculateDailyRate(weeklyRoi))
    const principalBase = compoundMode ? currentValue : amount
    const planName = plan?.name ?? 'Investment Plan'

    const { data: claimedProfit, error: profitClaimError } = await db.rpc(
      'claim_investment_daily_profit',
      {
        p_investment_id: investmentId,
        p_user_id: userId,
        p_period_date: periodStart,
        p_amount_usd: profit,
        p_daily_rate: dailyRate,
        p_principal_usd: principalBase,
        p_reference_id: referenceId,
      }
    )

    if (profitClaimError) throw new Error(profitClaimError.message)
    if (!claimedProfit) continue

    const nextValue = roundProfitUsd(currentValue + profit)
    const nextAccumulated = roundProfitUsd(
      Number(investment.accumulated_profit ?? 0) + profit
    )

    await db
      .from('investments')
      .update({
        current_value: nextValue,
        daily_profit: profit,
        accumulated_profit: nextAccumulated,
        last_profit_calculation_at: new Date().toISOString(),
        next_payout_at: nextPayoutAt,
      })
      .eq('id', investmentId)

    const { data: portfolio } = await db
      .from('portfolios')
      .select('id, current_value, profit_loss, total_invested')
      .eq('user_id', userId)
      .maybeSingle()

    if (portfolio) {
      const invested = Number(portfolio.total_invested ?? 0)
      const portfolioValue = roundProfitUsd(Number(portfolio.current_value ?? 0) + profit)
      const profitLoss = roundProfitUsd(portfolioValue - invested)
      const roi = invested > 0 ? roundProfitUsd((profitLoss / invested) * 100) : 0

      await db
        .from('portfolios')
        .update({
          current_value: portfolioValue,
          profit_loss: profitLoss,
          roi_percentage: roi,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolio.id)
    }

    const { data: txRow } = await db
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'investment_profit',
        amount: profit,
        status: 'Completed',
        description: `+${profit.toFixed(2)} ${planName} daily profit`,
        reference_id: referenceId,
        investment_id: investmentId,
      })
      .select('id')
      .single()

    if (txRow?.id) {
      await db
        .from('investment_profit_history')
        .update({ transaction_id: txRow.id })
        .eq('id', claimedProfit.id)
    }

    await db.from('investment_payouts').insert({
      investment_id: investmentId,
      user_id: userId,
      amount_usd: profit,
      payout_type: 'daily',
      period_start: periodStart,
      period_end: periodEnd,
      status: 'completed',
      transaction_id: txRow?.id ?? null,
      reference_id: referenceId,
    })

    await db.from('investment_daily_snapshots').upsert(
      {
        investment_id: investmentId,
        user_id: userId,
        snapshot_date: periodStart,
        principal_usd: amount,
        accumulated_profit_usd: nextAccumulated,
        current_value_usd: nextValue,
        daily_rate: dailyRate,
        daily_profit_usd: profit,
      },
      { onConflict: 'investment_id,snapshot_date' }
    )

    await creditInvestorWallet(userId, profit)

    await accrueReferralCommissionsForProfit({
      sourceUserId: userId,
      profitUsd: profit,
      periodStart,
      periodEnd,
    })

    totalProfitUsd += profit
    processed += 1
  }

  const roundedTotal = roundProfitUsd(totalProfitUsd)

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
    metadata: { processed, engine: 'calendar_daily_v2' },
  })

  return {
    skipped: false,
    periodStart,
    periodEnd,
    processed,
    totalProfitUsd: roundedTotal,
  }
}

export async function runDailyInvestmentProfits() {
  const periodDate = getPreviousCalendarDay()
  return runInvestmentProfitsForPeriod(periodDate)
}

export async function runWeeklyInvestmentProfits() {
  const periodDate = getPreviousCalendarDay()
  return runInvestmentProfitsForPeriod(periodDate)
}
