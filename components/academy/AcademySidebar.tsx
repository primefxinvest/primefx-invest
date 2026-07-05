'use client'

import { useRef, useState } from 'react'
import {
  Award,
  Bell,
  ChevronRight,
  Crown,
  GraduationCap,
  Lock,
  Medal,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { AcademyProgressRing } from '@/components/academy/AcademyProgressRing'
import { useLearningReminder } from '@/components/academy/useLearningReminder'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import type { AcademyCourseItem } from '@/lib/data/types'
import { cn } from '@/lib/utils'

type CertificateItem = {
  name: string
  earned: boolean
  detail: string
  upcoming?: boolean
}

type AcademySidebarProps = {
  overallProgress: number
  completedCount: number
  totalCourses: number
  continueCourse: AcademyCourseItem | null
  canAccessAdvanced: boolean
  certificates: CertificateItem[]
}

function ReminderToggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        enabled ? 'bg-[#0052ff]' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

export function AcademySidebar({
  overallProgress,
  completedCount,
  totalCourses,
  continueCourse,
  canAccessAdvanced,
  certificates,
}: AcademySidebarProps) {
  const t = useTranslations('academy')
  const certificatesRef = useRef<HTMLDivElement>(null)
  const [certificatesExpanded, setCertificatesExpanded] = useState(false)
  const { settings, hydrated, setEnabled, setTime } = useLearningReminder()

  const continueHref = continueCourse ? `/academy/${continueCourse.id}` : '/academy'

  const handleReminderToggle = (enabled: boolean) => {
    setEnabled(enabled)
    toast.success(enabled ? t('reminderEnabled') : t('reminderDisabled'))
  }

  const handleTimeChange = (time: string) => {
    setTime(time)
    toast.success(t('reminderSaved'))
  }

  const scrollToCertificates = () => {
    setCertificatesExpanded(true)
    requestAnimationFrame(() => {
      certificatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  return (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <div className={dashboardCardClass}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0052ff]">
            <GraduationCap className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t('pathTitle')}</h3>
        </div>

        <div className="mt-4 flex flex-col items-center">
          <AcademyProgressRing percent={overallProgress} size={96} strokeWidth={7} label={t('pathTitle')} />
          <p className="mt-3 text-center text-sm font-medium text-foreground">
            {t('coursesCompletedSummary', { completed: completedCount, total: totalCourses })}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {t('remainingCourses', { count: Math.max(0, totalCourses - completedCount) })}
          </p>
        </div>

        <Link
          href={continueHref}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Play className="h-4 w-4 fill-current" />
          {t('continueLearning')}
        </Link>
      </div>

      <div ref={certificatesRef} className={dashboardCardClass}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Medal className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t('certificates')}</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('certificatesDescription')}</p>

        <ul className="mt-4 space-y-3">
          {certificates.map((cert) => (
            <li
              key={cert.name}
              className={cn(
                'flex items-start gap-3 rounded-lg transition-colors',
                certificatesExpanded && 'bg-muted/40 p-2'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  cert.earned
                    ? 'bg-emerald-50 text-emerald-600'
                    : cert.upcoming
                      ? 'bg-blue-50 text-[#0052ff]'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {cert.earned ? (
                  <Award className="h-4 w-4" />
                ) : cert.upcoming ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{cert.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{cert.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={scrollToCertificates}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:text-blue-700"
        >
          {t('viewCertificates')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {!canAccessAdvanced ? (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0052ff] via-[#2563eb] to-[#7c3aed] p-5 shadow-md transition-transform hover:-translate-y-0.5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
              <Crown className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-white">{t('premiumCourses')}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-blue-100">{t('premiumBenefits')}</p>
            <Link
              href="/invest"
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#0052ff] transition-opacity hover:opacity-90"
            >
              {t('upgradeNow')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className={cn(dashboardCardClass, 'border-emerald-200/60 bg-emerald-50/40')}>
          <div className="flex items-center gap-2 text-emerald-700">
            <Trophy className="h-4 w-4" />
            <p className="text-sm font-semibold">{t('premiumUnlocked')}</p>
          </div>
          <p className="mt-2 text-xs text-emerald-800/80">{t('premiumUnlockedDescription')}</p>
        </div>
      )}

      <div className={dashboardCardClass}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t('remindersTitle')}</h3>
              <p className="text-[11px] text-muted-foreground">{t('remindersDescription')}</p>
            </div>
          </div>
          {hydrated ? (
            <ReminderToggle enabled={settings.enabled} onChange={handleReminderToggle} />
          ) : (
            <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">{t('dailyReminder')}</span>
          <input
            type="time"
            value={settings.time}
            disabled={!settings.enabled || !hydrated}
            onChange={(event) => handleTimeChange(event.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('dailyReminder')}
          />
        </div>
      </div>
    </aside>
  )
}
