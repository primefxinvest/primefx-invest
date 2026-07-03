'use client'

import {
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  BarChart3,
  TrendingUp,
  Globe,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AsyncState } from '@/components/shared/data-state'
import { TableSkeleton } from '@/components/shared/skeletons'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { canAccessFeature } from '@/lib/investor/tiers'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchAcademyCourses, fetchAcademyStats } from '@/lib/data/queries'
import type { LucideIcon } from 'lucide-react'

const categoryIcons: Record<string, LucideIcon> = {
  Fundamentals: BookOpen,
  Advanced: BarChart3,
  Markets: Globe,
  default: TrendingUp,
}

export default function AcademyPage() {
  const t = useTranslations('academy')
  const { tierKey } = useInvestorTier()
  const canAccessAdvanced = canAccessFeature(tierKey, 'portfolio_analysis')

  const { data: courses = [], loading, error, reload } = useAsyncData(
    () => fetchAcademyCourses(),
    []
  )
  const { data: stats } = useAsyncData(() => fetchAcademyStats(), [])

  const completedCount = stats?.coursesCompleted ?? 0
  const totalCourses = stats?.totalCourses ?? courses.length

  const certificates = [
    {
      name: t('beginnerInvestor'),
      earned: completedCount >= 1,
      detail: completedCount >= 1
        ? t('earnedOn', { date: new Date().toLocaleDateString() })
        : t('completeMore', { count: Math.max(1, 1 - completedCount) }),
    },
    {
      name: t('advancedTrader'),
      earned: completedCount >= 3,
      detail: t('completeMore', { count: Math.max(0, 3 - completedCount) }),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{t('coursesCompleted')}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {completedCount} / {totalCourses}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{t('learningStreak')}</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {t('days', { count: stats?.learningStreakDays ?? 0 })}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('xpEarned')}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {(stats?.xpEarned ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('availableCourses')}</h2>
        <AsyncState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={!courses.length}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
          skeleton={<TableSkeleton rows={4} cols={1} showHeader={false} />}
        >
          <div className="space-y-4">
            {courses.map((course) => {
              const Icon = categoryIcons[course.category] ?? categoryIcons.default
              const locked =
                course.locked && !canAccessAdvanced
              const lockReason = course.lockReason ?? t('lockedTier')

              return (
                <div
                  key={course.id}
                  className={`rounded-lg border p-6 transition-all hover:shadow-md ${
                    locked ? 'border-border bg-secondary opacity-60' : 'border-border hover:border-primary'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{course.title}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">{course.category}</p>
                          </div>
                          {course.completed && (
                            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                          )}
                          {locked && <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{t('lessons', { count: course.lessons })}</span>
                          <span>•</span>
                          <span>{t('weeks', { count: Number(course.duration) || 1 })}</span>
                          <span>•</span>
                          <span>{course.difficulty}</span>
                        </div>
                        {course.progress > 0 && !course.completed && (
                          <div className="mt-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">{t('progress')}</span>
                              <span className="text-xs text-muted-foreground">{course.progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {locked && (
                          <p className="mt-2 text-xs text-muted-foreground">{lockReason}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors ${
                        locked
                          ? 'cursor-not-allowed border border-border text-muted-foreground'
                          : course.completed
                            ? 'bg-secondary text-foreground'
                            : 'bg-primary text-white hover:bg-blue-700'
                      }`}
                      disabled={locked}
                    >
                      {!locked && course.progress === 0 && <Play className="h-4 w-4" />}
                      {course.completed
                        ? t('review')
                        : course.progress > 0
                          ? t('continue')
                          : t('start')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </AsyncState>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('certificates')}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.name}
              className={`rounded-lg border p-6 ${cert.earned ? 'border-blue-300 bg-blue-50' : 'border-border'}`}
            >
              <p className="font-semibold text-foreground">{cert.name}</p>
              {cert.earned ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  {cert.detail}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{cert.detail}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
