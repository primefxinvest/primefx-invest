'use client'

import { useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, MailCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useEmailVerification } from '@/lib/auth/email-verification-context'
import { Button } from '@/components/ui/button'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

export type EmailVerificationResultStatus =
  | 'success'
  | 'failed'
  | 'expired'
  | 'already_verified'

const VALID_STATUSES = new Set<EmailVerificationResultStatus>([
  'success',
  'failed',
  'expired',
  'already_verified',
])

function resolveStatus(value: string | null): EmailVerificationResultStatus | null {
  if (!value || !VALID_STATUSES.has(value as EmailVerificationResultStatus)) return null
  return value as EmailVerificationResultStatus
}

export function EmailVerificationResultScreen() {
  const t = useTranslations('emailVerification')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshVerificationStatus, resendVerificationEmail, verified } = useEmailVerification()

  const status = resolveStatus(searchParams.get('emailVerification'))

  useEffect(() => {
    if (status === 'success') {
      void refreshVerificationStatus()
    }
  }, [status, refreshVerificationStatus])

  useEffect(() => {
    if (verified && status === 'success') {
      toast.success(t('verifiedSuccess'))
    }
  }, [verified, status, t])

  if (!status) return null

  const config = {
    success: {
      icon: CheckCircle,
      tone: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      title: t('resultSuccessTitle'),
      description: t('resultSuccessDescription'),
    },
    failed: {
      icon: AlertCircle,
      tone: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      title: t('resultFailedTitle'),
      description: t('resultFailedDescription'),
    },
    expired: {
      icon: Clock,
      tone: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      title: t('resultExpiredTitle'),
      description: t('resultExpiredDescription'),
    },
    already_verified: {
      icon: MailCheck,
      tone: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      title: t('resultAlreadyVerifiedTitle'),
      description: t('resultAlreadyVerifiedDescription'),
    },
  }[status]

  const Icon = config.icon

  const clearStatus = () => {
    router.replace('/settings')
  }

  return (
    <section
      aria-live="polite"
      className={cn(cardSurfaceClass, 'mb-6 border p-5 sm:p-6', config.bg)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Icon className={cn('h-8 w-8 shrink-0', config.tone)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === 'success' || status === 'already_verified' ? (
              <Button type="button" size="sm" onClick={clearStatus}>
                {t('continueToSettings')}
              </Button>
            ) : null}
            {status === 'failed' || status === 'expired' ? (
              <>
                <Button type="button" size="sm" onClick={() => void resendVerificationEmail()}>
                  {t('resendEmail')}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void refreshVerificationStatus()}>
                  {t('verifyEmail')}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
