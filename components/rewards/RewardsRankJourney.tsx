'use client'

import { memo } from 'react'
import { Check, Lock } from 'lucide-react'
import {
  ReferralRankShield,
} from '@/components/referral/shared/referral-rank-ui'
import { REWARDS_RANK_JOURNEY, rankIndex } from '@/lib/rewards/display-config'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type RewardsRankJourneyProps = {
  currentRankKey: string
  progressPercent: number
}

function RewardsRankJourneyInner({ currentRankKey, progressPercent }: RewardsRankJourneyProps) {
  const currentIdx = rankIndex(currentRankKey)

  return (
    <section aria-label="Rank progress journey" className={dashboardCardClass}>
      <h2 className="text-base font-semibold text-foreground">Rank Progress Journey</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Climb ranks to unlock bigger bonuses and weekly team profit share.
      </p>

      <div className="mt-6 space-y-4 md:hidden">
        {REWARDS_RANK_JOURNEY.map((rank, idx) => {
          const status =
            idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'locked'
          return (
            <RankJourneyCard key={rank.key} rank={rank} status={status} />
          )
        })}
      </div>

      <div className="mt-6 hidden md:block">
        <div className="flex min-w-[720px] items-start justify-between gap-2">
          {REWARDS_RANK_JOURNEY.map((rank, idx) => {
            const status =
              idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'locked'
            const isLast = idx === REWARDS_RANK_JOURNEY.length - 1
            return (
              <div key={rank.key} className="flex min-w-0 flex-1 items-start">
                <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <ReferralRankShield
                    rankName={rank.label}
                    size="sm"
                    className={cn(
                      status === 'locked' && 'opacity-40 grayscale',
                      status === 'current' && 'ring-2 ring-[#f97316]'
                    )}
                  />
                  <p className="mt-2 text-xs font-bold text-foreground">{rank.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Bonus {rank.bonus}</p>
                  <p className="text-[10px] text-muted-foreground">{rank.profitShare} share</p>
                  <StatusPill status={status} />
                </div>
                {!isLast ? (
                  <div
                    className={cn(
                      'mx-1 mt-6 h-0.5 min-w-[1rem] flex-1',
                      idx < currentIdx ? 'bg-emerald-500' : 'bg-border'
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Overall journey progress: <strong className="text-foreground">{progressPercent}%</strong>
      </p>
    </section>
  )
}

function StatusPill({ status }: { status: 'completed' | 'current' | 'locked' }) {
  if (status === 'completed') {
    return (
      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <Check className="h-3 w-3" /> Completed
      </span>
    )
  }
  if (status === 'current') {
    return (
      <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
        In Progress
      </span>
    )
  }
  return (
    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <Lock className="h-3 w-3" /> Locked
    </span>
  )
}

function RankJourneyCard({
  rank,
  status,
}: {
  rank: (typeof REWARDS_RANK_JOURNEY)[number]
  status: 'completed' | 'current' | 'locked'
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3',
        status === 'current' ? 'border-orange-200 bg-orange-50/50' : 'border-border bg-card'
      )}
    >
      <ReferralRankShield rankName={rank.label} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{rank.label}</p>
        <p className="text-xs text-muted-foreground">
          Bonus {rank.bonus} · {rank.profitShare} weekly share
        </p>
      </div>
      <StatusPill status={status} />
    </div>
  )
}

export const RewardsRankJourney = memo(RewardsRankJourneyInner)
