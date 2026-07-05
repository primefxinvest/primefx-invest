'use client'

import { memo } from 'react'
import { Link } from '@/i18n/navigation'
import {
  isRewardsTabActive,
  REWARDS_TABS,
  type RewardsTabKey,
} from '@/lib/rewards/navigation'
import { cn } from '@/lib/utils'

function RewardsTabNavInner({ activeTab }: { activeTab: RewardsTabKey }) {
  return (
    <nav
      aria-label="Rewards sections"
      className="flex flex-wrap gap-2 border-b border-border pb-1"
    >
      {REWARDS_TABS.map((tab) => {
        const active = isRewardsTabActive(activeTab, tab.key)
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors',
              active
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export const RewardsTabNav = memo(RewardsTabNavInner)
