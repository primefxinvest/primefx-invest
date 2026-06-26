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
        'relative flex cursor-pointer flex-col rounded-2xl border-2 p-3 transition-all sm:p-5',
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

      <h3 className="text-sm font-bold text-gray-900 sm:text-lg">{plan.name}</h3>

      <div className="mt-3 sm:mt-4">
        <p className={cn('text-xl font-bold sm:text-3xl', theme.roiColor)}>{plan.weeklyRoi}</p>
        <p className="text-[10px] text-gray-500 sm:text-xs">{plan.weeklyRoiLabel ?? 'Weekly Return'}</p>
      </div>

      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-xs sm:mt-5 sm:space-y-2.5 sm:pt-5 sm:text-sm">
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
        className={cn('mt-3 w-full rounded-xl py-2 text-xs font-semibold transition-colors sm:mt-5 sm:py-2.5 sm:text-sm', theme.button)}
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
