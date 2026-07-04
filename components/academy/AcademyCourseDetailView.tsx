'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  Play,
  Trophy,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { AsyncState } from '@/components/shared/data-state'
import { completeLesson, enrollInCourse } from '@/lib/academy/actions'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { canAccessFeature } from '@/lib/investor/tiers'
import type { AcademyCourseDetail } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const difficultyStyles: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-blue-50 text-[#0052ff]',
  advanced: 'bg-violet-50 text-violet-700',
}

type AcademyCourseDetailViewProps = {
  course: AcademyCourseDetail | null
  courseId: string
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function AcademyCourseDetailView({
  course,
  courseId,
  loading,
  error,
  onRetry,
}: AcademyCourseDetailViewProps) {
  const t = useTranslations('academy')
  const { tierKey } = useInvestorTier()
  const canAccessAdvanced = canAccessFeature(tierKey, 'portfolio_analysis')
  const [pending, startTransition] = useTransition()
  const [localCourse, setLocalCourse] = useState<AcademyCourseDetail | null>(course)

  const detail = localCourse ?? course
  const locked = detail?.locked && !canAccessAdvanced

  const initialLessonId = useMemo(() => {
    if (!detail?.lessonsList.length) return null
    const next = detail.lessonsList.find((lesson) => !lesson.completed)
    return next?.id ?? detail.lessonsList[0]?.id ?? null
  }, [detail])

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  useEffect(() => {
    if (initialLessonId) {
      setActiveLessonId((current) => current ?? initialLessonId)
    }
  }, [initialLessonId])

  useEffect(() => {
    setLocalCourse(course)
  }, [course])

  const activeLesson =
    detail?.lessonsList.find((lesson) => lesson.id === activeLessonId) ??
    detail?.lessonsList[0] ??
    null

  const completedLessons = detail?.lessonsList.filter((lesson) => lesson.completed).length ?? 0
  const totalLessons = detail?.lessonsList.length ?? 0

  const handleEnroll = () => {
    if (!detail || locked) return

    startTransition(async () => {
      const result = await enrollInCourse(courseId)
      if (!result.ok) {
        toast.error(t('enrollFailed'), { description: result.error })
        return
      }

      setLocalCourse({ ...detail, enrolled: true, progress: detail.progress || 0 })
      toast.success(t('enrollSuccess'))
      onRetry()
    })
  }

  const handleCompleteLesson = () => {
    if (!detail || !activeLesson || locked || !detail.enrolled) return

    startTransition(async () => {
      const result = await completeLesson(activeLesson.id, courseId)
      if (!result.ok) {
        toast.error(t('completeFailed'), { description: result.error })
        return
      }

      const updatedLessons = detail.lessonsList.map((lesson) =>
        lesson.id === activeLesson.id ? { ...lesson, completed: true } : lesson
      )
      const nextLesson = updatedLessons.find((lesson) => !lesson.completed)

      setLocalCourse({
        ...detail,
        lessonsList: updatedLessons,
        progress: result.progress,
        completed: result.completed,
        completedAt: result.completed ? new Date().toISOString() : detail.completedAt,
      })

      if (result.completed) {
        toast.success(t('courseCompleted'))
      } else {
        toast.success(t('lessonCompleted'))
        if (nextLesson) setActiveLessonId(nextLesson.id)
      }

      onRetry()
    })
  }

  return (
    <div className="space-y-6">
      <Link
        href="/academy"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0052ff]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToAcademy')}
      </Link>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={onRetry}
        isEmpty={!detail}
        emptyTitle={t('courseNotFound')}
        emptyDescription={t('courseNotFoundDescription')}
      >
        {detail ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        difficultyStyles[detail.difficulty.toLowerCase()] ??
                          'bg-gray-100 text-gray-600'
                      )}
                    >
                      {detail.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">{detail.category}</span>
                    {detail.completed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <Trophy className="h-3.5 w-3.5" />
                        {t('courseCompletedBadge')}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{detail.title}</h1>
                  <p className="mt-2 max-w-3xl text-gray-600">{detail.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      {t('lessons', { count: detail.lessons })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {t('weeks', { count: Number(detail.duration) || 1 })}
                    </span>
                    <span>
                      {t('instructor')}: {detail.instructor}
                    </span>
                  </div>
                </div>

                <div className="w-full shrink-0 lg:w-56">
                  {locked ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Lock className="h-4 w-4" />
                        <p className="text-sm font-semibold">{t('lockedTier')}</p>
                      </div>
                      <p className="mt-2 text-sm text-amber-900/80">{t('upgradeToUnlock')}</p>
                      <Link
                        href="/invest"
                        className="mt-3 inline-flex text-sm font-semibold text-[#0052ff] hover:underline"
                      >
                        {t('viewInvestmentPlans')} →
                      </Link>
                    </div>
                  ) : !detail.enrolled ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={handleEnroll}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Play className="h-4 w-4" />
                      {t('enroll')}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('progress')}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{detail.progress}%</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-[#0052ff]"
                          style={{ width: `${detail.progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {t('lessonsCompletedSummary', {
                          completed: completedLessons,
                          total: totalLessons,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!locked ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                  <h2 className="font-semibold text-gray-900">{t('syllabus')}</h2>
                  {!detail.enrolled ? (
                    <p className="mt-3 text-sm text-gray-500">{t('notEnrolled')}</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {detail.lessonsList.map((lesson, index) => {
                        const isActive = lesson.id === activeLesson?.id
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              disabled={!detail.enrolled}
                              onClick={() => setActiveLessonId(lesson.id)}
                              className={cn(
                                'flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                                isActive
                                  ? 'border-[#0052ff]/30 bg-blue-50'
                                  : 'border-transparent hover:bg-gray-50'
                              )}
                            >
                              <span className="mt-0.5 shrink-0">
                                {lesson.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-300" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-medium text-gray-400">
                                  {t('lessonNumber', { number: index + 1 })}
                                </span>
                                <span className="block text-sm font-medium text-gray-900">
                                  {lesson.title}
                                </span>
                                <span className="mt-0.5 block text-xs text-gray-500">
                                  {t('lessonDuration', { minutes: lesson.durationMinutes })}
                                </span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  {!detail.enrolled ? (
                    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                      <BookOpen className="h-10 w-10 text-gray-300" />
                      <p className="mt-4 text-lg font-semibold text-gray-900">{t('startCourseTitle')}</p>
                      <p className="mt-2 max-w-md text-sm text-gray-500">{t('startCourseDescription')}</p>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={handleEnroll}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0052ff] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Play className="h-4 w-4" />
                        {t('enroll')}
                      </button>
                    </div>
                  ) : activeLesson ? (
                    <>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#0052ff]">
                            {t('lessonContent')}
                          </p>
                          <h2 className="mt-1 text-xl font-bold text-gray-900">{activeLesson.title}</h2>
                          <p className="mt-1 text-sm text-gray-500">{activeLesson.description}</p>
                        </div>
                        {activeLesson.completed ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('lessonCompletedBadge')}
                          </span>
                        ) : null}
                      </div>

                      <div className="prose prose-sm mt-6 max-w-none rounded-xl border border-gray-100 bg-gray-50 p-5 text-gray-700">
                        <p className="whitespace-pre-wrap leading-relaxed">{activeLesson.content}</p>
                      </div>

                      {!activeLesson.completed ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={handleCompleteLesson}
                          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0052ff] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t('markComplete')}
                        </button>
                      ) : (
                        <p className="mt-6 text-sm text-emerald-600">{t('lessonCompleted')}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">{t('selectLesson')}</p>
                  )}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </AsyncState>
    </div>
  )
}
