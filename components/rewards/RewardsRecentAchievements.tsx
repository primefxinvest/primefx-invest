'use client'

import { memo } from 'react'
import { Check, Clock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { RewardAchievement } from '@/lib/data/types'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function RecentAchievementCard({ achievement }: { achievement: RewardAchievement }) {
  const progress =
    achievement.progressMax && achievement.progress
      ? Math.min(100, (achievement.progress / achievement.progressMax) * 100)
      : 0

  return (
    <div
      className={cn(
        'flex h-full min-h-[8.5rem] flex-col rounded-xl border p-4',
        achievement.earned
          ? 'border-emerald-200 bg-emerald-50/30'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{achievement.name}</p>
        {achievement.earned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <Check className="h-3 w-3" /> Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
            <Clock className="h-3 w-3" /> Active
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{achievement.description}</p>
      <p className="mt-auto pt-3 text-sm font-bold text-emerald-600">+{achievement.points} pts</p>
      {!achievement.earned && achievement.progressMax ? (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : achievement.earnedDate ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{achievement.earnedDate}</p>
      ) : null}
    </div>
  )
}

function RewardsRecentAchievementsInner({
  achievements,
}: {
  achievements: RewardAchievement[]
}) {
  const recent = [...achievements]
    .sort((a, b) => Number(b.earned) - Number(a.earned))
    .slice(0, 5)

  return (
    <section aria-label="Recent achievements" className={dashboardCardClass}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Recent Achievements</h2>
        <Link
          href="/rewards?tab=achievements"
          className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Complete your first investment to start earning achievements.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {recent.map((item) => (
            <RecentAchievementCard key={item.id} achievement={item} />
          ))}
        </div>
      )}
    </section>
  )
}

export const RewardsRecentAchievements = memo(RewardsRecentAchievementsInner)
