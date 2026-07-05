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
        'flex h-full flex-col transition-shadow hover:shadow-md',
        reward.earned ? 'border-emerald-200/80 bg-emerald-50/20' : 'bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            reward.earned ? 'bg-emerald-100' : 'bg-muted'
          )}
        >
          <Icon
            className={cn('h-5 w-5', reward.earned ? 'text-emerald-600' : 'text-muted-foreground')}
            aria-hidden
          />
        </div>
        {reward.earned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
            <CheckCircle className="h-3 w-3" aria-hidden />
            Completed
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-sm font-semibold text-foreground">{reward.name}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{reward.description}</p>

      {reward.earned ? (
        <div className="mt-4 space-y-1">
          {reward.earnedDate ? (
            <p className="text-xs text-muted-foreground">Unlocked {reward.earnedDate}</p>
          ) : null}
          <span className="inline-block text-sm font-bold text-emerald-600">+{reward.points} pts</span>
        </div>
      ) : (
        <div className="mt-4">
          {reward.progressMax != null && reward.progress != null ? (
            <>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {reward.progressMax >= 1000
                    ? `${reward.progress.toLocaleString()}/${reward.progressMax.toLocaleString()}`
                    : `${reward.progress}/${reward.progressMax}`}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
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
          <p className="mt-2 text-xs font-semibold text-primary">+{reward.points} pts when completed</p>
        </div>
      )}
    </div>
  )
}
