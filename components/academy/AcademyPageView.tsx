'use client'

import { useMemo, useState } from 'react'
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Globe,
  GraduationCap,
  Lock,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { canAccessFeature } from '@/lib/investor/tiers'
import type { AcademyCourseItem, AcademyStats } from '@/lib/data/types'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryIcons: Record<string, LucideIcon> = {
  Fundamentals: BookOpen,
  Advanced: BarChart3,
  Markets: Globe,
  default: TrendingUp,
}

const difficultyStyles: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-blue-50 text-[#0052ff]',
  advanced: 'bg-violet-50 text-violet-700',
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ percent, size = 88 }: { percent: number; size?: number }) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0052ff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{percent}%</span>
      </div>
    </div>
  )
}

type AcademyPageViewProps = {
  courses: AcademyCourseItem[]
  stats: AcademyStats | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function AcademyPageView({
  courses,
  stats,
  loading,
  error,
  onRetry,
}: AcademyPageViewProps) {
  const t = useTranslations('academy')
  const { tierKey } = useInvestorTier()
  const canAccessAdvanced = canAccessFeature(tierKey, 'portfolio_analysis')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const completedCount = stats?.coursesCompleted ?? 0
  const totalCourses = stats?.totalCourses ?? courses.length
  const overallProgress =
    totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [courses])

  const filteredCourses = useMemo(() => {
    if (categoryFilter === 'all') return courses
    return courses.filter((c) => c.category === categoryFilter)
  }, [courses, categoryFilter])

  const continueCourse = useMemo(
    () =>
      courses.find((c) => c.progress > 0 && !c.completed && (!c.locked || canAccessAdvanced)) ??
      null,
    [courses, canAccessAdvanced]
  )

  const certificates = [
    {
      name: t('beginnerInvestor'),
      icon: GraduationCap,
      earned: completedCount >= 1,
      detail:
        completedCount >= 1
          ? t('earnedOn', { date: new Date().toLocaleDateString() })
          : t('completeMore', { count: Math.max(1, 1 - completedCount) }),
    },
    {
      name: t('advancedTrader'),
      icon: Trophy,
      earned: completedCount >= 3,
      detail: t('completeMore', { count: Math.max(0, 3 - completedCount) }),
    },
  ]

  const courseHref = (courseId: string) => `/academy/${courseId}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              PrimeFx Academy
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-gray-500">{t('description')}</p>
        </div>
        <Link
          href="/invest"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Sparkles className="h-4 w-4 text-[#0052ff]" />
          {t('pathDescription')}
        </Link>
      </div>

      <AsyncState
        loading={loading && !courses.length}
        error={error}
        onRetry={onRetry}
        skeleton={<MetricCardsSkeleton count={4} />}
      >
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <WalletStatCard
            label={t('coursesCompleted')}
            value={`${completedCount}/${totalCourses}`}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label={t('learningStreak')}
            value={t('days', { count: stats?.learningStreakDays ?? 0 })}
            icon={Flame}
            iconClassName="bg-orange-50 text-orange-500"
          />
          <WalletStatCard
            label={t('xpEarned')}
            value={(stats?.xpEarned ?? 0).toLocaleString()}
            icon={Zap}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            label={t('overallProgress')}
            value={`${overallProgress}%`}
            subtext={t('pathTitle')}
            icon={Star}
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          {continueCourse ? (
            <div className="overflow-hidden rounded-xl border border-[#0052ff]/20 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0052ff]">
                {t('continueLearning')}
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{continueCourse.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{continueCourse.description}</p>
                  <div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full bg-[#0052ff]"
                      style={{ width: `${continueCourse.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {continueCourse.progress}% {t('progress').toLowerCase()}
                  </p>
                </div>
                <Link
                  href={courseHref(continueCourse.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0052ff] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Play className="h-4 w-4" />
                  {t('continue')}
                </Link>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('availableCourses')}</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                      categoryFilter === cat
                        ? 'bg-[#0052ff] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {cat === 'all' ? t('allCategories') : cat}
                  </button>
                ))}
              </div>
            </div>

            <AsyncState
              loading={loading}
              error={error}
              onRetry={onRetry}
              isEmpty={!filteredCourses.length}
              emptyTitle={t('emptyTitle')}
              emptyDescription={t('emptyDescription')}
              skeleton={
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CourseCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredCourses.map((course) => {
                  const Icon = categoryIcons[course.category] ?? categoryIcons.default
                  const locked = course.locked && !canAccessAdvanced
                  const diffKey = course.difficulty.toLowerCase()

                  return (
                    <article
                      key={course.id}
                      className={cn(
                        'flex h-full flex-col rounded-xl border p-5 transition-shadow',
                        locked
                          ? 'border-gray-200 bg-gray-50/80 opacity-90'
                          : 'border-gray-200 bg-white hover:border-[#0052ff]/30 hover:shadow-md'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
                            locked ? 'bg-gray-200 text-gray-500' : 'bg-[#0052ff]/10 text-[#0052ff]'
                          )}
                        >
                          {locked ? <Lock className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900">{course.title}</h3>
                            {course.completed ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{course.description}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 font-semibold',
                            difficultyStyles[diffKey] ?? 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {course.difficulty}
                        </span>
                        <span className="text-gray-400">{course.category}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {t('lessons', { count: course.lessons })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {t('weeks', { count: Number(course.duration) || 1 })}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        {t('instructor')}: {course.instructor}
                      </p>

                      {course.progress > 0 && !course.completed ? (
                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-medium text-gray-700">{t('progress')}</span>
                            <span className="text-gray-500">{course.progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#0052ff]"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}

                      {locked ? (
                        <p className="mt-3 text-xs text-amber-700">{t('upgradeToUnlock')}</p>
                      ) : null}

                      <div className="mt-auto pt-4">
                        <Link
                          href={courseHref(course.id)}
                          className={cn(
                            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                            locked
                              ? 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                              : course.completed
                                ? 'border border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                                : 'bg-[#0052ff] text-white hover:bg-blue-700'
                          )}
                        >
                          {locked ? (
                            <Lock className="h-4 w-4" />
                          ) : course.progress === 0 && !course.completed ? (
                            <Play className="h-4 w-4" />
                          ) : null}
                          {locked
                            ? t('viewCourse')
                            : course.completed
                              ? t('review')
                              : course.progress > 0
                                ? t('continue')
                                : t('start')}
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            </AsyncState>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('certificates')}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {certificates.map((cert) => {
                const CertIcon = cert.icon
                return (
                  <div
                    key={cert.name}
                    className={cn(
                      'flex items-start gap-4 rounded-xl border p-5',
                      cert.earned
                        ? 'border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        cert.earned ? 'bg-violet-100 text-violet-600' : 'bg-gray-200 text-gray-400'
                      )}
                    >
                      <CertIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cert.name}</p>
                      {cert.earned ? (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-600">
                          <Award className="h-4 w-4" />
                          {cert.detail}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">{cert.detail}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">{t('pathTitle')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('pathDescription')}</p>
            <div className="mt-5 flex justify-center">
              <ProgressRing percent={overallProgress} />
            </div>
            <p className="mt-3 text-center text-sm text-gray-600">
              {t('coursesCompletedSummary', { completed: completedCount, total: totalCourses })}
            </p>
          </div>

          {!canAccessAdvanced ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 text-amber-800">
                <Lock className="h-4 w-4 shrink-0" />
                <p className="text-sm font-semibold">{t('premiumCourses')}</p>
              </div>
              <p className="mt-2 text-sm text-amber-900/80">{t('upgradeToUnlock')}</p>
              <Link
                href="/invest"
                className="mt-3 inline-flex text-sm font-semibold text-[#0052ff] hover:underline"
              >
                {t('viewInvestmentPlans')} →
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
