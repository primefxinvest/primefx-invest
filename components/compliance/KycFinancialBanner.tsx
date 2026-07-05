'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { cn } from '@/lib/utils'

export function KycFinancialBanner({ className }: { className?: string }) {
  const t = useTranslations('compliance')
  const { loading, verified, status, summary, fetchError, refresh } = useFinancialKycAccess()

  if (loading || verified) return null

  if (fetchError) {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-900">{t('kycFetchErrorTitle')}</p>
            <p className="mt-0.5 text-sm text-red-800/90">{t('kycFetchErrorDescription')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          {t('kycRetryVerify')}
        </button>
      </div>
    )
  }

  if (!summary) return null

  const isRejected = status === 'rejected'

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        isRejected
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-amber-200 bg-amber-50 text-amber-900',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {isRejected ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {isRejected ? t('kycRejected') : t('kycRequired')}
          </p>
          <p className="mt-0.5 text-sm opacity-90">{summary}</p>
        </div>
      </div>
      <Link
        href="/profile"
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
          isRejected
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-amber-600 text-white hover:bg-amber-700'
        )}
      >
        {t('viewProfile')}
      </Link>
    </div>
  )
}
