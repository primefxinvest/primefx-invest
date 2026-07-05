import { weeklyProfitMultiplier } from '@/lib/invest/trading-calendar'
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
  totalWeeklyEarnings: number
  totalProfitsEarned: number
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

/** Target weekly earnings based on principal × weekly ROI (not compounded). */
export function calculateWeeklyEarnings(amount: number, weeklyRoiPercent: number): number {
  if (amount <= 0 || weeklyRoiPercent <= 0) return 0
  return Math.round(amount * weeklyProfitMultiplier(weeklyRoiPercent, 5) * 100) / 100
}

/** Next weekly payout lands on the upcoming Friday (UTC). */
export function getNextWeeklyPayoutDate(from: Date = new Date()): Date {
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  )
  const day = cursor.getUTCDay()
  let daysUntilFriday = (5 - day + 7) % 7
  if (daysUntilFriday === 0) {
    daysUntilFriday = 7
  }
  cursor.setUTCDate(cursor.getUTCDate() + daysUntilFriday)
  return cursor
}

export function isActiveInvestmentStatus(status: string | null | undefined): boolean {
  return String(status ?? '').toLowerCase() === 'active'
}

export function computeInvestmentSummaryStats(
  investments: InvestmentPositionInput[]
): InvestmentSummaryStats {
  const active = investments.filter((row) => isActiveInvestmentStatus(row.status))

  return {
    totalInvested: active.reduce((sum, row) => sum + row.amount, 0),
    activeCount: active.length,
    totalWeeklyEarnings: active.reduce(
      (sum, row) => sum + calculateWeeklyEarnings(row.amount, row.weeklyRoiPercent),
      0
    ),
    totalProfitsEarned: active.reduce(
      (sum, row) => sum + calculateAccumulatedProfit(row.amount, row.currentValue),
      0
    ),
  }
}

export function buildInvestmentSequenceMap(
  investments: Array<{ id: string; created_at: string }>
): Map<string, number> {
  const sorted = [...investments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  return new Map(sorted.map((row, index) => [row.id, index + 1]))
}
