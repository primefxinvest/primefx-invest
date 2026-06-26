'use client'

import { Check, X } from 'lucide-react'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import { getPlanTheme } from '@/lib/invest/plan-config'
import { cn } from '@/lib/utils'

interface PlanCompareViewProps {
  plans: InvestmentPlan[]
  onInvest: (plan: InvestmentPlan) => void
}

const compareRows: { key: keyof InvestmentPlan | 'capital'; label: string }[] = [
  { key: 'weeklyRoi', label: 'Weekly Return' },
  { key: 'minInvestment', label: 'Minimum' },
  { key: 'duration', label: 'Duration' },
  { key: 'payout', label: 'Payout' },
  { key: 'riskLevel', label: 'Risk Level' },
  { key: 'capitalAccess', label: 'Capital Access' },
  { key: 'investors', label: 'Investors' },
]

export default function PlanCompareView({ plans, onInvest }: PlanCompareViewProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-4 text-left font-semibold text-gray-500">Feature</th>
            {plans.map((plan, idx) => {
              const theme = getPlanTheme(plan, idx)
              const Icon = theme.icon
              return (
                <th key={plan.id} className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', theme.iconBg)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-gray-900">{plan.name}</span>
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
          {compareRows.map((row) => (
            <tr key={row.label} className="border-b border-gray-50">
              <td className="px-4 py-3 font-medium text-gray-500">{row.label}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-center font-semibold text-gray-900">
                  {String(plan[row.key as keyof InvestmentPlan] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="px-4 py-4 font-medium text-gray-500">Capital Protection</td>
            {plans.map((plan) => (
              <td key={plan.id} className="px-4 py-4 text-center">
                <Check className="mx-auto h-5 w-5 text-emerald-500" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-4 font-medium text-gray-500">AI Strategy</td>
            {plans.map((plan) => (
              <td key={plan.id} className="px-4 py-4 text-center">
                {plan.id === '1' ? (
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
                <td key={plan.id} className="px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onInvest(plan)}
                    className={cn('rounded-xl px-4 py-2 text-xs font-semibold transition-colors', theme.button)}
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
