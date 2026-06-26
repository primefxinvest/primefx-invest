import { INVESTOR_TIERS } from '@/lib/investor/tiers'
import type { InvestorTierKey } from '@/lib/investor/types'
import { cn } from '@/lib/utils'

const TIER_STYLES: Record<InvestorTierKey, string> = {
  starter: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  growth: 'bg-blue-50 text-blue-800 ring-blue-200',
  prime: 'bg-violet-50 text-violet-800 ring-violet-200',
  elite: 'bg-amber-50 text-amber-900 ring-amber-200',
}

interface InvestorTierBadgeProps {
  tier: InvestorTierKey | string
  showBadge?: boolean
  className?: string
}

export function InvestorTierBadge({ tier, showBadge = true, className }: InvestorTierBadgeProps) {
  const key = (tier as string).toLowerCase().includes('elite')
    ? 'elite'
    : (tier as string).toLowerCase().includes('prime')
      ? 'prime'
      : (tier as string).toLowerCase().includes('growth')
        ? 'growth'
        : 'starter'

  const config = INVESTOR_TIERS[key as InvestorTierKey]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TIER_STYLES[key as InvestorTierKey],
        className
      )}
    >
      {showBadge ? <span>{config.badge}</span> : null}
      {config.label}
    </span>
  )
}
