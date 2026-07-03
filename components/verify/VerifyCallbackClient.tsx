'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { VerifyIdentityButton } from '@/components/VerifyIdentityButton'
import { getUserProfile } from '@/lib/profile/actions'

type VerificationResult = {
  sessionId: string
  diditStatus: string
  verificationStatus: string
  isVerified: boolean
  pending?: boolean
  error?: string
}

export function VerifyCallbackClient() {
  const t = useTranslations('verification')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')?.trim() ?? ''
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | undefined>()

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        if (profile.id) setProfileUserId(profile.id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setError(t('missingSessionId'))
      setLoading(false)
      return
    }

    let cancelled = false
    let attempts = 0

    async function poll() {
      try {
        const response = await fetch(
          `/api/verify/status?session_id=${encodeURIComponent(sessionId)}`
        )
        const payload = (await response.json()) as VerificationResult & { error?: string }

        if (!response.ok) {
          throw new Error(payload.error ?? t('statusCheckFailed'))
        }

        if (cancelled) return

        setResult(payload)

        if (payload.pending && attempts < 8) {
          attempts += 1
          window.setTimeout(poll, 2500)
          return
        }

        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t('statusCheckFailed'))
        setLoading(false)
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [sessionId, t])

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

  const isApproved = result?.isVerified || result?.verificationStatus === 'approved'
  const isDeclined = result?.verificationStatus === 'declined'
  const isExpired = result?.verificationStatus === 'expired'

  const title = isApproved
    ? t('identityVerified')
    : isDeclined
      ? t('verificationDeclined')
      : isExpired
        ? t('verificationExpired')
        : t('verificationInReview')

  const message = isApproved
    ? t('approvedMessage')
    : isDeclined
      ? t('declinedMessage')
      : isExpired
        ? t('expiredMessage')
        : t('reviewMessage')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {isApproved ? (
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      ) : isDeclined ? (
        <AlertCircle className="h-12 w-12 text-red-500" />
      ) : (
        <Clock className="h-12 w-12 text-amber-500" />
      )}

      <h1 className="mt-6 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">{message}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!isApproved ? (
          <VerifyIdentityButton
            userId={profileUserId}
            verificationStatus={result?.verificationStatus ?? 'pending'}
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
