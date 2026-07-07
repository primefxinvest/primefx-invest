'use server'

import 'server-only'

import {
  calculateDailyProfit,
  calculateDailyRate,
  formatProfitPeriodDate,
  getDueProfitPeriods,
  getNextDailyPayoutAt,
  roundProfitUsd,
  roundRate,
  type DueProfitPeriod,
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

type InvestmentRow = {
  id: string
  user_id: string
  amount: number
  current_value: number
  roi_percentage: number
  status: string
  plan_id: string
  start_date: string | null
  created_at: string
  compound_mode: boolean
  accumulated_profit: number
  last_profit_calculation_at: string | null
  investment_plans: {
    name?: string
    compound_mode?: boolean
  } | null
}

type PortfolioRow = {
  id: string
  current_value: number
  profit_loss: number
  total_invested: number
}

type ProfitRunResult = {
  skipped: boolean
  reason?: string
  periodStart: string
  periodEnd: string
  processed: number
  totalProfitUsd: number
  investmentsTouched: number
}

const INVESTMENT_SELECT = `
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
  last_profit_calculation_at,
  investment_plans (name, compound_mode)
`

function mapInvestmentRow(row: Record<string, unknown>): InvestmentRow {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    amount: Number(row.amount ?? 0),
    current_value: Number(row.current_value ?? 0),
    roi_percentage: Number(row.roi_percentage ?? 0),
    status: String(row.status ?? ''),
    plan_id: row.plan_id as string,
    start_date: (row.start_date as string | null) ?? null,
    created_at: row.created_at as string,
    compound_mode: Boolean(row.compound_mode ?? false),
    accumulated_profit: Number(row.accumulated_profit ?? 0),
    last_profit_calculation_at: (row.last_profit_calculation_at as string | null) ?? null,
    investment_plans: row.investment_plans as InvestmentRow['investment_plans'],
  }
}

function getInvestmentStartAt(investment: InvestmentRow): Date {
  return new Date(investment.start_date ?? investment.created_at)
}

async function loadExistingPeriodDates(
  db: ReturnType<typeof getDb>,
  investmentIds: string[]
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>()
  if (!investmentIds.length) return map

  const chunkSize = 500
  for (let i = 0; i < investmentIds.length; i += chunkSize) {
    const chunk = investmentIds.slice(i, i + chunkSize)
    const { data, error } = await db
      .from('investment_profit_history')
      .select('investment_id, period_date')
      .in('investment_id', chunk)

    if (error) throw new Error(error.message)

    for (const row of data ?? []) {
      const investmentId = row.investment_id as string
      const periodDate = String(row.period_date)
      const existing = map.get(investmentId) ?? new Set<string>()
      existing.add(periodDate)
      map.set(investmentId, existing)
    }
  }

  return map
}

async function loadPortfoliosByUser(
  db: ReturnType<typeof getDb>,
  userIds: string[]
): Promise<Map<string, PortfolioRow>> {
  const map = new Map<string, PortfolioRow>()
  if (!userIds.length) return map

  const uniqueUserIds = [...new Set(userIds)]
  const chunkSize = 500

  for (let i = 0; i < uniqueUserIds.length; i += chunkSize) {
    const chunk = uniqueUserIds.slice(i, i + chunkSize)
    const { data, error } = await db
      .from('portfolios')
      .select('id, user_id, current_value, profit_loss, total_invested')
      .in('user_id', chunk)

    if (error) throw new Error(error.message)

    for (const row of data ?? []) {
      map.set(row.user_id as string, {
        id: row.id as string,
        current_value: Number(row.current_value ?? 0),
        profit_loss: Number(row.profit_loss ?? 0),
        total_invested: Number(row.total_invested ?? 0),
      })
    }
  }

  return map
}

