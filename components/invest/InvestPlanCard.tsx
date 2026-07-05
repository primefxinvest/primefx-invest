'use client'

import { memo } from 'react'
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Crown,
  Globe,
  Info,
  Shield,
  Star,
  User,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPlanTheme, type InvestmentPlan } from '@/lib/invest/plan-config'

interface InvestPlanCardProps {
  plan: InvestmentPlan
  index?: number
  selected?: boolean
  onSelect: (plan: InvestmentPlan) => void
  onInvest: (plan: InvestmentPlan) => void
}

function InvestPlanCard({
  plan,
  index = 0,
  selected,
  onSelect,
  onInvest,
}: InvestPlanCardProps) {
  const theme = getPlanTheme(plan, index)
  const Icon = theme.icon
  const isElite = plan.name === 'Elite Plan'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(plan)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(plan)
      }}
      className={cn(
        'relative flex h-full cursor-pointer flex-col rounded-2xl border p-4 transition-all sm:p-5',
        theme.card,
        selected && 'shadow-lg'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-md">
          <Star className="h-3 w-3 fill-white" />
          MOST POPULAR
        </div>
      )}

      <span
        className={cn(
          'mb-4 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide',
          theme.badge
        )}
      >
        {isElite && <Crown className="h-3 w-3" />}
        {plan.badge}
      </span>

      <div
        className={cn(
          'mb-4 flex h-24 items-center justify-center rounded-2xl bg-gradient-to-b sm:h-28',
          theme.illustration
        )}
      >
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 sm:h-[4.5rem] sm:w-[4.5rem]',
            theme.iconBg
          )}
        >
          <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-base font-bold text-gray-900 sm:text-lg">{plan.name}</h3>

      <div className="mt-3">
        <p className={cn('text-3xl font-bold tracking-tight sm:text-4xl', theme.roiColor)}>
          {plan.weeklyRoi}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          {plan.weeklyRoiLabel ?? 'Target Weekly Return'}
          <Info className="h-3.5 w-3.5 text-gray-400" aria-hidden />
        </p>
      </div>

      <div className="mt-4 space-y-2.5 border-b border-gray-100 pb-4 text-xs sm:text-sm">
        <StatRow icon={Wallet} label="Minimum" value={plan.minInvestment} />
        <StatRow icon={Calendar} label="Duration" value={plan.duration} />
        <StatRow icon={Clock} label="Payout" value={plan.payout} />
        <StatRow
          icon={Shield}
          label="Category"
          value={plan.category}
          valueClassName={cn('text-[10px] font-bold tracking-wide', theme.badge)}
        />
        <StatRow icon={User} label="Access" value={plan.capitalAccess} />
        <StatRow
          icon={Globe}
          label="PrimeAI Score"
          value={`${theme.primeAiScore}/100`}
          valueClassName={theme.riskColor}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {theme.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-gray-600 sm:text-sm">
            <Check className={cn('mt-0.5 h-4 w-4 shrink-0', theme.checkColor)} strokeWidth={2.5} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex -space-x-2">
          {theme.avatarColors.map((color, i) => (
            <div
              key={i}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white',
                color
              )}
            >
              {['A', 'B', 'C'][i]}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 sm:text-sm">{plan.investors} investors</p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onInvest(plan)
        }}
        className={cn(
          'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors sm:py-3',
          theme.button
        )}
      >
        Invest Now
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default memo(InvestPlanCard)

function StatRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Wallet
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-gray-500">
        <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        {label}
      </span>
      <span className={cn('text-right font-semibold text-gray-900', valueClassName)}>{value}</span>
    </div>
  )
}
