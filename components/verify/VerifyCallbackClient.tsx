'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { VerifyIdentityButton } from '@/components/VerifyIdentityButton'
import { getUserProfile } from '@/lib/profile/actions'
import {
  getDiditCallbackStatus,
  getVerificationSessionIdFromSearchParams,
  mapDiditCallbackStatusToVerificationStatus,
} from '@/lib/didit/callback-params'
import {
  clearStoredDiditSessionId,
  clearVerifyReturnPath,
  resolveCallbackSessionId,
  resolveVerifyReturnPath,
  type VerifyReturnPath,
} from '@/lib/didit/callback-session'
import { isTerminalDiditStatus } from '@/lib/didit/status-maps'
import { useUserVerificationRealtime } from '@/lib/hooks/useVerificationRealtime'
import { cn } from '@/lib/utils'

type VerificationResult = {
  sessionId: string
  diditStatus: string
  verificationStatus: string
  isVerified: boolean
  pending?: boolean
  sessionNotFound?: boolean
  message?: string
  error?: string
  source?: string
}

type CallbackPhase = 'checking' | 'success' | 'review' | 'declined' | 'expired' | 'error'

const UNLOCK_FEATURES = ['deposits', 'withdrawals', 'transfers', 'investments'] as const
const REDIRECT_DELAY_MS = 2000
const REDIRECT_FAILSAFE_MS = 5000
const REDIRECT_HARD_FALLBACK_MS = 400

function logCallbackRedirect(event: string, data: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      event,
      component: 'verify-callback',
      timestamp: new Date().toISOString(),
      ...data,
    })
  )
}

function isOnCallbackPage(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.includes('/verify/callback')
}

function buildStatusUrl(sessionId?: string): string {
  if (sessionId) {
    return `/api/verify/status?verificationSessionId=${encodeURIComponent(sessionId)}`
  }
  return '/api/verify/status'
}

function dispatchVerificationUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('primefx:verification-updated'))
}

