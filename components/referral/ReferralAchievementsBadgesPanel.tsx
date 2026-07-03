'use client'

import {
  ChevronsUp,
  Flame,
  Gem,
  Share2,
  Star,
  Target,
  Trophy,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { ReferralBadgeState, ReferralBadgeVariant, ReferralStreakState } from '@/lib/referral/badges'
import { cn } from '@/lib/utils'

const BADGE_STYLES: Record<
  ReferralBadgeVariant,
  {
    frame: string
    inner: string
    icon: typeof Gem
    iconClass: string
    ring: string
  }
> = {
  'diamond-rank': {
    frame: 'from-violet-300 via-purple-200 to-violet-400',
    inner: 'from-violet-500 to-purple-700',
    icon: Gem,
    iconClass: 'text-white drop-shadow',
    ring: 'ring-violet-300/80',
  },
  'top-referrer': {
    frame: 'from-amber-300 via-yellow-200 to-amber-400',
    inner: 'from-amber-500 to-yellow-600',
    icon: Trophy,
    iconClass: 'text-white drop-shadow',
    ring: 'ring-amber-300/80',
  },
  'consistent-builder': {
    frame: 'from-amber-300 via-yellow-200 to-orange-300',
    inner: 'from-yellow-500 to-amber-600',
    icon: Star,
    iconClass: 'text-white drop-shadow',
    ring: 'ring-amber-300/80',
  },
  'growth-expert': {
    frame: 'from-sky-200 via-blue-100 to-cyan-200',
    inner: 'from-sky-400 to-blue-600',
    icon: ChevronsUp,
    iconClass: 'text-white drop-shadow',
    ring: 'ring-sky-300/80',
  },
  'network-master': {
    frame: 'from-fuchsia-200 via-pink-100 to-rose-200',
    inner: 'from-fuchsia-500 to-pink-600',
    icon: Share2,
    iconClass: 'text-white drop-shadow',
    ring: 'ring-fuchsia-300/80',
  },
  'growth-machine': {
    frame: 'from-sky-200 via-indigo-100 to-blue-200',
    inner: 'from-indigo-500 to-blue-700',
    icon: Target,
    iconClass: 'text-white drop-shadow',
    ring: 'ring-indigo-300/80',
  },
}

function HexBadgeIcon({
  variant,
  size = 'lg',
  unlocked = true,
}: {
  variant: ReferralBadgeVariant
  size?: 'lg' | 'sm'
  unlocked?: boolean
}) {
  const style = BADGE_STYLES[variant]
  const Icon = style.icon
  const outer = size === 'lg' ? 'h-[72px] w-[62px]' : 'h-9 w-8'
  const inner = size === 'lg' ? 'h-[58px] w-[50px]' : 'h-7 w-6'
  const iconSize = size === 'lg' ? 'h-7 w-7' : 'h-3.5 w-3.5'

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center bg-gradient-to-b shadow-md',
        outer,
        style.frame,
        !unlocked && 'grayscale opacity-55',
        '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-b ring-1 ring-inset',
          inner,
          style.inner,
          style.ring,
          '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]'
        )}
      >
        <Icon className={cn(iconSize, style.iconClass)} strokeWidth={2.2} />
      </div>
    </div>
  )
}

function BadgeLabel({ badge }: { badge: ReferralBadgeState }) {
  return (
    <div className="mt-2 text-center">
      <p className="text-[11px] font-semibold leading-tight text-slate-800">{badge.label}</p>
      {badge.sublabel ? (
        <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-600">{badge.sublabel}</p>
      ) : null}
    </div>
  )
}

function StreakColumn({
  title,
  months,
  badge,
  showBadge = true,
  badgeEarned = true,
}: {
  title: string
  months: number
  badge: ReferralStreakState['currentBadge']
  showBadge?: boolean
  badgeEarned?: boolean
}) {
  return (
    <div className="min-w-0 flex-1 px-3 py-2.5 sm:px-4">
      <p className="text-[11px] font-medium text-slate-500">{title}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Flame className="h-4 w-4 shrink-0 text-orange-500" fill="currentColor" />
        <span className="text-sm font-bold text-slate-900">
          {months} {months === 1 ? 'Month' : 'Months'}
        </span>
      </div>
      {showBadge ? (
        <div className="mt-2 flex items-center gap-2">
          <HexBadgeIcon variant={badge.id} size="sm" unlocked={badgeEarned} />
          <span className="truncate text-[11px] font-semibold text-slate-700">{badge.label}</span>
        </div>
      ) : null}
    </div>
  )
}

export function ReferralAchievementsBadgesPanel({
  badges,
  streak,
}: {
  badges: ReferralBadgeState[]
  streak: ReferralStreakState
}) {
  return (
    <div className="h-fit w-full self-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900">Achievements & Badges</h3>
        <Link
          href="/rewards"
          className="shrink-0 text-xs font-semibold text-violet-600 transition-colors hover:text-violet-700"
        >
          View All Badges &gt;
        </Link>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-between [&::-webkit-scrollbar]:hidden">
        {badges.map((badge) => (
          <div key={badge.id} className="flex min-w-[72px] flex-1 flex-col items-center sm:min-w-0">
            <HexBadgeIcon variant={badge.id} unlocked={badge.unlocked} />
            <BadgeLabel badge={badge} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <StreakColumn
          title="Current Streak"
          months={streak.currentMonths}
          badge={streak.currentBadge}
          showBadge={streak.currentBadgeEarned}
          badgeEarned={streak.currentBadgeEarned}
        />
        <div className="w-px shrink-0 bg-gray-200" />
        <StreakColumn
          title="Next Milestone"
          months={streak.nextMilestoneMonths}
          badge={streak.nextBadge}
          badgeEarned={false}
        />
      </div>
    </div>
  )
}