async function creditSingleProfitPayout(input: {
  db: ReturnType<typeof getDb>
  investment: InvestmentRow
  period: DueProfitPeriod
  portfolioCache: Map<string, PortfolioRow>
  now: Date
}): Promise<{ credited: boolean; profit: number }> {
  const { db, investment, period, portfolioCache, now } = input
  const amount = investment.amount
  const weeklyRoi = investment.roi_percentage
  if (amount <= 0 || weeklyRoi <= 0) return { credited: false, profit: 0 }

  const plan = investment.investment_plans
  const compoundMode = Boolean(investment.compound_mode ?? plan?.compound_mode ?? false)
  const currentValue = investment.current_value
  const planName = plan?.name ?? 'Investment Plan'

  const profit = calculateDailyProfit({
    principalUsd: amount,
    weeklyRoiPercent: weeklyRoi,
    compoundMode,
    currentValueUsd: currentValue,
  })
  if (profit <= 0) return { credited: false, profit: 0 }

  const userId = investment.user_id
  const investmentId = investment.id
  const referenceId = generatePaymentReference('profit')
  const dailyRate = roundRate(calculateDailyRate(weeklyRoi))
  const principalBase = compoundMode ? currentValue : amount

  const { data: claimedProfit, error: profitClaimError } = await db.rpc(
    'claim_investment_daily_profit',
    {
      p_investment_id: investmentId,
      p_user_id: userId,
      p_period_date: period.periodDate,
      p_amount_usd: profit,
      p_daily_rate: dailyRate,
      p_principal_usd: principalBase,
      p_reference_id: referenceId,
    }
  )

  if (profitClaimError) throw new Error(profitClaimError.message)
  if (!claimedProfit) return { credited: false, profit: 0 }

  const nextValue = roundProfitUsd(currentValue + profit)
  const nextAccumulated = roundProfitUsd(investment.accumulated_profit + profit)
  const payoutAtIso = period.payoutAt.toISOString()
  const nextPayoutAt = getNextDailyPayoutAt(period.payoutAt).toISOString()

  await db
    .from('investments')
    .update({
      current_value: nextValue,
      daily_profit: profit,
      accumulated_profit: nextAccumulated,
      last_profit_calculation_at: payoutAtIso,
      next_payout_at: nextPayoutAt,
    })
    .eq('id', investmentId)

  investment.current_value = nextValue
  investment.accumulated_profit = nextAccumulated
  investment.last_profit_calculation_at = payoutAtIso

  const portfolio = portfolioCache.get(userId)
  if (portfolio) {
    const invested = portfolio.total_invested
    const portfolioValue = roundProfitUsd(portfolio.current_value + profit)
    const profitLoss = roundProfitUsd(portfolioValue - invested)
    const roi = invested > 0 ? roundProfitUsd((profitLoss / invested) * 100) : 0

    await db
      .from('portfolios')
      .update({
        current_value: portfolioValue,
        profit_loss: profitLoss,
        roi_percentage: roi,
        updated_at: now.toISOString(),
      })
      .eq('id', portfolio.id)

    portfolio.current_value = portfolioValue
    portfolio.profit_loss = profitLoss
  }

  const { data: txRow } = await db
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'investment_profit',
      amount: profit,
      status: 'Completed',
      description: `Daily profit - ${planName}`,
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
    period_start: period.periodDate,
    period_end: period.periodDate,
    status: 'completed',
    transaction_id: txRow?.id ?? null,
    reference_id: referenceId,
  })

  await db.from('investment_daily_snapshots').upsert(
    {
      investment_id: investmentId,
      user_id: userId,
      snapshot_date: period.periodDate,
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
    periodStart: period.periodDate,
    periodEnd: period.periodDate,
  })

  return { credited: true, profit }
}

async function runInvestmentProfits(now: Date = new Date()): Promise<ProfitRunResult> {
  const db = getDb()
  const runDate = formatProfitPeriodDate(now)

  const { data: claimedRun, error: claimError } = await db.rpc('claim_profit_run_period', {
    p_period_start: runDate,
    p_period_end: runDate,
    p_trading_days: 1,
  })

  if (claimError) throw new Error(claimError.message)

  const isRetryRun = !claimedRun

  if (isRetryRun) {
    await logFinancialAudit({
      eventType: 'profit.run_skipped',
      referenceId: `${runDate}:${runDate}`,
      metadata: { reason: 'period_already_claimed', retry: true },
    })
  }

  const { data: investmentRows, error } = await db
    .from('investments')
    .select(INVESTMENT_SELECT)
    .eq('status', 'Active')

  if (error) throw new Error(error.message)

  const investments = (investmentRows ?? []).map((row) =>
    mapInvestmentRow(row as Record<string, unknown>)
  )

  if (!investments.length) {
    if (claimedRun) {
      await db.rpc('finalize_profit_run_period', {
        p_period_start: runDate,
        p_period_end: runDate,
        p_total_profit_usd: 0,
      })
    }

    return {
      skipped: false,
      periodStart: runDate,
      periodEnd: runDate,
      processed: 0,
      totalProfitUsd: 0,
      investmentsTouched: 0,
    }
  }

  const investmentIds = investments.map((row) => row.id)
  const userIds = investments.map((row) => row.user_id)

  const [historyMap, portfolioCache] = await Promise.all([
    loadExistingPeriodDates(db, investmentIds),
    loadPortfoliosByUser(db, userIds),
  ])

  let totalProfitUsd = 0
  let processed = 0
  let investmentsTouched = 0

  for (const investment of investments) {
    const existingPeriodDates = historyMap.get(investment.id) ?? new Set<string>()
    const duePeriods = getDueProfitPeriods({
      startAt: getInvestmentStartAt(investment),
      existingPeriodDates,
      now,
    })

    if (!duePeriods.length) continue

    investmentsTouched += 1

    for (const period of duePeriods) {
      const result = await creditSingleProfitPayout({
        db,
        investment,
        period,
        portfolioCache,
        now,
      })

      if (!result.credited) continue

      totalProfitUsd += result.profit
      processed += 1
      existingPeriodDates.add(period.periodDate)
    }
  }

  const roundedTotal = roundProfitUsd(totalProfitUsd)

  if (claimedRun) {
    const { error: finalizeError } = await db.rpc('finalize_profit_run_period', {
      p_period_start: runDate,
      p_period_end: runDate,
      p_total_profit_usd: roundedTotal,
    })

    if (finalizeError) throw new Error(finalizeError.message)
  }

  await logFinancialAudit({
    eventType: 'profit.run_completed',
    referenceId: `${runDate}:${runDate}`,
    amountUsd: roundedTotal,
    metadata: {
      processed,
      investmentsTouched,
      engine: 'interval_24h_v3',
      retryRun: isRetryRun,
    },
  })

  return {
    skipped: false,
    periodStart: runDate,
    periodEnd: runDate,
    processed,
    totalProfitUsd: roundedTotal,
    investmentsTouched,
  }
}

export async function runDailyInvestmentProfits() {
  return runInvestmentProfits(new Date())
}

export async function runWeeklyInvestmentProfits() {
  return runDailyInvestmentProfits()
}
