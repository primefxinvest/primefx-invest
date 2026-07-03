export type EarningsChartPoint = {
  label: string
  earnings: number
  potential: number
}

export type EarningsTimelineDay = {
  date: string
  amount: number
}

export type ReferralChartPeriod = 30 | 90 | 365

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short' })
}

function buildDailyAmountMap(timeline: EarningsTimelineDay[]) {
  const map = new Map<string, number>()
  for (const row of timeline) {
    map.set(row.date, (map.get(row.date) ?? 0) + row.amount)
  }
  return map
}

function buildCumulativeSeries(
  points: Array<{ label: string; amount: number }>
): EarningsChartPoint[] {
  let cumulative = 0
  return points.map(({ label, amount }) => {
    cumulative += amount
    const earnings = Math.round(cumulative * 100) / 100
    return {
      label,
      earnings,
      potential: Math.round(earnings * 1.1 * 100) / 100,
    }
  })
}

function enumerateDays(end: Date, count: number) {
  const days: Date[] = []
  const cursor = startOfDay(end)
  cursor.setDate(cursor.getDate() - (count - 1))

  for (let index = 0; index < count; index += 1) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function buildDailyEarningsTimeline(
  rows: Array<{ commission_usd: unknown; created_at: string }>,
  daysBack = 365
): EarningsTimelineDay[] {
  const cutoff = startOfDay(new Date())
  cutoff.setDate(cutoff.getDate() - (daysBack - 1))

  const daily = new Map<string, number>()

  for (const row of rows) {
    const created = new Date(row.created_at)
    if (Number.isNaN(created.getTime()) || created < cutoff) continue
    const key = toDateKey(startOfDay(created))
    daily.set(key, (daily.get(key) ?? 0) + Number(row.commission_usd ?? 0))
  }

  return [...daily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
}

export function buildEarningsChartForPeriod(
  timeline: EarningsTimelineDay[],
  period: ReferralChartPeriod,
  fallbackTotal = 0
): EarningsChartPoint[] {
  const hasData = timeline.some((row) => row.amount > 0)
  const dailyMap = buildDailyAmountMap(hasData ? timeline : buildSyntheticTimeline(fallbackTotal, 365))
  const now = startOfDay(new Date())

  if (period === 30) {
    const days = enumerateDays(now, 30)
    return buildCumulativeSeries(
      days.map((day) => ({
        label: formatDayLabel(day),
        amount: dailyMap.get(toDateKey(day)) ?? 0,
      }))
    )
  }

  if (period === 90) {
    const days = enumerateDays(now, 90)
    const weekly = new Map<string, { label: string; amount: number }>()

    for (const day of days) {
      const weekStart = startOfDay(day)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const key = toDateKey(weekStart)
      const bucket = weekly.get(key) ?? { label: formatDayLabel(weekStart), amount: 0 }
      bucket.amount += dailyMap.get(toDateKey(day)) ?? 0
      weekly.set(key, bucket)
    }

    return buildCumulativeSeries(
      [...weekly.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => ({
          label: value.label,
          amount: Math.round(value.amount * 100) / 100,
        }))
    )
  }

  const monthBuckets = new Map<string, { label: string; amount: number; sortKey: string }>()
  const days = enumerateDays(now, 365)

  for (const day of days) {
    const sortKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`
    const bucket = monthBuckets.get(sortKey) ?? {
      label: formatMonthLabel(day),
      amount: 0,
      sortKey,
    }
    bucket.amount += dailyMap.get(toDateKey(day)) ?? 0
    monthBuckets.set(sortKey, bucket)
  }

  return buildCumulativeSeries(
    [...monthBuckets.values()]
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ label, amount }) => ({
        label,
        amount: Math.round(amount * 100) / 100,
      }))
  )
}

function buildSyntheticTimeline(total: number, daysBack: number): EarningsTimelineDay[] {
  if (total <= 0) return []

  const now = startOfDay(new Date())
  const days = enumerateDays(now, daysBack)
  const weight = total / days.length

  return days.map((day, index) => ({
    date: toDateKey(day),
    amount: Math.round(weight * (0.6 + (index % 7) * 0.08) * 100) / 100,
  }))
}

export function getChartAxisInterval(period: ReferralChartPeriod, pointCount: number) {
  if (period === 30) return Math.max(0, Math.floor(pointCount / 6) - 1)
  return 0
}
