'use client'

import { CheckCircle, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import type { RewardAchievement } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const achievementIcons: Record<string, LucideIcon> = {
  '1': Star,
  '2': Star,
  '3': Star,
  '4': Star,
  '5': Star,
  '6': Star,
}

type AchievementCardProps = {
  reward: RewardAchievement
}

export function AchievementCard({ reward }: AchievementCardProps) {
  const Icon = achievementIcons[reward.id] ?? Star
  const progressPercent =
    reward.progressMax != null && reward.progress != null && reward.progressMax > 0
      ? Math.min(100, (reward.progress / reward.progressMax) * 100)
      : 0

  return (
    <div
      className={cn(
        cardSurfaceClass,
        'p-4 transition-all',
        reward.earned ? 'border-primary/40 bg-primary/5' : 'bg-background'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            reward.earned ? 'bg-primary/20' : 'bg-secondary'
          )}
        >
          <Icon className={cn('h-5 w-5', reward.earned ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        {reward.earned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
            <CheckCircle className="h-3 w-3" />
            Earned
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 font-semibold text-foreground">{reward.name}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reward.description}</p>

      {reward.earned ? (
        <div className="mt-3 space-y-1">
          {reward.earnedDate ? (
            <p className="text-xs text-muted-foreground">Earned on {reward.earnedDate}</p>
          ) : null}
          <span className="inline-block rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            +{reward.points} points
          </span>
        </div>
      ) : (
        <div className="mt-3">
          {reward.progressMax != null && reward.progress != null ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-xs font-semibold tabular-nums text-foreground">
                  {reward.progressMax >= 1000
                    ? `${reward.progress.toLocaleString()}/${reward.progressMax.toLocaleString()}`
                    : `${reward.progress}/${reward.progressMax}`}
                </p>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-label={`${reward.name} progress`}
                aria-valuemin={0}
                aria-valuemax={reward.progressMax ?? 100}
                aria-valuenow={reward.progress ?? 0}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : null}
          <p className="mt-2 text-xs font-semibold text-primary">+{reward.points} points when completed</p>
        </div>
      )}
    </div>
  )
}
