'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'
import { VerifyIdentityButton } from '@/components/VerifyIdentityButton'
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#0052ff]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-2 text-sm text-gray-500">{t('description')}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <VerifyIdentityButton
            isVerified={profile.isVerified}
            verificationStatus={profile.verificationStatus}
          />
        </div>

        {!profile.isVerified ? (
          <ul className="mt-8 space-y-2 text-sm text-gray-600">
            <li>• {t('bulletId')}</li>
            <li>• {t('bulletRedirect')}</li>
            <li>• {t('bulletAutoUpdate')}</li>
          </ul>
        ) : null}
      </div>
    </div>
  )
}
