'use client'

import { BarChart3, BookOpen, Flame, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AcademyProgressRing } from '@/components/academy/AcademyProgressRing'
import { useAnimatedNumber } from '@/components/academy/useAnimatedNumber'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'
import type { AcademyStats } from '@/lib/data/types'

function StatCardSkeleton() {
  return (
    <div className={cn(dashboardCardClass, 'min-h-[7.25rem] animate-pulse')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-7 w-20 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
        <div className="h-[52px] w-[52px] rounded-full bg-muted" />
      </div>
    </div>
  )
}

type AcademyStatsRowProps = {
  stats: AcademyStats | null
  totalCourses: number
  overallProgress: number
  loading: boolean
}

export function AcademyStatsRow({
  stats,
  totalCourses,
  overallProgress,
  loading,
}: AcademyStatsRowProps) {
  const t = useTranslations('academy')

  const completed = stats?.coursesCompleted ?? 0
  const streak = stats?.learningStreakDays ?? 0
  const xp = stats?.xpEarned ?? 0

  const animatedCompleted = useAnimatedNumber(completed, 700, !loading)
  const animatedStreak = useAnimatedNumber(streak, 700, !loading)
  const animatedXp = useAnimatedNumber(xp, 700, !loading)
  const animatedProgress = useAnimatedNumber(overallProgress, 700, !loading)

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: t('coursesCompleted'),
      value: `${animatedCompleted}/${totalCourses}`,
      caption: completed > 0 ? t('keepLearning') : t('keepLearningEmpty'),
      icon: BookOpen,
      iconClass: 'bg-blue-50 text-[#0052ff]',
      ring: totalCourses > 0 ? Math.round((completed / totalCourses) * 100) : 0,
      ringStroke: 'stroke-[#0052ff]',
    },
    {
      label: t('learningStreak'),
      value: t('days', { count: animatedStreak }),
      caption: streak > 0 ? t('streakActive') : t('startStreak'),
      icon: Flame,
      iconClass: 'bg-orange-50 text-orange-500',
      ring: Math.min(100, streak * 10),
      ringStroke: 'stroke-orange-500',
    },
    {
      label: t('xpEarned'),
      value: `${animatedXp.toLocaleString()} XP`,
      caption: xp > 0 ? t('xpGrowing') : t('earnXp'),
      icon: Shield,
      iconClass: 'bg-emerald-50 text-emerald-600',
      ring: Math.min(100, Math.round(xp / 25)),
      ringStroke: 'stroke-emerald-500',
    },
    {
      label: t('overallProgress'),
      value: `${animatedProgress}%`,
      caption: t('yourLearningPath'),
      icon: BarChart3,
      iconClass: 'bg-violet-50 text-violet-600',
      ring: overallProgress,
      ringStroke: 'stroke-violet-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={cn(
              dashboardCardClass,
              'flex min-h-[7.25rem] flex-col justify-between transition-transform hover:-translate-y-0.5'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      card.iconClass
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                    {card.label}
                  </p>
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {card.value}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
                  {card.caption}
                </p>
              </div>
              <AcademyProgressRing
                percent={card.ring}
                progressClassName={card.ringStroke}
                label={card.label}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
