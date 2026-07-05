'use client'

import { useState } from 'react'
import { BookOpen, Clock, Loader2, Lock, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  difficultyStyles,
  getCourseIcon,
  getCourseIconStyle,
  normalizeDifficulty,
} from '@/components/academy/constants'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import type { AcademyCourseItem } from '@/lib/data/types'
import { cn } from '@/lib/utils'

type AcademyCourseCardProps = {
  course: AcademyCourseItem
  locked: boolean
  href: string
}

export function AcademyCourseCard({ course, locked, href }: AcademyCourseCardProps) {
  const t = useTranslations('academy')
  const [navigating, setNavigating] = useState(false)

  const Icon = getCourseIcon(course.title, course.category)
  const iconStyle = getCourseIconStyle(course.category)
  const diffKey = normalizeDifficulty(course.difficulty)
  const progress = course.completed ? 100 : course.progress

  const actionLabel = locked
    ? t('viewCourse')
    : course.completed
      ? t('review')
      : course.progress > 0
        ? t('continue')
        : t('startLearning')

  return (
    <article
      className={cn(
        dashboardCardClass,
        'group flex h-full min-h-[15.5rem] flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md',
        locked && 'opacity-95'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
            locked ? 'bg-muted text-muted-foreground' : iconStyle.bg,
            !locked && iconStyle.text
          )}
        >
          {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset sm:text-[11px]',
            difficultyStyles[diffKey] ?? 'bg-muted text-muted-foreground ring-border'
          )}
        >
          {course.difficulty}
        </span>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {course.description}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground sm:text-xs">
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('lessons', { count: course.lessons })}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('weeks', { count: Number(course.duration) || 1 })}
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] font-medium sm:text-[11px]">
          <span className="text-muted-foreground">{t('progress')}</span>
          <span className="tabular-nums text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[#0052ff] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
          {t('percentComplete', { percent: progress })}
        </p>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3">
        <Link
          href={href}
          onClick={() => setNavigating(true)}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
            locked ? 'text-muted-foreground hover:text-foreground' : 'text-[#0052ff] hover:text-blue-700'
          )}
        >
          {navigating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
          )}
          {actionLabel}
        </Link>
      </div>
    </article>
  )
}

export function AcademyCourseCardSkeleton() {
  return (
    <div className={cn(dashboardCardClass, 'min-h-[15.5rem] animate-pulse')}>
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-xl bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-muted" />
    </div>
  )
}
