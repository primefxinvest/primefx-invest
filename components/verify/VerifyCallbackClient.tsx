'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { VerifyIdentityButton } from '@/components/VerifyIdentityButton'
import { getUserProfile } from '@/lib/profile/actions'
import {
  getDiditCallbackStatus,
  getVerificationSessionIdFromSearchParams,
  mapDiditCallbackStatusToVerificationStatus,
} from '@/lib/didit/callback-params'
import { isTerminalDiditStatus } from '@/lib/didit/status-maps'
import { useUserVerificationRealtime } from '@/lib/hooks/useVerificationRealtime'

type VerificationResult = {
  sessionId: string
  diditStatus: string
  verificationStatus: string
  isVerified: boolean
  pending?: boolean
  sessionNotFound?: boolean
  message?: string
  error?: string
}

export function VerifyCallbackClient() {
  const t = useTranslations('verification')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const sessionId = useMemo(
    () => getVerificationSessionIdFromSearchParams(searchParams),
    // searchParams identity changes; queryString is the stable serialized form
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryString]
  )
  const callbackStatus = useMemo(
    () => getDiditCallbackStatus(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryString]
  )
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | undefined>()
  const pollCancelledRef = useRef(false)

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        if (profile.id) setProfileUserId(profile.id)
      })
      .catch(() => {})
  }, [])

  const applyVerificationResult = useCallback((payload: VerificationResult) => {
    setResult(payload)
    setError(null)
    setLoading(false)
  }, [])

  useUserVerificationRealtime({
    userId: profileUserId,
    sessionId: sessionId || undefined,
    onUpdate: (update) => {
      pollCancelledRef.current = true
      applyVerificationResult({
        sessionId: update.sessionId ?? sessionId ?? '',
        diditStatus: update.diditStatus ?? update.verificationStatus,
        verificationStatus: update.verificationStatus,
        isVerified: update.isVerified,
        pending:
          !update.isVerified &&
          !isTerminalDiditStatus(update.diditStatus) &&
          update.verificationStatus === 'pending',
      })
    },
  })

  const missingSessionIdMessage = t('missingSessionId')
  const statusCheckFailedMessage = t('statusCheckFailed')

  useEffect(() => {
    if (!sessionId) {
      setError(missingSessionIdMessage)
      setLoading(false)
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    pollCancelledRef.current = false

    let cancelled = false
    let attempts = 0

    async function poll() {
      if (pollCancelledRef.current || cancelled) return

      try {
        const response = await fetch(
          `/api/verify/status?verificationSessionId=${encodeURIComponent(sessionId)}`
        )
        const payload = (await response.json()) as VerificationResult & { error?: string }

        if (!response.ok) {
          throw new Error(payload.error ?? statusCheckFailedMessage)
        }

        if (cancelled || pollCancelledRef.current) return

        applyVerificationResult(payload)

        if (payload.pending && attempts < 8 && !pollCancelledRef.current) {
          attempts += 1
          window.setTimeout(poll, 2500)
          return
        }

        setLoading(false)
      } catch (err) {
        if (cancelled || pollCancelledRef.current) return
        setError(err instanceof Error ? err.message : statusCheckFailedMessage)
        setLoading(false)
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [sessionId, missingSessionIdMessage, statusCheckFailedMessage, applyVerificationResult])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0052ff]" />
        <h1 className="mt-6 text-2xl font-bold text-gray-900">{t('checkingStatus')}</h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">{t('pleaseWait')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h1 className="mt-6 text-2xl font-bold text-gray-900">{t('checkFailedTitle')}</h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">{error}</p>
        <Link
          href="/verify"
          className="mt-6 rounded-lg bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('backToVerification')}
        </Link>
      </div>
    )
  }

  const isApproved =
    result?.isVerified ||
    result?.verificationStatus === 'approved' ||
    mapDiditCallbackStatusToVerificationStatus(callbackStatus) === 'approved'
  const isDeclined =
    result?.verificationStatus === 'declined' ||
    mapDiditCallbackStatusToVerificationStatus(callbackStatus) === 'declined'
  const isExpired =
    result?.sessionNotFound ||
    result?.verificationStatus === 'expired' ||
    mapDiditCallbackStatusToVerificationStatus(callbackStatus) === 'expired'

  const message = isApproved
    ? t('approvedMessage')
    : isDeclined
      ? t('declinedMessage')
      : isExpired
        ? result?.sessionNotFound
          ? t('sessionNotFoundMessage')
          : t('expiredMessage')
        : t('reviewMessage')

  const title = isApproved
    ? t('identityVerified')
    : isDeclined
      ? t('verificationDeclined')
      : isExpired
        ? result?.sessionNotFound
          ? t('sessionNotFoundTitle')
          : t('verificationExpired')
        : t('verificationInReview')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {isApproved ? (
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      ) : isDeclined ? (
        <AlertCircle className="h-12 w-12 text-red-500" />
      ) : isExpired ? (
        <AlertCircle className="h-12 w-12 text-amber-500" />
      ) : (
        <Clock className="h-12 w-12 text-amber-500" />
      )}

      <h1 className="mt-6 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">{message}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!isApproved ? (
          <VerifyIdentityButton
            userId={profileUserId}
            verificationStatus={
              isExpired ? 'expired' : (result?.verificationStatus ?? 'pending')
            }
          />
        ) : null}
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {tCommon('goToDashboard')}
        </Link>
      </div>
    </div>
  )
}
