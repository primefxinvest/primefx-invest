import 'server-only'

import { runDailyInvestmentProfits } from '@/lib/invest/profit-service'
import {
  listDueInvestmentCapitalWithdrawals,
  processInvestmentCapitalWithdrawal,
} from '@/lib/invest/capital-withdrawal'
import { runWeeklyReferralDistribution } from '@/lib/referral/commission-service'
import {
  completeTransaction,
  releaseWalletHold,
} from '@/lib/payments/wallet-ledger'
import {
  listDueWithdrawalRequests,
  markWithdrawalRequestStatus,
} from '@/lib/wallet/withdrawals'

export async function processDueWalletWithdrawals() {
  const due = await listDueWithdrawalRequests()
  let processed = 0

  for (const row of due) {
    const gross = Number(row.amount_usd)
    const referenceId = row.reference_id as string

    await releaseWalletHold(row.user_id as string, gross)
    await completeTransaction(referenceId, 'Completed')
    await markWithdrawalRequestStatus(row.id as string, 'completed')

    processed += 1
  }

  return { processed, totalDue: due.length }
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

export type DailyCronResult = {
  ranAt: string
  utcDay: number
  withdrawals: Awaited<ReturnType<typeof processDueWalletWithdrawals>>
  profits: Awaited<ReturnType<typeof runDailyInvestmentProfits>> | { skipped: true; reason: string }
  weekly: Awaited<ReturnType<typeof runWeeklyReferralDistribution>> | null
  capitalWithdrawals: Awaited<ReturnType<typeof processDueCapitalWithdrawals>> | null
}

/** Single daily cron for Vercel Hobby (one job / 24h). */
export async function runDailyCron(): Promise<DailyCronResult> {
  const now = new Date()
  const utcDay = now.getUTCDay()

  const withdrawals = await processDueWalletWithdrawals()

  let profits: DailyCronResult['profits']
  if (utcDay >= 1 && utcDay <= 5) {
    profits = await runDailyInvestmentProfits()
  } else {
    profits = { skipped: true, reason: 'Weekend — no Mon–Fri trading session to settle' }
  }

  let weekly: DailyCronResult['weekly'] = null
  let capitalWithdrawals: DailyCronResult['capitalWithdrawals'] = null

  if (utcDay === 5) {
    weekly = await runWeeklyReferralDistribution()
    capitalWithdrawals = await processDueCapitalWithdrawals()
  }

  return {
    ranAt: now.toISOString(),
    utcDay,
    withdrawals,
    profits,
    weekly,
    capitalWithdrawals,
  }
}
