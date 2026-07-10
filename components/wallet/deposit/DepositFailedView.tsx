'use client'

import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { pageStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

export function DepositFailedView() {
  const t = useTranslations('wallet.deposit')
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')?.trim() ?? ''

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <WalletPageHeader title={t('depositFailed')} description={t('retryDeposit')} />

      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-foreground">{t('depositFailed')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment was not completed. No funds were added to your wallet.
        </p>

        {orderId ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {orderId}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/wallet/deposit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0046d9]"
          >
            <RotateCcw className="h-4 w-4" />
            {t('retryDeposit')}
          </Link>
          <Link
            href="/wallet"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to Wallet
          </Link>
        </div>
      </div>
    </div>
  )
}
