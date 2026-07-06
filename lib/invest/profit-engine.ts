/**
 * Calendar-based daily profit engine.
 * daily_rate = weekly_return_percent / 7
 * daily_profit = principal × daily_rate
 */

const PROFIT_SCALE = 100
const RATE_SCALE = 1_000_000

export function calculateDailyRate(weeklyRoiPercent: number): number {
  if (!Number.isFinite(weeklyRoiPercent) || weeklyRoiPercent <= 0) return 0
  return weeklyRoiPercent / 100 / 7
}

export function roundProfitUsd(value: number): number {
  return Math.round(value * PROFIT_SCALE) / PROFIT_SCALE
}

export function roundRate(value: number): number {
  return Math.round(value * RATE_SCALE) / RATE_SCALE
}

export function calculateDailyProfit(input: {
  principalUsd: number
  weeklyRoiPercent: number
  compoundMode?: boolean
  currentValueUsd?: number
}): number {
  const { principalUsd, weeklyRoiPercent, compoundMode = false, currentValueUsd } = input
  if (principalUsd <= 0 || weeklyRoiPercent <= 0) return 0

  const base = compoundMode ? Number(currentValueUsd ?? principalUsd) : principalUsd
  if (base <= 0) return 0

  return roundProfitUsd(base * calculateDailyRate(weeklyRoiPercent))
}

export function calculateWeeklyEarningsFromCalendar(
  principalUsd: number,
  weeklyRoiPercent: number
): number {
  if (principalUsd <= 0 || weeklyRoiPercent <= 0) return 0
  return roundProfitUsd(principalUsd * (weeklyRoiPercent / 100))
}

export function calculateMonthlyEarningsFromCalendar(
  principalUsd: number,
  weeklyRoiPercent: number
): number {
  return roundProfitUsd(calculateWeeklyEarningsFromCalendar(principalUsd, weeklyRoiPercent) * (30 / 7))
}

export function getNextDailyPayoutAt(from: Date = new Date()): Date {
  const next = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1, 0, 0, 0, 0)
  )
  return next
}

export function getPreviousCalendarDay(from: Date = new Date()): Date {
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  )
  cursor.setUTCDate(cursor.getUTCDate() - 1)
  return cursor
}

export function formatProfitPeriodDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getCapitalWithdrawalUnlockAt(
  createdAt: string | Date,
  lockDays: number
): Date | null {
  if (lockDays <= 0) return null
  const created = new Date(createdAt)
  const unlock = new Date(created.getTime())
  unlock.setUTCDate(unlock.getUTCDate() + lockDays)
  return unlock
}

export function isCapitalWithdrawalUnlocked(
  unlockAt: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!unlockAt) return true
  return new Date(unlockAt).getTime() <= now.getTime()
}

export function getCapitalLockRemainingMs(
  unlockAt: string | Date,
  now: Date = new Date()
): number {
  return Math.max(0, new Date(unlockAt).getTime() - now.getTime())
}

export function formatCapitalLockCountdown(unlockAt: string | Date, now: Date = new Date()): string {
  const ms = getCapitalLockRemainingMs(unlockAt, now)
  if (ms <= 0) return 'Available now'

  const totalMinutes = Math.floor(ms / 60_000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ${hours} hour${hours === 1 ? '' : 's'}`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} min`
  return `${minutes} min`
}

export function getCapitalLockProgress(
  createdAt: string | Date,
  unlockAt: string | Date,
  now: Date = new Date()
): number {
  const start = new Date(createdAt).getTime()
  const end = new Date(unlockAt).getTime()
  if (end <= start) return 100
  const elapsed = now.getTime() - start
  const total = end - start
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

export function getCapitalLockDaysRemaining(
  unlockAt: string | Date,
  now: Date = new Date()
): number {
  const ms = getCapitalLockRemainingMs(unlockAt, now)
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export const STARTER_PLAN_LOCK_DAYS = 7

export function resolvePlanCapitalLockDays(planName: string, dbLockDays?: number | null): number {
  if (dbLockDays != null && dbLockDays > 0) return dbLockDays
  if (planName === 'Starter Plan') return STARTER_PLAN_LOCK_DAYS
  return 0
}
