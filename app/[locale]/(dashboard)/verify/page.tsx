'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { DiditVerificationPanel } from '@/components/verification/DiditVerificationPanel'
import { ErrorState } from '@/components/shared/data-state'
import { ProfileSkeleton } from '@/components/shared/skeletons'
import { getUserProfile } from '@/lib/profile/actions'
import type { UserProfile, UserVerificationStatus } from '@/lib/profile/types'
import { useUserVerificationRealtime } from '@/lib/hooks/useVerificationRealtime'

export default function VerifyPage() {
  const t = useTranslations('verification')
  const tCommon = useTranslations('common')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : t('loadStatusFailed')))
      .finally(() => setLoading(false))

    const handleUpdate = () => {
      getUserProfile().then(setProfile).catch(() => {})
    }

    window.addEventListener('primefx:verification-updated', handleUpdate)
    return () => window.removeEventListener('primefx:verification-updated', handleUpdate)
  }, [t])

  useUserVerificationRealtime({
    userId: profile?.id,
    onUpdate: (update) => {
      setProfile((current) => {
        if (!current) return current

        const verificationStatus = update.verificationStatus as UserVerificationStatus
        const isVerified = update.isVerified || verificationStatus === 'approved'

        return {
          ...current,
          isVerified,
          verificationStatus,
          kycStatus: isVerified
            ? 'Verified'
            : verificationStatus === 'declined'
              ? 'Rejected'
              : 'Pending',
          verifiedAt: isVerified && !current.verifiedAt ? new Date().toISOString() : current.verifiedAt,
        }
      })
    },
  })

  if (loading) return <ProfileSkeleton />

  if (error || !profile) {
    return (
      <ErrorState
        title={t('loadStatusTitle')}
        description={error ?? tCommon('tryAgain')}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="mx-auto min-w-0 max-w-2xl">
      <DiditVerificationPanel profile={profile} />
    </div>
  )
}
