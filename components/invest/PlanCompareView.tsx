'use client'

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
  { key: 'riskLevel', label: 'Risk Level' },
  { key: 'capitalAccess', label: 'Capital Access' },
  { key: 'investors', label: 'Investors' },
]

export default function PlanCompareView({ plans, onInvest }: PlanCompareViewProps) {
  if (!plans.length) return null

  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[640px] table-fixed text-sm">
        <colgroup>
          <col className="w-[22%]" />
          {plans.map((plan) => (
            <col key={plan.id} style={{ width: `${78 / plans.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
              Feature
            </th>
            {plans.map((plan, idx) => {
              const theme = getPlanTheme(plan, idx)
              const Icon = theme.icon
              return (
                <th key={plan.id} className="px-3 py-4 text-center sm:px-4">
                  <div className="mx-auto flex max-w-[9rem] flex-col items-center gap-2">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', theme.iconBg)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight text-gray-900 sm:text-sm">{plan.name}</span>
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
              className={cn(
                'border-b border-gray-50',
                rowIndex % 2 === 1 && 'bg-gray-50/40'
              )}
            >
              <td className="px-4 py-3.5 text-sm font-medium text-gray-500 sm:px-6">{row.label}</td>
              {plans.map((plan, idx) => {
                const theme = getPlanTheme(plan, idx)
                return (
                  <td
                    key={plan.id}
                    className={cn(
                      'px-3 py-3.5 text-center text-xs font-semibold tabular-nums text-gray-900 sm:px-4 sm:text-sm',
                      row.key === 'riskLevel' && theme.riskColor
                    )}
                  >
                    {String(plan[row.key] ?? '—')}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="border-b border-gray-50 bg-gray-50/40">
            <td className="px-4 py-3.5 text-sm font-medium text-gray-500 sm:px-6">Capital Protection</td>
            {plans.map((plan) => (
              <td key={plan.id} className="px-3 py-3 text-center sm:px-4">
                <Check className="mx-auto h-5 w-5 text-emerald-500" />
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-500 sm:px-6">AI Strategy</td>
            {plans.map((plan, idx) => (
              <td key={plan.id} className="px-3 py-3 text-center sm:px-4">
                {idx === 0 ? (
                  <X className="mx-auto h-5 w-5 text-gray-300" />
                ) : (
                  <Check className="mx-auto h-5 w-5 text-emerald-500" />
                )}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-4 sm:px-6" />
            {plans.map((plan, idx) => {
              const theme = getPlanTheme(plan, idx)
              return (
                <td key={plan.id} className="px-3 py-4 text-center sm:px-4">
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
  )
}
