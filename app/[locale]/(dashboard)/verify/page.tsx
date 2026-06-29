'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { DiditVerificationPanel } from '@/components/verification/DiditVerificationPanel'
import { ErrorState } from '@/components/shared/data-state'
import { ProfileSkeleton } from '@/components/shared/skeletons'
import { getUserProfile } from '@/lib/profile/actions'
import type { UserProfile } from '@/lib/profile/types'

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
  }, [t])

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
    <div className="mx-auto max-w-2xl">
      <DiditVerificationPanel profile={profile} />
    </div>
  )
}
