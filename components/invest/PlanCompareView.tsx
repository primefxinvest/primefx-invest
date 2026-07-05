'use client'

import { memo } from 'react'
import { Check, X } from 'lucide-react'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import { getPlanTheme } from '@/lib/invest/plan-config'
import { cn } from '@/lib/utils'

interface PlanCompareViewProps {
  plans: InvestmentPlan[]
  onInvest: (plan: InvestmentPlan) => void
}

const compareRows: { key: keyof InvestmentPlan; label: string }[] = [
  { key: 'weeklyRoi', label: 'Weekly Return' },
  { key: 'minInvestment', label: 'Minimum' },
  { key: 'duration', label: 'Duration' },
  { key: 'payout', label: 'Payout' },
  { key: 'targetInvestor', label: 'Target Investor' },
  { key: 'capitalAccess', label: 'Capital Access' },
  { key: 'investors', label: 'Investors' },
]

function PlanCompareView({ plans, onInvest }: PlanCompareViewProps) {
  if (!plans.length) return null

  return (
    <>
      {/* Mobile: stacked plan cards — no horizontal scroll */}
      <div className="space-y-4 md:hidden">
        {plans.map((plan, idx) => {
          const theme = getPlanTheme(plan, idx)
          const Icon = theme.icon
          return (
            <article
              key={plan.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', theme.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  <span
                    className={cn(
                      'mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide',
                      theme.badge
                    )}
                  >
                    {plan.category}
                  </span>
                  {plan.popular ? (
                    <span className="ml-1.5 inline-block rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white">
                      POPULAR
                    </span>
                  ) : null}
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {compareRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500">{row.label}</dt>
                    <dd className="text-right font-semibold text-gray-900">
                      {String(plan[row.key] ?? '—')}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500">Capital Protection</dt>
                  <dd>
                    <Check className="h-5 w-5 text-emerald-500" aria-label="Yes" />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500">AI Strategy</dt>
                  <dd>
                    {idx === 0 ? (
                      <X className="h-5 w-5 text-gray-300" aria-label="No" />
                    ) : (
                      <Check className="h-5 w-5 text-emerald-500" aria-label="Yes" />
                    )}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => onInvest(plan)}
                className={cn(
                  'mt-4 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold',
                  theme.button
                )}
              >
                Invest Now
              </button>
            </article>
          )
        })}
      </div>

      {/* Tablet / desktop comparison table */}
      <div className="hidden md:block">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[22%]" />
            {plans.map((plan) => (
              <col key={plan.id} style={{ width: `${78 / plans.length}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Feature
              </th>
              {plans.map((plan, idx) => {
                const theme = getPlanTheme(plan, idx)
                const Icon = theme.icon
                return (
                  <th key={plan.id} className="px-3 py-4 text-center">
                    <div className="mx-auto flex max-w-[9rem] flex-col items-center gap-2">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', theme.iconBg)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold leading-tight text-gray-900 sm:text-sm">{plan.name}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wide',
                          theme.badge
                        )}
                      >
                        {plan.category}
                      </span>
                      {plan.popular && (
                        <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white">
                          POPULAR
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row, rowIndex) => (
              <tr
                key={row.label}
                className={cn('border-b border-gray-50', rowIndex % 2 === 1 && 'bg-gray-50/40')}
              >
                <td className="px-4 py-3.5 text-sm font-medium text-gray-500">{row.label}</td>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    className="px-3 py-3.5 text-center text-xs font-semibold tabular-nums text-gray-900 sm:text-sm"
                  >
                    {String(plan[row.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-gray-50 bg-gray-50/40">
              <td className="px-4 py-3.5 text-sm font-medium text-gray-500">Capital Protection</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-3 py-3 text-center">
                  <Check className="mx-auto h-5 w-5 text-emerald-500" />
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-500">AI Strategy</td>
              {plans.map((plan, idx) => (
                <td key={plan.id} className="px-3 py-3 text-center">
                  {idx === 0 ? (
                    <X className="mx-auto h-5 w-5 text-gray-300" />
                  ) : (
                    <Check className="mx-auto h-5 w-5 text-emerald-500" />
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-4" />
              {plans.map((plan, idx) => {
                const theme = getPlanTheme(plan, idx)
                return (
                  <td key={plan.id} className="px-3 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onInvest(plan)}
                      className={cn(
                        'w-full max-w-[9rem] rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4',
                        theme.button
                      )}
                    >
                      Invest Now
                    </button>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default memo(PlanCompareView)
