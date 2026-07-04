import { toNumber } from '@/lib/data/format'
import type { ChartPoint } from '@/lib/data/types'

export type PortfolioChartPeriod =
  | '1M'
  | '6M'
  | '1Y'
  | '3Y'
  | 'All'
  | 'This Year'
  | 'Last Month'
  | 'Last 3 Months'

type PortfolioEvent = { at: Date; delta: number }

type TransactionRow = {
  type?: string | null
  amount?: unknown
  status?: string | null
  description?: string | null
  created_at: string
}

type InvestmentRow = {
  amount?: unknown
  current_value?: unknown
  status?: string | null
  created_at: string
  end_date?: string | null
  updated_at?: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isCompleted(status?: string | null) {
  return (status ?? '').toLowerCase() === 'completed'
}

function transactionPortfolioDelta(tx: TransactionRow): number | null {
  if (!isCompleted(tx.status)) return null

  const type = (tx.type ?? '').toLowerCase()
  const amount = Math.abs(toNumber(tx.amount as string | number | null | undefined))
  if (amount <= 0) return null

  const description = (tx.description ?? '').toLowerCase()

  if (type === 'profit') return amount

  if (type === 'investment') {
    if (description.includes('withdrawal requested')) return null
    if (
      description.includes('capital returned') ||
      description.includes('capital withdrawal') ||
      description.includes('capital returned to wallet')
    ) {
      return -amount
    }
    return amount
  }

  return null
}

function investmentPortfolioEvents(investment: InvestmentRow): PortfolioEvent[] {
  const amount = toNumber(investment.amount as string | number | null | undefined)
  if (amount <= 0) return []

  const events: PortfolioEvent[] = [{ at: new Date(investment.created_at), delta: amount }]
  const status = (investment.status ?? '').toLowerCase()

  if (status === 'closed' || status === 'completed' || status === 'cancelled') {
    const closedAt = investment.end_date ?? investment.updated_at ?? investment.created_at
    const returned = toNumber(investment.current_value as string | number | null | undefined)
    const removed = returned > 0 ? returned : amount
    events.push({ at: new Date(closedAt), delta: -removed })
  }

  return events
}

export function buildPortfolioEvents(
  transactions: TransactionRow[],
  investments: InvestmentRow[]
): PortfolioEvent[] {
  const events: PortfolioEvent[] = []
  let hasInvestmentCredits = false

  for (const tx of transactions) {
    const delta = transactionPortfolioDelta(tx)
    if (delta == null) continue
    events.push({ at: new Date(tx.created_at), delta })
    if (delta > 0 && (tx.type ?? '').toLowerCase() === 'investment') {
      hasInvestmentCredits = true
    }
  }

  if (!hasInvestmentCredits) {
    for (const investment of investments) {
      events.push(...investmentPortfolioEvents(investment))
    }
  }

  return events.sort((a, b) => a.at.getTime() - b.at.getTime())
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function cumulativeValueAt(events: PortfolioEvent[], at: Date) {
  const cutoff = at.getTime()
  return events.reduce((sum, event) => (event.at.getTime() <= cutoff ? sum + event.delta : sum), 0)
}

function resolvePeriodRange(period: PortfolioChartPeriod): { start: Date; end: Date } {
  const end = endOfDay(new Date())
  const start = startOfDay(new Date(end))

  switch (period) {
    case '1M':
      start.setDate(start.getDate() - 29)
      break
    case 'Last Month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'Last 3 Months':
      start.setMonth(start.getMonth() - 2)
      start.setDate(1)
      break
    case '6M':
      start.setMonth(start.getMonth() - 5)
      start.setDate(1)
      break
    case '1Y':
    case 'This Year':
      start.setMonth(0, 1)
      break
    case '3Y':
      start.setFullYear(start.getFullYear() - 3)
      start.setDate(1)
      break
    case 'All':
      start.setFullYear(2000, 0, 1)
      break
    default:
      start.setMonth(0, 1)
  }

  return { start, end }
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMonthLabel(date: Date) {
  return MONTHS[date.getMonth()]
}

function buildDailyPoints(
  events: PortfolioEvent[],
  start: Date,
  end: Date,
  currentValue: number
): ChartPoint[] {
  const points: ChartPoint[] = []
  const cursor = startOfDay(start)
  const lastDay = startOfDay(end)

  while (cursor.getTime() <= lastDay.getTime()) {
    const dayEnd = endOfDay(cursor)
    points.push({
      month: formatDayLabel(cursor),
      value: Math.max(0, Math.round(cumulativeValueAt(events, dayEnd))),
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  if (points.length > 0 && currentValue > 0) {
    points[points.length - 1].value = Math.round(currentValue)
  }

  return points
}

function buildMonthlyPoints(
  events: PortfolioEvent[],
  start: Date,
  end: Date,
  currentValue: number
): ChartPoint[] {
  const points: ChartPoint[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor.getTime() <= endMonth.getTime()) {
    const monthEnd = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0))
    const effectiveEnd = monthEnd.getTime() > end.getTime() ? end : monthEnd
    points.push({
      month: formatMonthLabel(cursor),
      value: Math.max(0, Math.round(cumulativeValueAt(events, effectiveEnd))),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  if (points.length > 0 && currentValue > 0) {
    points[points.length - 1].value = Math.round(currentValue)
  }

  return points
}

export function buildPortfolioChartData(input: {
  transactions: TransactionRow[]
  investments: InvestmentRow[]
  currentValue: number
  period?: PortfolioChartPeriod
}): ChartPoint[] {
  const period = input.period ?? 'This Year'
  const events = buildPortfolioEvents(input.transactions, input.investments)
  const { start, end } = resolvePeriodRange(period)

  if (events.length === 0) {
    if (input.currentValue > 0) {
      return [{ month: formatMonthLabel(end), value: Math.round(input.currentValue) }]
    }
    return []
  }

  const firstEvent = events[0]?.at
  const effectiveStart =
    firstEvent && firstEvent.getTime() > start.getTime() ? startOfDay(firstEvent) : start

  const useDaily = period === '1M' || period === 'Last Month'
  const points = useDaily
    ? buildDailyPoints(events, effectiveStart, end, input.currentValue)
    : buildMonthlyPoints(events, effectiveStart, end, input.currentValue)

  return points.filter((point) => point.value >= 0)
}

export function buildMonthlyReturnPoints(chart: ChartPoint[]): ChartPoint[] {
  return chart.map((point, index, arr) => {
    const prev = index > 0 ? arr[index - 1].value : point.value
    const change = prev > 0 ? ((point.value - prev) / prev) * 100 : 0
    return { month: point.month, value: Math.round(change * 10) / 10 }
  })
}

export function computePortfolioPerformanceStats(monthlyReturns: ChartPoint[]) {
  if (!monthlyReturns.length) {
    return {
      bestMonth: '0%',
      avgMonthlyReturn: '0%',
      winningMonths: '0',
      maxDrawdown: '0%',
    }
  }

  const nonZero = monthlyReturns.filter((row) => row.value !== 0)
  const sample = nonZero.length ? nonZero : monthlyReturns
  const positive = sample.filter((row) => row.value > 0)
  const best = sample.reduce((max, row) => (row.value > max.value ? row : max), sample[0])
  const worst = sample.reduce((min, row) => (row.value < min.value ? row : min), sample[0])
  const avg = sample.reduce((sum, row) => sum + row.value, 0) / sample.length

  return {
    bestMonth: `${best.value >= 0 ? '+' : ''}${best.value.toFixed(1)}%`,
    avgMonthlyReturn: `${avg >= 0 ? '+' : ''}${avg.toFixed(1)}%`,
    winningMonths: String(positive.length),
    maxDrawdown: `${worst.value >= 0 ? '+' : ''}${worst.value.toFixed(1)}%`,
  }
}
