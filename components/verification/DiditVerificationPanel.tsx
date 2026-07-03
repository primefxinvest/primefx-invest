'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react'
import { VerifyIdentityButton } from '@/components/VerifyIdentityButton'
import type { UserProfile } from '@/lib/profile/types'
import { cn } from '@/lib/utils'

interface DiditVerificationPanelProps {
  profile: Pick<UserProfile, 'id' | 'isVerified' | 'verificationStatus' | 'kycStatus'>
}

export function DiditVerificationPanel({ profile }: DiditVerificationPanelProps) {
  const t = useTranslations('verification')
  const isVerified = profile.isVerified || profile.kycStatus === 'Verified'
  const status = profile.verificationStatus ?? 'pending'

  if (isVerified) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold text-emerald-900">{t('identityVerified')}</h2>
            <p className="mt-1 text-sm text-emerald-800">{t('approvedMessage')}</p>
          </div>
        </div>
      </div>
    )
  }

  const statusMessage =
    status === 'declined'
      ? t('declinedMessage')
      : status === 'expired'
        ? t('expiredMessage')
        : status === 'approved'
          ? t('approvedMessage')
          : t('reviewMessage')

  const StatusIcon =
    status === 'declined' ? XCircle : status === 'expired' ? Clock : Clock

  const statusTone =
    status === 'declined'
      ? 'border-red-200 bg-red-50 text-red-900'
      : status === 'expired'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-blue-200 bg-blue-50 text-blue-900'

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0052ff]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <VerifyIdentityButton
          userId={profile.id}
          isVerified={profile.isVerified}
          verificationStatus={profile.verificationStatus}
          className="self-start sm:self-auto"
        />
      </div>

      {status !== 'pending' ? (
        <div className={cn('mt-5 flex items-start gap-3 rounded-lg border p-4 text-sm', statusTone)}>
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{statusMessage}</p>
        </div>
      ) : null}

      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        <li>• {t('bulletId')}</li>
        <li>• {t('bulletRedirect')}</li>
        <li>• {t('bulletAutoUpdate')}</li>
      </ul>
    </div>
  )
}
