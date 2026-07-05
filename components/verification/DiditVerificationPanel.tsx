'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { VerifyIdentityButton } from '@/components/VerifyIdentityButton'
import type { UserProfile, UserVerificationStatus } from '@/lib/profile/types'
import { cn } from '@/lib/utils'

interface DiditVerificationPanelProps {
  profile: Pick<
    UserProfile,
    | 'id'
    | 'isVerified'
    | 'verificationStatus'
    | 'kycStatus'
    | 'verifiedAt'
    | 'kycRejectionReason'
  >
}

type CardState = 'not_verified' | 'pending_review' | 'in_progress' | 'verified' | 'declined' | 'expired'

function resolveCardState(profile: DiditVerificationPanelProps['profile']): CardState {
  if (profile.isVerified || profile.kycStatus === 'Verified' || profile.verificationStatus === 'approved') {
    return 'verified'
  }
  if (profile.verificationStatus === 'declined' || profile.kycStatus === 'Rejected') {
    return 'declined'
  }
  if (profile.verificationStatus === 'expired') {
    return 'expired'
  }
  if (profile.verificationStatus === 'pending_review') {
    return 'pending_review'
  }
  if (
    profile.verificationStatus === 'in_progress' ||
    profile.verificationStatus === 'abandoned'
  ) {
    return 'in_progress'
  }
  return 'not_verified'
}

const UNLOCK_FEATURES = ['deposits', 'withdrawals', 'transfers', 'investments'] as const

const PROGRESS_STEPS = ['start', 'verify', 'review', 'complete'] as const

function getProgressStep(state: CardState): number {
  switch (state) {
    case 'verified':
      return 4
    case 'pending_review':
      return 3
    case 'in_progress':
    case 'expired':
    case 'declined':
      return 2
    default:
      return 1
  }
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'amber' | 'blue' | 'emerald' | 'red' | 'gray'
}) {
  const tones = {
    amber: 'bg-amber-100 text-amber-800 ring-amber-200',
    blue: 'bg-blue-100 text-blue-800 ring-blue-200',
    emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    red: 'bg-red-100 text-red-800 ring-red-200',
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        tones[tone]
      )}
    >
      {label}
    </span>
  )
}