export function VerifyCallbackClient() {
  const t = useTranslations('verification')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const urlSessionId = useMemo(
    () => getVerificationSessionIdFromSearchParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryString]
  )
  const effectiveSessionId = useMemo(
    () => resolveCallbackSessionId(urlSessionId),
    [urlSessionId]
  )
  const callbackStatus = useMemo(
    () => getDiditCallbackStatus(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryString]
  )
  const [phase, setPhase] = useState<CallbackPhase>('checking')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | undefined>()
  const [redirectCountdown, setRedirectCountdown] = useState(2)
  const [showFailsafeButton, setShowFailsafeButton] = useState(false)
  const [redirectTarget, setRedirectTarget] = useState<VerifyReturnPath>('/dashboard')
  const pollCancelledRef = useRef(false)
  const redirectScheduledRef = useRef(false)

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        if (profile.id) setProfileUserId(profile.id)
      })
      .catch(() => {})
  }, [])

  const resolvePhase = useCallback(
    (payload: VerificationResult): CallbackPhase => {
      const isApproved =
        payload.isVerified ||
        payload.verificationStatus === 'approved' ||
        mapDiditCallbackStatusToVerificationStatus(callbackStatus) === 'approved'

      if (isApproved) return 'success'

      if (
        payload.verificationStatus === 'declined' ||
        mapDiditCallbackStatusToVerificationStatus(callbackStatus) === 'declined'
      ) {
        return 'declined'
      }

      if (
        payload.sessionNotFound ||
        payload.verificationStatus === 'expired' ||
        mapDiditCallbackStatusToVerificationStatus(callbackStatus) === 'expired'
      ) {
        return 'expired'
      }

      if (payload.pending) return 'review'
      return 'review'
    },
    [callbackStatus]
  )

  const applyVerificationResult = useCallback(
    (payload: VerificationResult) => {
      setResult(payload)
      setError(null)
      const nextPhase = resolvePhase(payload)
      setPhase(nextPhase)

      if (
        payload.isVerified ||
        payload.verificationStatus === 'approved' ||
        payload.verificationStatus === 'declined' ||
        payload.verificationStatus === 'expired' ||
        payload.sessionNotFound
      ) {
        clearStoredDiditSessionId()
      }

      if (payload.isVerified || payload.verificationStatus === 'approved') {
        dispatchVerificationUpdated()
      }
    },
    [resolvePhase]
  )

  useUserVerificationRealtime({
    userId: profileUserId,
    sessionId: effectiveSessionId || undefined,
    onUpdate: (update) => {
      pollCancelledRef.current = true
      applyVerificationResult({
        sessionId: update.sessionId ?? effectiveSessionId ?? '',
        diditStatus: update.diditStatus ?? update.verificationStatus,
        verificationStatus: update.verificationStatus,
        isVerified: update.isVerified,
        pending:
          !update.isVerified &&
          !isTerminalDiditStatus(update.diditStatus) &&
          update.verificationStatus !== 'approved',
        source: 'realtime',
      })
    },
  })

  const statusCheckFailedMessage = t('statusCheckFailed')

  const performRedirect = useCallback(
    (target: VerifyReturnPath, method: 'timer' | 'manual' | 'failsafe' = 'timer') => {
      clearVerifyReturnPath()
      logCallbackRedirect('REDIRECT_TRIGGERED', { target, method })

      try {
        router.replace(target)
      } catch {
        window.location.replace(target)
      }

      window.setTimeout(() => {
        if (isOnCallbackPage()) {
          window.location.replace(target)
        }
      }, REDIRECT_HARD_FALLBACK_MS)

      logCallbackRedirect('REDIRECT_COMPLETED', { target, method })
    },
    [router]
  )

  useEffect(() => {
    if (phase !== 'success') return
    if (redirectScheduledRef.current) return

    redirectScheduledRef.current = true
    const target = resolveVerifyReturnPath()
    setRedirectTarget(target)

    logCallbackRedirect('VERIFICATION_SUCCESS', { target })
    logCallbackRedirect('REDIRECT_TIMER_STARTED', { target, delayMs: REDIRECT_DELAY_MS })

    setRedirectCountdown(REDIRECT_DELAY_MS / 1000)

    const countdown = window.setInterval(() => {
      setRedirectCountdown((value) => Math.max(0, value - 1))
    }, 1000)

    const redirectTimer = window.setTimeout(() => {
      performRedirect(target, 'timer')
    }, REDIRECT_DELAY_MS)

    const failsafeTimer = window.setTimeout(() => {
      if (isOnCallbackPage()) {
        setShowFailsafeButton(true)
      }
    }, REDIRECT_FAILSAFE_MS)

    return () => {
      window.clearInterval(countdown)
      window.clearTimeout(redirectTimer)
      window.clearTimeout(failsafeTimer)
    }
  }, [phase, performRedirect])

  useEffect(() => {
    setPhase('checking')
    setError(null)
    setResult(null)
    setShowFailsafeButton(false)
    pollCancelledRef.current = false
    redirectScheduledRef.current = false

    let cancelled = false
    let attempts = 0

    async function poll() {
      if (pollCancelledRef.current || cancelled) return

      try {
        const response = await fetch(buildStatusUrl(effectiveSessionId || undefined))
        const payload = (await response.json()) as VerificationResult & { error?: string }

        if (!response.ok) {
          throw new Error(payload.error ?? statusCheckFailedMessage)
        }

        if (cancelled || pollCancelledRef.current) return

        applyVerificationResult(payload)

        if (payload.pending && attempts < 12 && !pollCancelledRef.current) {
          attempts += 1
          window.setTimeout(poll, 2000)
        }
      } catch (err) {
        if (cancelled || pollCancelledRef.current) return
        setError(err instanceof Error ? err.message : statusCheckFailedMessage)
        setPhase('error')
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [effectiveSessionId, statusCheckFailedMessage, applyVerificationResult])

  const handleManualContinue = useCallback(() => {
    const primary = redirectTarget
    const fallback: VerifyReturnPath = primary === '/dashboard' ? '/profile' : '/dashboard'
    performRedirect(primary, 'manual')
    window.setTimeout(() => {
      if (isOnCallbackPage()) {
        performRedirect(fallback, 'failsafe')
      }
    }, REDIRECT_HARD_FALLBACK_MS)
  }, [performRedirect, redirectTarget])

  const shellClass =
    'mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10 text-center'

  if (phase === 'checking') {
    return (
      <div className={shellClass}>
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2 className="h-8 w-8 animate-spin text-[#0052ff]" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
            {t('callbackCheckingTitle')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('callbackCheckingDescription')}</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-[#0052ff]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0052ff]" />
            {t('callbackSyncing')}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className={shellClass}>
        <div className="w-full rounded-2xl border border-red-200 bg-card p-8 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-6 text-2xl font-bold text-foreground">{t('checkFailedTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link
            href="/verify"
            className="mt-6 inline-flex rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t('backToVerification')}
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'success') {
    return (
      <div className={shellClass}>
        <div className="w-full overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-card to-card p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
            {t('callbackSuccessTitle')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('callbackSuccessDescription')}
          </p>

          <div className="mt-6 rounded-xl border border-emerald-200/70 bg-white/80 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              {t('unlockedFeaturesTitle')}
            </p>
            <ul className="mt-3 space-y-2">
              {UNLOCK_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  {t(`unlock.${feature}`)}
                </li>
              ))}
            </ul>
          </div>

          {!showFailsafeButton ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#0052ff]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('callbackRedirecting', { seconds: redirectCountdown })}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleManualContinue}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
            >
              {redirectTarget === '/profile' ? t('callbackContinueProfile') : t('callbackContinue')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  const isDeclined = phase === 'declined'
  const isExpired = phase === 'expired'

  const title = isDeclined
    ? t('verificationDeclined')
    : isExpired
      ? result?.sessionNotFound
        ? t('sessionNotFoundTitle')
        : t('verificationExpired')
      : t('verificationInReview')

  const message = isDeclined
    ? t('declinedMessage')
    : isExpired
      ? result?.sessionNotFound
        ? t('sessionNotFoundMessage')
        : t('expiredMessage')
      : t('reviewMessage')

  return (
    <div className={shellClass}>
      <div
        className={cn(
          'w-full rounded-2xl border bg-card p-8 shadow-sm',
          isDeclined ? 'border-red-200' : 'border-amber-200'
        )}
      >
        {isDeclined ? (
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        ) : (
          <Clock className="mx-auto h-12 w-12 text-amber-500" />
        )}

        <h1 className="mt-6 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        {!isDeclined ? (
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[#0052ff]" />
            {t('bulletAutoUpdate')}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isDeclined || isExpired ? (
            <VerifyIdentityButton
              userId={profileUserId}
              verificationStatus={isExpired ? 'expired' : (result?.verificationStatus ?? 'pending')}
            />
          ) : null}
          <Link
            href={isDeclined || isExpired ? '/profile' : '/dashboard'}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            {tCommon('goToDashboard')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
