'use client'

import { Loader2, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEmailVerification } from '@/lib/auth/email-verification-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EmailVerificationBanner() {
  const t = useTranslations('emailVerification')
  const {
    verified,
    resending,
    refreshing,
    resendCooldownSeconds,
    resendVerificationEmail,
    refreshVerificationStatus,
  } = useEmailVerification()

  if (verified) return null

  const resendDisabled = resending || resendCooldownSeconds > 0

  return (
    <div
      role="region"
      aria-live="polite"
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">{t('bannerTitle')}</p>
            <p className="mt-1 text-amber-900/90">{t('bannerDescription')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
              'bg-amber-100 text-amber-800'
            )}
          >
            {t('statusPending')}
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
            disabled={refreshing}
            onClick={() => void refreshVerificationStatus()}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('verifyEmail')}
          </Button>

          <Button
            type="button"
            size="sm"
            className="bg-amber-700 text-white hover:bg-amber-800"
            disabled={resendDisabled}
            onClick={() => void resendVerificationEmail()}
          >
            {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {resendCooldownSeconds > 0
              ? t('resendIn', { seconds: resendCooldownSeconds })
              : t('resendEmail')}
          </Button>
        </div>
      </div>
    </div>
  )
}
