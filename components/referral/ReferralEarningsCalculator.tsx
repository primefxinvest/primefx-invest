'use client'

import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { REFERRAL_DISPLAY_PROFIT_SHARE } from '@/lib/referral/display-config'
import { formatCurrency } from '@/lib/data/format'
import { cn } from '@/lib/utils'

const MIN_PROFIT = 1_000
const MAX_PROFIT = 250_000
const STEP = 500

const LEVEL_COLORS = ['#0052ff', '#10b981', '#f97316', '#8b5cf6']

function parseRate(rate: string): number {
  return parseFloat(rate.replace('%', '')) / 100
}

export function ReferralEarningsCalculator() {
  const [profit, setProfit] = useState(10_000)

  const breakdown = useMemo(() => {
    return REFERRAL_DISPLAY_PROFIT_SHARE.map((row, index) => {
      const amount = profit * parseRate(row.rate)
      return {
        level: row.level,
        label: row.label,
        rate: row.rate,
        amount,
        color: LEVEL_COLORS[index] ?? '#0052ff',
      }
    })
  }, [profit])

  const total = breakdown.reduce((sum, row) => sum + row.amount, 0)

  return (
    <section aria-label="Earnings calculator" className="space-y-4">
      <SectionHeading>Earnings calculator</SectionHeading>
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-emerald-50/30 shadow-sm">
        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-foreground">Simulate your weekly earnings</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust network profit to see level-by-level payout estimates.
              </p>
            </div>
          </div>

          <div className="min-w-0 lg:px-4">
            <label htmlFor="network-profit" className="mb-2 block text-sm font-medium text-foreground">
              Network profit generated
            </label>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(profit)}
              </p>
            </div>
            <input
              id="network-profit"
              type="range"
              min={MIN_PROFIT}
              max={MAX_PROFIT}
              step={STEP}
              value={profit}
              onChange={(e) => setProfit(Number(e.target.value))}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>$1K</span>
              <span>$250K+</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total weekly earnings
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-600">
              {formatCurrency(total)}
            </p>
            <ul className="mt-4 space-y-2">
              {breakdown.map((row) => (
                <li key={row.level} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                    Level {row.level} ({row.rate})
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-emerald-200/60 bg-emerald-50/60 px-5 py-3 text-center text-sm font-medium text-emerald-800 sm:px-6">
          Transparent payouts — no recruitment fees. Earnings based on verified investor activity only.
        </div>
      </div>
    </section>
  )
}
