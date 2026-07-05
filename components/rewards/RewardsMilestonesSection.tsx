'use client'

import { memo } from 'react'
import { Target } from 'lucide-react'
import { REWARDS_MILESTONES } from '@/lib/rewards/display-config'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function RewardsMilestonesSectionInner({ referralCount }: { referralCount: number }) {
  return (
    <section aria-label="Referral milestones" className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Milestones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hit referral milestones to unlock bonus cash rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REWARDS_MILESTONES.map((milestone) => {
          const progress = Math.min(100, (referralCount / milestone.referrals) * 100)
          const completed = referralCount >= milestone.referrals
          return (
            <div
              key={milestone.referrals}
              className={cn(
                dashboardCardClass,
                completed && 'border-emerald-200 bg-emerald-50/20'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{milestone.label}</p>
                  <p className="text-sm font-bold text-emerald-600">{milestone.reward} reward</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.min(referralCount, milestone.referrals)} / {milestone.referrals} referrals
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        completed ? 'bg-emerald-500' : 'bg-primary'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export const RewardsMilestonesSection = memo(RewardsMilestonesSectionInner)
