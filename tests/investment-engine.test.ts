import { describe, expect, it } from 'vitest'
import {
  calculateDailyProfit,
  calculateDailyRate,
  countDueProfitPeriods,
  formatProfitPeriodDate,
  getDueProfitPeriods,
  getNextDailyPayoutAt,
  MS_PER_DAY,
  roundProfitUsd,
} from '@/lib/invest/profit-engine'
import {
  getProfitShareRate,
  REFERRAL_INVESTMENT_COMMISSION_RATE,
  REFERRAL_PROFIT_SHARE_LEVELS,
} from '@/lib/referral/program-config'

describe('daily profit engine', () => {
  it('calculates daily rate as weekly ROI / 7', () => {
    expect(calculateDailyRate(7)).toBeCloseTo(0.01, 10)
    expect(calculateDailyRate(3.5)).toBeCloseTo(0.005, 10)
    expect(calculateDailyRate(0)).toBe(0)
  })

  it('credits non-compound profit from principal', () => {
    const profit = calculateDailyProfit({
      principalUsd: 1000,
      weeklyRoiPercent: 7,
      compoundMode: false,
    })
    expect(profit).toBe(10)
  })

  it('credits compound profit from current value', () => {
    const profit = calculateDailyProfit({
      principalUsd: 1000,
      weeklyRoiPercent: 7,
      compoundMode: true,
      currentValueUsd: 1100,
    })
    expect(profit).toBe(11)
  })

  it('lists due 24h periods without duplicates', () => {
    const startAt = new Date('2026-07-01T12:00:00.000Z')
    const now = new Date('2026-07-04T12:00:00.000Z')
    const due = getDueProfitPeriods({
      startAt,
      existingPeriodDates: new Set(),
      now,
    })

    expect(due).toHaveLength(3)
    expect(due.map((row) => row.periodDate)).toEqual([
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
    ])
  })

  it('skips already credited period dates (idempotency)', () => {
    const startAt = new Date('2026-07-01T12:00:00.000Z')
    const now = new Date('2026-07-04T12:00:00.000Z')
    const due = getDueProfitPeriods({
      startAt,
      existingPeriodDates: new Set(['2026-07-02', '2026-07-03']),
      now,
    })

    expect(due).toHaveLength(1)
    expect(due[0].periodDate).toBe('2026-07-04')
    expect(countDueProfitPeriods({
      startAt,
      existingPeriodDates: new Set(['2026-07-02', '2026-07-03', '2026-07-04']),
      now,
    })).toBe(0)
  })

  it('does not credit before the first 24h boundary', () => {
    const startAt = new Date('2026-07-10T10:00:00.000Z')
    const now = new Date('2026-07-10T20:00:00.000Z')
    expect(
      getDueProfitPeriods({
        startAt,
        existingPeriodDates: new Set(),
        now,
      })
    ).toHaveLength(0)
  })

  it('advances next payout by exactly one day', () => {
    const from = new Date('2026-07-11T22:00:00.000Z')
    const next = getNextDailyPayoutAt(from)
    expect(next.getTime() - from.getTime()).toBe(MS_PER_DAY)
    expect(formatProfitPeriodDate(next)).toBe('2026-07-12')
  })

  it('rounds profit to cents', () => {
    expect(roundProfitUsd(1.006)).toBe(1.01)
    expect(roundProfitUsd(1.004)).toBe(1)
    expect(roundProfitUsd(10.125)).toBe(10.13)
  })
})

describe('referral commission rates', () => {
  it('keeps configured L1–L4 profit share rates', () => {
    expect(getProfitShareRate(1)).toBe(0.05)
    expect(getProfitShareRate(2)).toBe(0.02)
    expect(getProfitShareRate(3)).toBe(0.01)
    expect(getProfitShareRate(4)).toBe(0.005)
    expect(getProfitShareRate(99)).toBe(0)
    expect(REFERRAL_PROFIT_SHARE_LEVELS).toHaveLength(4)
  })

  it('calculates one-time investment commission at 2%', () => {
    expect(REFERRAL_INVESTMENT_COMMISSION_RATE).toBe(0.02)
    const commission = Math.round(500 * REFERRAL_INVESTMENT_COMMISSION_RATE * 100) / 100
    expect(commission).toBe(10)
  })

  it('calculates multi-level profit share from a daily profit', () => {
    const profit = 20
    const total = REFERRAL_PROFIT_SHARE_LEVELS.reduce((sum, level) => {
      return sum + Math.round(profit * level.rate * 100) / 100
    }, 0)
    // 5% + 2% + 1% + 0.5% of $20 = $1 + $0.40 + $0.20 + $0.10
    expect(total).toBe(1.7)
  })
})
