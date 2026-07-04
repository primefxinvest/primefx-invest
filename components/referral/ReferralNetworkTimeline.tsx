'use client'

import { SectionHeading } from '@/components/shared/SectionHeading'
import { REFERRAL_NETWORK_LEVELS } from '@/lib/referral/display-config'
import { formatCurrency } from '@/lib/data/format'

export function ReferralNetworkTimeline() {
  return (
    <section aria-label="Four-level network" className="space-y-4">
      <SectionHeading>Your 4-level network</SectionHeading>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <ol className="divide-y divide-border">
          {REFERRAL_NETWORK_LEVELS.map((level, index) => (
            <li key={level.level} className="relative">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
                <div className="flex shrink-0 items-start gap-4 sm:w-48">
                  <div className="relative flex flex-col items-center">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                      style={{ backgroundColor: level.color }}
                    >
                      L{level.level}
                    </span>
                    {index < REFERRAL_NETWORK_LEVELS.length - 1 ? (
                      <span
                        className="mt-2 hidden h-full min-h-[3rem] w-px border-l-2 border-dashed border-border sm:block"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="text-base font-bold text-foreground">{level.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{level.description}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 sm:pt-1">
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: level.color }}
                  >
                    Commission: {level.rate}
                  </span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Example: {formatCurrency(level.exampleProfit)} weekly profit generated
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right sm:min-w-[140px]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    You earn
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-600">
                    {formatCurrency(level.exampleEarning)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