function ProgressIndicator({ currentStep, t }: { currentStep: number; t: (key: string) => string }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-1">
        {PROGRESS_STEPS.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isActive = stepNumber === currentStep

          return (
            <div key={step} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-[#0052ff] text-white'
                        : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                </div>
                <span
                  className={cn(
                    'hidden text-center text-[10px] font-medium sm:block',
                    isActive ? 'text-[#0052ff]' : isComplete ? 'text-emerald-600' : 'text-gray-400'
                  )}
                >
                  {t(`progress.${step}`)}
                </span>
              </div>
              {index < PROGRESS_STEPS.length - 1 ? (
                <div
                  className={cn(
                    'mx-1 h-0.5 flex-1 rounded-full',
                    stepNumber < currentStep ? 'bg-emerald-400' : 'bg-gray-200'
                  )}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UnlockList({ t }: { t: (key: string) => string }) {
  return (
    <ul className="mt-4 space-y-2">
      {UNLOCK_FEATURES.map((feature) => (
        <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#0052ff]/70" />
          {t(`unlock.${feature}`)}
        </li>
      ))}
    </ul>
  )
}

function VerificationDetails({
  profile,
  t,
  locale,
}: {
  profile: DiditVerificationPanelProps['profile']
  t: (key: string) => string
  locale: string
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
      <div className="rounded-lg bg-background/80 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('providerLabel')}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{t('providerName')}</p>
      </div>
      <div className="rounded-lg bg-background/80 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('securityLevelLabel')}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Shield className="h-3.5 w-3.5" />
          {t('securityLevelVerified')}
        </p>
      </div>
      {profile.verifiedAt ? (
        <div className="rounded-lg bg-background/80 p-3 sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('verifiedOnLabel')}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {new Intl.DateTimeFormat(locale, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(profile.verifiedAt))}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function DiditVerificationPanel({ profile }: DiditVerificationPanelProps) {
  const t = useTranslations('verification')
  const locale = useLocale()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const state = resolveCardState(profile)
  const progressStep = getProgressStep(state)

  const badge = (() => {
    switch (state) {
      case 'verified':
        return <StatusBadge label={t('badgeVerified')} tone="emerald" />
      case 'pending_review':
        return <StatusBadge label={t('badgePendingReview')} tone="amber" />
      case 'in_progress':
        return <StatusBadge label={t('badgeInProgress')} tone="blue" />
      case 'declined':
        return <StatusBadge label={t('badgeDeclined')} tone="red" />
      case 'expired':
        return <StatusBadge label={t('badgeExpired')} tone="gray" />
      default:
        return <StatusBadge label={t('badgeRequired')} tone="amber" />
    }
  })()

  const headerIcon = (() => {
    switch (state) {
      case 'verified':
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
            <BadgeCheck className="h-6 w-6" />
          </div>
        )
      case 'declined':
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white shadow-sm">
            <XCircle className="h-6 w-6" />
          </div>
        )
      case 'pending_review':
      case 'in_progress':
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-sm">
            <Clock className="h-6 w-6" />
          </div>
        )
      default:
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
            <AlertTriangle className="h-6 w-6" />
          </div>
        )
    }
  })()

  const title = (() => {
    switch (state) {
      case 'verified':
        return t('cardVerifiedTitle')
      case 'pending_review':
        return t('cardPendingTitle')
      case 'in_progress':
        return t('cardInProgressTitle')
      case 'declined':
        return t('cardDeclinedTitle')
      case 'expired':
        return t('cardExpiredTitle')
      default:
        return t('cardRequiredTitle')
    }
  })()

  const description = (() => {
    switch (state) {
      case 'verified':
        return t('cardVerifiedDescription')
      case 'pending_review':
        return t('cardPendingDescription')
      case 'in_progress':
        return t('cardInProgressDescription')
      case 'declined':
        return t('cardDeclinedDescription')
      case 'expired':
        return t('cardExpiredDescription')
      default:
        return t('cardRequiredDescription')
    }
  })()

  return (
    <section
      aria-label={t('title')}
      className={cn(
        'overflow-hidden rounded-2xl border shadow-sm transition-colors',
        state === 'verified'
          ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-card to-card'
          : 'border-border bg-card'
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {headerIcon}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
                {badge}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              {state === 'verified' && profile.verifiedAt ? (
                <p className="mt-2 text-sm font-medium text-emerald-700">
                  {t('verifiedOnLabel')}:{' '}
                  {new Intl.DateTimeFormat(locale, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(profile.verifiedAt))}
                </p>
              ) : null}
              {state === 'declined' && profile.kycRejectionReason ? (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  <span className="font-semibold">{t('declineReasonLabel')}:</span>{' '}
                  {profile.kycRejectionReason}
                </p>
              ) : null}
              {state === 'pending_review' ? (
                <p className="mt-2 text-sm font-medium text-amber-700">{t('estimatedReviewTime')}</p>
              ) : null}
            </div>
          </div>

          {state !== 'verified' ? (
            <VerifyIdentityButton
              userId={profile.id}
              isVerified={profile.isVerified}
              verificationStatus={profile.verificationStatus as UserVerificationStatus}
              className="w-full shrink-0 sm:w-auto"
            />
          ) : (
            <button
              type="button"
              onClick={() => setDetailsOpen((open) => !open)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 sm:w-auto"
            >
              {t('viewVerificationDetails')}
              {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>

        {state !== 'verified' ? <ProgressIndicator currentStep={progressStep} t={t} /> : null}

        {state === 'not_verified' || state === 'expired' || state === 'declined' ? (
          <UnlockList t={t} />
        ) : null}

        {state === 'verified' && detailsOpen ? (
          <VerificationDetails profile={profile} t={t} locale={locale} />
        ) : null}

        {state === 'verified' ? (
          <div className="mt-5 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              {t('unlockedFeaturesTitle')}
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {UNLOCK_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-800"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  {t(`unlock.${feature}`)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {state !== 'verified' ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0052ff]" />
            <div className="min-w-0 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">{t('providerName')}</p>
              <p className="mt-1">{t('bulletRedirect')}</p>
              <p className="mt-1 flex items-center gap-1 text-[#0052ff]">
                <ArrowRight className="h-3 w-3" />
                {t('bulletAutoUpdate')}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
