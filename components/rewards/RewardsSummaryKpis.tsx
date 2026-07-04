'use client'

import { memo } from 'react'
import { Trophy } from 'lucide-react'
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type RewardsSummaryProps = {
  totalPoints: number
  earnedCount: number
  totalAchievements: number
  inProgressCount: number
  currentTierShort: string
  currentTierFull: string
  tierProgress: number
  nextLevel: string
  pointsLabel: string
}

export const RewardsSummaryKpis = memo(function RewardsSummaryKpis({
  totalPoints,
  earnedCount,
  totalAchievements,
  inProgressCount,
  currentTierShort,
  currentTierFull,
  tierProgress,
  nextLevel,
  pointsLabel,
}: RewardsSummaryProps) {
  return (
    <div className="space-y-4">
      <KpiGrid count={4} aria-label="Rewards summary">
        <KpiCard
          label="Total Points"
          value={totalPoints.toLocaleString()}
          caption={pointsLabel}
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-primary/10 text-primary"
        />
        <KpiCard
          label="Achievements Earned"
          value={`${earnedCount} / ${totalAchievements}`}
          caption={`${inProgressCount} in progress`}
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Current Tier"
          value={currentTierShort}
          caption={currentTierFull}
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-blue-50 text-[#0052ff]"
        />
        <KpiCard
          label="Tier Progress"
          value={`${tierProgress}%`}
          caption={nextLevel}
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-orange-50 text-orange-600"
        />
      </KpiGrid>

      <div className={cn(cardSurfaceClass, 'p-4 sm:p-5')}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Path to next tier</span>
          <span className="font-semibold tabular-nums text-foreground">{tierProgress}%</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label="Tier progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={tierProgress}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${tierProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{nextLevel}</p>
      </div>
    </div>
  )
})
