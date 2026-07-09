import 'server-only'

import { runDailyInvestmentProfits } from '@/lib/invest/profit-service'
import {
  listDueInvestmentCapitalWithdrawals,
  processInvestmentCapitalWithdrawal,
} from '@/lib/invest/capital-withdrawal'
import { runWeeklyReferralDistribution } from '@/lib/referral/commission-service'
import { processDueWithdrawalRow } from '@/lib/payments/withdrawal-payout'
import { listDueWithdrawalRequests } from '@/lib/wallet/withdrawals'
import { syncAllOpenDeposits } from '@/lib/payments/deposit-sync'
import { withCronJobLock } from '@/lib/cron/lock'

/** Promote due wallet withdrawals and send hold reminders. */
export async function processDueWalletWithdrawals() {
  const due = await listDueWithdrawalRequests()
  let processed = 0
  let readyForPayout = 0
  let skipped = 0
  let failed = 0
  const results: Array<Record<string, unknown>> = []

  for (const row of due) {
    try {
      const result = await processDueWithdrawalRow(row as Record<string, unknown>)
      results.push(result as Record<string, unknown>)

      if (result.status === 'skipped') {
        skipped += 1
        continue
      }

      if (result.status === 'ready_for_payout') {
        readyForPayout += 1
        processed += 1
        continue
      }

      processed += 1
    } catch (err) {
      failed += 1
      results.push({
        status: 'failed',
        referenceId: row.reference_id,
        error: err instanceof Error ? err.message : 'Processing failed',
      })
    }
  }

  const { processWithdrawalHoldReminders } = await import('@/lib/wallet/withdrawal-hold-reminders')
  const holdReminders = await processWithdrawalHoldReminders()

  return {
    processed,
    readyForPayout,
    skipped,
    failed,
    totalDue: due.length,
    holdReminders,
    results,
  }
}

export async function processDueCapitalWithdrawals() {
  const dueCapital = await listDueInvestmentCapitalWithdrawals()
  let processed = 0

  for (const row of dueCapital) {
    await processInvestmentCapitalWithdrawal(row.id as string)
    processed += 1
  }

  return { processed, totalDue: dueCapital.length }
}

/** Run automated jobs for due withdrawals, capital returns, and stale crypto deposits. */
export async function processDueFinancialJobs() {
  const withdrawals = await processDueWalletWithdrawals()
  const capitalWithdrawals = await processDueCapitalWithdrawals()
  const depositSync = await syncAllOpenDeposits()

  return {
    withdrawals,
    capitalWithdrawals,
    depositSync,
  }
}

export type DailyCronResult = {
  ranAt: string
  utcDay: number
  lockSkipped?: boolean
  lockReason?: string
  withdrawals: Awaited<ReturnType<typeof processDueWalletWithdrawals>>
  depositSync: Awaited<ReturnType<typeof syncAllOpenDeposits>>
  profits: Awaited<ReturnType<typeof runDailyInvestmentProfits>> | { skipped: true; reason: string }
  weekly: Awaited<ReturnType<typeof runWeeklyReferralDistribution>> | null
  capitalWithdrawals: Awaited<ReturnType<typeof processDueCapitalWithdrawals>>
}

async function executeDailyCron(): Promise<DailyCronResult> {
  const now = new Date()
  const utcDay = now.getUTCDay()

  const withdrawals = await processDueWalletWithdrawals()
  const depositSync = await syncAllOpenDeposits()

  let profits: DailyCronResult['profits']
  profits = await runDailyInvestmentProfits()

  let weekly: DailyCronResult['weekly'] = null

  if (utcDay === 5) {
    weekly = await runWeeklyReferralDistribution()
  }

  const capitalWithdrawals = await processDueCapitalWithdrawals()

  return {
    ranAt: now.toISOString(),
    utcDay,
    withdrawals,
    depositSync,
    profits,
    weekly,
    capitalWithdrawals,
  }
}

/** Single daily cron for Vercel Hobby (one job / 24h). */
export async function runDailyCron(): Promise<DailyCronResult> {
  const locked = await withCronJobLock('daily_cron', executeDailyCron, 3600)

  if (locked.skipped) {
    const now = new Date()
    return {
      ranAt: now.toISOString(),
      utcDay: now.getUTCDay(),
      lockSkipped: true,
      lockReason: locked.reason,
      withdrawals: {
        processed: 0,
        readyForPayout: 0,
        skipped: 0,
        failed: 0,
        totalDue: 0,
        holdReminders: { threeDay: 0, oneDay: 0, skipped: 0, checked: 0 },
        results: [],
      },
      depositSync: { checked: 0, completed: 0, failed: 0, results: [] },
      profits: { skipped: true, reason: locked.reason },
      weekly: null,
      capitalWithdrawals: { processed: 0, totalDue: 0 },
    }
  }

  return locked.result
}
