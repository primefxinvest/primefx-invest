'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { CheckCircle2, Loader2, Wallet, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { syncDepositOrder } from '@/lib/payments/actions'
import { pageStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

const POLL_INTERVAL_MS = 5_000
const MAX_POLL_ATTEMPTS = 36

type DepositSyncDetails = {
  creditedAmountUsd: number | null
  requestedAmountUsd: number | null
  receivedAmountUsd: number | null
  isPartial: boolean
  providerPaymentId: string | null
  depositStatus: string | null
}

function formatUsd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function DepositSuccessView() {
  const t = useTranslations('wallet.deposit')
  const tBalances = useTranslations('wallet.balances')
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')?.trim() ?? ''
  const { wallet, reloadWallet } = useWalletPageData()
  const attemptsRef = useRef(0)
  const [syncState, setSyncState] = useState<'pending' | 'completed' | 'waiting'>('pending')
  const [details, setDetails] = useState<DepositSyncDetails>({
    creditedAmountUsd: null,
    requestedAmountUsd: null,
    receivedAmountUsd: null,
    isPartial: false,
    providerPaymentId: null,
    depositStatus: null,
  })

  const runSync = useCallback(async (): Promise<boolean> => {
    if (!orderId) {
      setSyncState('waiting')
      return false
    }

    try {
      const result = await syncDepositOrder(orderId)
      if (!result.success) {
        return false
      }

      if (result.amountUsd > 0) {
        setDetails({
          creditedAmountUsd: result.amountUsd,
          requestedAmountUsd: result.requestedAmountUsd ?? result.amountUsd,
          receivedAmountUsd: result.receivedAmountUsd ?? result.amountUsd,
          isPartial: Boolean(result.isPartial),
          providerPaymentId: result.providerPaymentId ?? null,
          depositStatus: result.depositStatus ?? null,
        })
      }

      if (result.status === 'failed') {
        router.replace(`/wallet/deposit/failed?order=${encodeURIComponent(orderId)}`)
        return false
      }

      if (result.status === 'completed') {
        setSyncState('completed')
        reloadWallet()
        window.dispatchEvent(new Event('primefx:wallet-updated'))
        window.dispatchEvent(new Event('primefx:transactions-updated'))
        return false
      }

      setSyncState('waiting')
      return result.status === 'pending'
    } catch {
      return attemptsRef.current < MAX_POLL_ATTEMPTS
    }
  }, [orderId, reloadWallet, router])

  useEffect(() => {
    attemptsRef.current = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      const shouldContinue = await runSync()
      if (!shouldContinue || attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        return
      }
      attemptsRef.current += 1
      timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    void poll()

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [runSync])

  const confirming = syncState !== 'completed'
  const isPartial = details.isPartial || details.depositStatus === 'COMPLETED_PARTIAL'

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <WalletPageHeader title={t('stepSuccess')} description={t('securityWalletCredit')} />

      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          {confirming ? (
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          ) : (
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          )}
        </div>

        <h2 className="mt-4 text-xl font-bold text-foreground">
          {confirming ? t('waitingConfirmation') : t('partialDepositSuccessTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirming
            ? t('securityAutoConfirm')
            : isPartial
              ? t('partialDepositSuccessBody')
              : 'Your deposit has been credited successfully.'}
        </p>

        {!confirming && isPartial ? (
          <p className="mt-2 text-sm font-medium text-emerald-700">{t('walletUpdatedSuccess')}</p>
        ) : null}

        <div className="mt-6 rounded-xl border border-emerald-200/80 bg-white p-4 text-left">
          {details.creditedAmountUsd != null ? (
            <div className="mb-4 border-b border-border/60 pb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('partialDepositCreditedLabel')}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
                {formatUsd(details.creditedAmountUsd)}
              </p>
            </div>
          ) : null}

          {isPartial && !confirming ? (
            <dl className="mb-4 space-y-2 border-b border-border/60 pb-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('requestedAmountLabel')}</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {formatUsd(details.requestedAmountUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('receivedAmountLabel')}</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {formatUsd(details.receivedAmountUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('depositStatusLabel')}</dt>
                <dd className="font-semibold text-emerald-700">
                  {details.depositStatus ?? t('statusCompletedPartial')}
                </dd>
              </div>
            </dl>
          ) : null}

          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tBalances('available')}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
            {wallet?.availableBalance ?? '$0.00'}
          </p>

          {orderId ? (
            <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="truncate font-mono text-xs text-foreground">{orderId}</dd>
              </div>
              {details.providerPaymentId ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t('paymentIdLabel')}</dt>
                  <dd className="truncate font-mono text-xs text-foreground">
                    {details.providerPaymentId}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="text-foreground">{new Date().toLocaleString()}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/wallet"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0046d9]"
          >
            <Wallet className="h-4 w-4" />
            View Wallet
          </Link>
          <Link
            href="/invest"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <TrendingUp className="h-4 w-4" />
            Continue Investing
          </Link>
        </div>
      </div>
    </div>
  )
}
