'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronRight, Crown, LayoutGrid } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  AcademyCourseCard,
  AcademyCourseCardSkeleton,
} from '@/components/academy/AcademyCourseCard'
import { AcademySidebar } from '@/components/academy/AcademySidebar'
import { AcademyStatsRow } from '@/components/academy/AcademyStatsRow'
import { DIFFICULTY_FILTERS, normalizeDifficulty, type DifficultyFilter } from '@/components/academy/constants'
import { AsyncState } from '@/components/shared/data-state'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { canAccessFeature } from '@/lib/investor/tiers'
import { pageStackClass, gridGapClass } from '@/lib/layout/spacing'
import type { AcademyCourseItem, AcademyStats } from '@/lib/data/types'
import { cn } from '@/lib/utils'

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
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const coursesRef = useRef<HTMLDivElement>(null)

  const completedCount = stats?.coursesCompleted ?? 0
  const totalCourses = stats?.totalCourses ?? courses.length
  const overallProgress =
    totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0

  const filteredCourses = useMemo(() => {
    if (difficultyFilter === 'all') return courses
    return courses.filter(
      (course) => normalizeDifficulty(course.difficulty) === difficultyFilter
    )
  }, [courses, difficultyFilter])

  const continueCourse = useMemo(
    () =>
      courses.find((c) => c.progress > 0 && !c.completed && (!c.locked || canAccessAdvanced)) ??
      courses.find((c) => !c.completed && (!c.locked || canAccessAdvanced)) ??
      null,
    [courses, canAccessAdvanced]
  )

  const certificates = [
    {
      name: t('beginnerInvestor'),
      earned: completedCount >= 1,
      detail:
        completedCount >= 1
          ? t('earnedOn', { date: new Date().toLocaleDateString() })
          : t('completeMore', { count: Math.max(1, 1 - completedCount) }),
    },
    {
      name: t('advancedTrader'),
      earned: completedCount >= 3,
      detail: completedCount >= 3
        ? t('earnedOn', { date: new Date().toLocaleDateString() })
        : t('completeMore', { count: Math.max(0, 3 - completedCount) }),
      upcoming: completedCount >= 1 && completedCount < 3,
    },
  ]

  const courseHref = (courseId: string) => `/academy/${courseId}`

  const filterLabel = (filter: DifficultyFilter) => {
    if (filter === 'all') return t('allCategories')
    return t(`difficulty.${filter}`)
  }

  const handleViewAllCourses = () => {
    setDifficultyFilter('all')
    coursesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={pageStackClass}>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-stretch">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('title')}
            </h1>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700 sm:text-xs">
              {t('journeyBadge')}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('description')}
          </p>
        </div>

        <Link
          href="/invest"
          className="group relative flex min-h-[5.5rem] items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e3a8a] p-4 shadow-lg transition-transform hover:-translate-y-0.5 sm:p-5"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0052ff]/25 blur-2xl" />
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
            <Crown className="h-5 w-5" />
          </div>
          <p className="relative min-w-0 flex-1 text-sm font-medium leading-snug text-white sm:text-[15px]">
            {t('heroCardText')}
          </p>
          <ChevronRight className="relative h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>

      <AcademyStatsRow
        stats={stats}
        totalCourses={totalCourses}
        overallProgress={overallProgress}
        loading={loading && !stats}
      />

      <div className={cn('grid grid-cols-1', gridGapClass, 'xl:grid-cols-[minmax(0,1fr)_300px]')}>
        <div ref={coursesRef} className="min-w-0 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">{t('exploreCourses')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('exploreCoursesSubtitle')}</p>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible">
            {DIFFICULTY_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setDifficultyFilter(filter)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm',
                  difficultyFilter === filter
                    ? 'bg-[#0052ff] text-white shadow-sm'
                    : 'border border-border bg-background text-muted-foreground hover:border-[#0052ff]/30 hover:text-foreground'
                )}
              >
                {filterLabel(filter)}
              </button>
            ))}
          </div>

          <AsyncState
            loading={loading}
            error={error}
            onRetry={onRetry}
            isEmpty={!filteredCourses.length}
            emptyTitle={t('emptyTitle')}
            emptyDescription={t('emptyDescription')}
            skeleton={
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <AcademyCourseCardSkeleton key={index} />
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredCourses.map((course) => {
                const locked = course.locked && !canAccessAdvanced
                return (
                  <AcademyCourseCard
                    key={course.id}
                    course={course}
                    locked={locked}
                    href={courseHref(course.id)}
                  />
                )
              })}
            </div>
          </AsyncState>

          {filteredCourses.length > 0 ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleViewAllCourses}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-[#0052ff]/30 hover:text-[#0052ff]"
              >
                <LayoutGrid className="h-4 w-4" />
                {t('viewAllCourses')}
              </button>
            </div>
          ) : null}
        </div>

        <AcademySidebar
          overallProgress={overallProgress}
          completedCount={completedCount}
          totalCourses={totalCourses}
          continueCourse={continueCourse}
          canAccessAdvanced={canAccessAdvanced}
          certificates={certificates}
        />
      </div>
    </div>
  )
}
