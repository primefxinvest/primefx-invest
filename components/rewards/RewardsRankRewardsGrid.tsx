'use client'

import { memo } from 'react'
import { Check } from 'lucide-react'
import {
  ReferralRankShield,
} from '@/components/referral/shared/referral-rank-ui'
import { REWARDS_RANK_CARDS, rankIndex } from '@/lib/rewards/display-config'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function RewardsRankRewardsGridInner({ currentRankKey }: { currentRankKey: string }) {
  const currentIdx = rankIndex(currentRankKey)

  return (
    <section aria-label="Rank rewards" className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Rank Rewards</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Exclusive bonuses and perks at every rank level.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REWARDS_RANK_CARDS.map((rank, idx) => {
          const unlocked = idx <= currentIdx
          const isCurrent = idx === currentIdx
          return (
            <div
              key={rank.key}
              className={cn(
                dashboardCardClass,
                isCurrent && 'border-primary/30 ring-1 ring-primary/10',
                !unlocked && 'opacity-75'
              )}
            >
              <div className="flex items-center gap-3">
                <ReferralRankShield rankName={rank.label} size="sm" />
                <div>
                  <p className="font-bold text-foreground">{rank.label}</p>
                  <p className="text-sm font-semibold text-[#7c3aed]">{rank.bonus}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {rank.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        unlocked ? 'text-emerald-600' : 'text-muted-foreground'
                      )}
                      aria-hidden
                    />
                    {perk}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <span className="mt-4 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  Current Rank
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export const RewardsRankRewardsGrid = memo(RewardsRankRewardsGridInner)
