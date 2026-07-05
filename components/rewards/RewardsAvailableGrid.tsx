'use client'

import { memo } from 'react'
import { Lock } from 'lucide-react'
import { REWARDS_AVAILABLE_ITEMS, rankIndex } from '@/lib/rewards/display-config'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function RewardsAvailableGridInner({ currentRankKey }: { currentRankKey: string }) {
  const currentIdx = rankIndex(currentRankKey)

  return (
    <section aria-label="Available rewards" className={dashboardCardClass}>
      <h2 className="text-base font-semibold text-foreground">Available Rewards</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Unlock premium benefits as you climb ranks and complete milestones.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REWARDS_AVAILABLE_ITEMS.map((item, idx) => {
          const unlocked = idx <= currentIdx + 1
          const inProgress = idx === currentIdx + 1
          return (
            <div
              key={item.id}
              className={cn(
                'rounded-xl border p-4',
                inProgress
                  ? 'border-orange-200 bg-orange-50/40'
                  : unlocked
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-border bg-muted/20'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {!unlocked ? (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.rank}</p>
              <span
                className={cn(
                  'mt-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                  inProgress
                    ? 'bg-orange-100 text-orange-700'
                    : unlocked
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {inProgress ? 'In Progress' : unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export const RewardsAvailableGrid = memo(RewardsAvailableGridInner)
