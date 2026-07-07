import {
  calculateDailyProfit,
  calculateWeeklyEarningsFromCalendar,
  getCapitalLockDaysRemaining,
  getCapitalLockProgress,
  getCapitalWithdrawalUnlockAt,
  getNextDailyPayoutAt,
  isCapitalWithdrawalUnlocked,
  resolvePlanCapitalLockDays,
} from '@/lib/invest/profit-engine'
import { PLAN_UI_META } from '@/lib/invest/plan-mapper'
import { toNumber } from '@/lib/data/format'

export type InvestmentPositionInput = {
  id: string
  amount: number
  currentValue: number
  weeklyRoiPercent: number
  status: string
  createdAt: string
  planName?: string
  referenceId?: string | null
}

export type InvestmentSummaryStats = {
  totalInvested: number
  activeCount: number
  completedCount: number
  totalWeeklyEarnings: number
  totalDailyEarnings: number
  totalMonthlyEarnings: number
  totalProfitsEarned: number
  totalWithdrawn: number
  lifetimeRoi: number
  averageRoi: number
}

/** User-facing sequence label: INV-001, INV-002, … */
export function formatInvestmentDisplayId(sequence: number): string {
  return `INV-${String(sequence).padStart(3, '0')}`
}

export function resolveWeeklyRoiPercent(
  storedRoi: number | null | undefined,
  planName?: string | null
): number {
  if (storedRoi != null && storedRoi > 0) return storedRoi
  const meta = planName ? PLAN_UI_META[planName] : undefined
  if (!meta?.displayWeeklyRoi) return 0
  return toNumber(meta.displayWeeklyRoi.replace('%', ''))
}

/** Accumulated profit credited to the investment position (current_value − principal). */
export function calculateAccumulatedProfit(amount: number, currentValue: number): number {
  return Math.max(0, Math.round((currentValue - amount) * 100) / 100)
}

/** Target weekly earnings based on principal × weekly ROI. */
export function calculateWeeklyEarnings(amount: number, weeklyRoiPercent: number): number {
  return calculateWeeklyEarningsFromCalendar(amount, weeklyRoiPercent)
}

export function calculateDailyEarnings(amount: number, weeklyRoiPercent: number): number {
  return calculateDailyProfit({ principalUsd: amount, weeklyRoiPercent })
}

export function calculateMonthlyEarnings(amount: number, weeklyRoiPercent: number): number {
  if (amount <= 0 || weeklyRoiPercent <= 0) return 0
  return Math.round(calculateDailyEarnings(amount, weeklyRoiPercent) * 30 * 100) / 100
}

/** Next daily payout 24 hours after the reference timestamp. */
export function getNextWeeklyPayoutDate(from: Date = new Date()): Date {
  return getNextDailyPayoutAt(from)
}

export function isActiveInvestmentStatus(status: string | null | undefined): boolean {
  return String(status ?? '').toLowerCase() === 'active'
}

export function computeInvestmentSummaryStats(
  investments: InvestmentPositionInput[],
  completedCount = 0,
  totalWithdrawn = 0
): InvestmentSummaryStats {
  const active = investments.filter((row) => isActiveInvestmentStatus(row.status))
  const totalInvested = active.reduce((sum, row) => sum + row.amount, 0)
  const totalProfitsEarned = active.reduce(
    (sum, row) => sum + calculateAccumulatedProfit(row.amount, row.currentValue),
    0
  )
  const totalDailyEarnings = active.reduce(
    (sum, row) => sum + calculateDailyEarnings(row.amount, row.weeklyRoiPercent),
    0
  )
  const totalWeeklyEarnings = active.reduce(
    (sum, row) => sum + calculateWeeklyEarnings(row.amount, row.weeklyRoiPercent),
    0
  )
  const totalMonthlyEarnings = active.reduce(
    (sum, row) => sum + calculateMonthlyEarnings(row.amount, row.weeklyRoiPercent),
    0
  )
  const lifetimeRoi =
    totalInvested > 0 ? Math.round((totalProfitsEarned / totalInvested) * 10000) / 100 : 0
  const averageRoi =
    active.length > 0
      ? Math.round(
          active.reduce((sum, row) => {
            const roi = row.amount > 0 ? ((row.currentValue - row.amount) / row.amount) * 100 : 0
            return sum + roi
          }, 0) / active.length * 100
        ) / 100
      : 0

  return {
    totalInvested,
    activeCount: active.length,
    completedCount,
    totalWeeklyEarnings,
    totalDailyEarnings,
    totalMonthlyEarnings,
    totalProfitsEarned,
    totalWithdrawn,
    lifetimeRoi,
    averageRoi,
  }
}

export {
  getCapitalWithdrawalUnlockAt,
  isCapitalWithdrawalUnlocked,
  getCapitalLockProgress,
  getCapitalLockDaysRemaining,
  resolvePlanCapitalLockDays,
}

export function buildInvestmentSequenceMap(
  investments: Array<{ id: string; created_at: string }>
): Map<string, number> {
  const sorted = [...investments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  return new Map(sorted.map((row, index) => [row.id, index + 1]))
}
