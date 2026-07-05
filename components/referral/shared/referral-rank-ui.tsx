'use client'

import { Award, Crown, Gem, Medal, Shield, Star, Users } from 'lucide-react'
import {
  REFERRAL_RANK_TIERS,
  REFERRAL_UNRANKED,
  type ReferralRankKey,
} from '@/lib/referral/program-config'
import { cn } from '@/lib/utils'

export function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

export function resolveRankKeyFromName(name: string): ReferralRankKey | 'none' {
  if (name === REFERRAL_UNRANKED.name) return 'none'
  const tier = REFERRAL_RANK_TIERS.find((row) => row.name === name)
  return tier?.key ?? 'none'
}

export const RANK_BADGE_STYLES: Record<
  ReferralRankKey | 'none',
  { shell: string; icon: typeof Gem; iconClass: string; nameClass: string; pillClass: string }
> = {
  none: {
    shell: 'bg-gradient-to-br from-slate-50 to-slate-100 ring-slate-200/80',
    icon: Users,
    iconClass: 'text-slate-500',
    nameClass: 'text-slate-600',
    pillClass: 'bg-slate-100 text-slate-600',
  },
  bronze: {
    shell: 'bg-gradient-to-br from-amber-100 to-orange-100 ring-amber-200/80',
    icon: Medal,
    iconClass: 'text-amber-700',
    nameClass: 'text-amber-800',
    pillClass: 'bg-amber-100 text-amber-800',
  },
  silver: {
    shell: 'bg-gradient-to-br from-slate-100 to-gray-200 ring-slate-200/80',
    icon: Shield,
    iconClass: 'text-slate-600',
    nameClass: 'text-slate-700',
    pillClass: 'bg-slate-100 text-slate-700',
  },
  gold: {
    shell: 'bg-gradient-to-br from-yellow-100 to-amber-100 ring-amber-200/80',
    icon: Award,
    iconClass: 'text-amber-600',
    nameClass: 'text-amber-700',
    pillClass: 'bg-amber-100 text-amber-800',
  },
  platinum: {
    shell: 'bg-gradient-to-br from-blue-100 to-indigo-100 ring-blue-200/80',
    icon: Star,
    iconClass: 'text-blue-600',
    nameClass: 'text-blue-700',
    pillClass: 'bg-blue-100 text-blue-700',
  },
  diamond: {
    shell: 'bg-gradient-to-br from-violet-100 to-purple-200 ring-violet-200/80',
    icon: Gem,
    iconClass: 'text-violet-600',
    nameClass: 'text-violet-700',
    pillClass: 'bg-violet-100 text-violet-700',
  },
  ambassador: {
    shell: 'bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-200 ring-amber-300/80',
    icon: Crown,
    iconClass: 'text-amber-700',
    nameClass: 'text-amber-700',
    pillClass: 'bg-orange-100 text-orange-800',
  },
}

export function ReferralRankShield({
  rankName,
  size = 'md',
  className,
}: {
  rankName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const rankKey = resolveRankKeyFromName(rankName)
  const style = RANK_BADGE_STYLES[rankKey]
  const Icon = style.icon
  const sizeClass =
    size === 'lg'
      ? 'h-16 w-14 [&>svg]:h-8 [&>svg]:w-8'
      : size === 'sm'
        ? 'h-10 w-9 [&>svg]:h-5 [&>svg]:w-5'
        : 'h-14 w-12 [&>svg]:h-7 [&>svg]:w-7'

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center shadow-sm [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]',
        style.shell,
        sizeClass,
        className
      )}
    >
      <Icon className={style.iconClass} aria-hidden />
    </div>
  )
}

export function ReferralRankPill({ rankName }: { rankName: string }) {
  const style = RANK_BADGE_STYLES[resolveRankKeyFromName(rankName)]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        style.pillClass
      )}
    >
      {shortRankName(rankName)}
    </span>
  )
}
