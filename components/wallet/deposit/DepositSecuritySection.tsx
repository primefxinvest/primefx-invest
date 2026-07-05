'use client'

import { CheckCircle2, RefreshCw, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const SECURITY_ITEMS = [
  'securitySecureProcessing',
  'securityAutoConfirm',
  'securityWalletCredit',
  'securityFraud',
] as const

export function DepositSecuritySection() {
  const t = useTranslations('wallet.deposit')

  return (
    <div className={cn(dashboardCardClass, 'border-emerald-200/60 bg-emerald-50/40 shadow-sm')}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Shield className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-sm font-semibold text-foreground sm:text-base">{t('securityTitle')}</h2>
      </div>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {SECURITY_ITEMS.map((key) => (
          <li key={key} className="flex items-start gap-2 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type DepositErrorBannerProps = {
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function DepositErrorBanner({ message, onRetry, retryLabel }: DepositErrorBannerProps) {
  return (
    <div
      className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4"
      role="alert"
    >
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel ?? 'Try again'}
        </button>
      ) : null}
    </div>
  )
}
