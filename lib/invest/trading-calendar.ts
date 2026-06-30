/** Gold (XAU/USD) performance uses Monday–Friday trading sessions only. */

export function isTradingDay(date: Date): boolean {
  const day = date.getUTCDay()
  return day >= 1 && day <= 5
}

export function countTradingDaysBetween(start: Date, end: Date): number {
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
  let count = 0

  while (cursor <= endUtc) {
    if (isTradingDay(cursor)) count += 1
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return count
}

export function getPreviousTradingWeek(): { start: Date; end: Date; tradingDays: number } {
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  while (!isTradingDay(end) || end.getUTCDay() !== 5) {
    end.setUTCDate(end.getUTCDate() - 1)
  }

  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 4)

  return {
    start,
    end,
    tradingDays: countTradingDaysBetween(start, end),
  }
}

export function weeklyProfitMultiplier(weeklyRoiPercent: number, tradingDays: number): number {
  const dailyRate = weeklyRoiPercent / 100 / 5
  return dailyRate * tradingDays
}
