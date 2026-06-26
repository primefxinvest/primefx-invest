'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPlanTheme, type InvestmentPlan } from '@/lib/invest/plan-config'

interface InvestPlanCardProps {
  plan: InvestmentPlan
  index?: number
  selected?: boolean
  onSelect: (plan: InvestmentPlan) => void
  onInvest: (plan: InvestmentPlan) => void
}

export default function InvestPlanCard({ plan, index = 0, selected, onSelect, onInvest }: InvestPlanCardProps) {
  const theme = getPlanTheme(plan, index)
  const Icon = theme.icon

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(plan)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(plan)
      }}
      className={cn(
        'relative flex cursor-pointer flex-col rounded-2xl border-2 p-5 transition-all',
        theme.card,
        selected && 'shadow-lg'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">
          <Star className="h-3 w-3 fill-white" />
          MOST POPULAR
        </div>
      )}

      <span className={cn('mb-3 inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide', theme.badge)}>
        {plan.badge}
      </span>

      <div className={cn('mb-3 flex h-11 w-11 items-center justify-center rounded-xl', theme.iconBg)}>
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>

      <div className="mt-4">
        <p className={cn('text-3xl font-bold', theme.roiColor)}>{plan.weeklyRoi}</p>
        <p className="text-xs text-gray-500">{plan.weeklyRoiLabel ?? 'Weekly Return'}</p>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-5 text-sm">
        <Row label="Minimum" value={plan.minInvestment} />
        <Row label="Duration" value={plan.duration} />
        <Row label="Payout" value={plan.payout} />
        <Row label="Risk Level" value={plan.riskLevel} valueClassName={theme.riskColor} />
        <Row label="Capital Access" value={plan.capitalAccess} />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onInvest(plan)
        }}
        className={cn('mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors', theme.button)}
      >
        Invest Now
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">{plan.investors} investors</p>
    </div>
  )
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className={cn('font-semibold text-gray-900', valueClassName)}>{value}</span>
    </div>
  )
}
