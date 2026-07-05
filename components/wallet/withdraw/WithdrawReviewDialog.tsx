'use client'

import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CryptoAssetIcon } from '@/components/wallet/withdraw/CryptoAssetIcon'
import { NetworkBadge } from '@/components/wallet/withdraw/CryptoAssetIcon'
import type { WithdrawAssetId } from '@/lib/payments/withdraw-networks'
import { cn } from '@/lib/utils'

type WithdrawReviewDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isProcessing: boolean
  assetId: WithdrawAssetId
  assetName: string
  networkLabel: string
  networkBadge: string
  address: string
  amountUsd: string
  networkFee: string
  platformFee: string
  youWillReceive: string
  processingTime: string
}

export function WithdrawReviewDialog({
  open,
  onClose,
  onConfirm,
  isProcessing,
  assetId,
  assetName,
  networkLabel,
  networkBadge,
  address,
  amountUsd,
  networkFee,
  platformFee,
  youWillReceive,
  processingTime,
}: WithdrawReviewDialogProps) {
  const t = useTranslations('wallet.withdraw')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-review-title"
    >
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="withdraw-review-title" className="text-lg font-bold text-foreground">
            {t('reviewTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label={t('reviewClose')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <CryptoAssetIcon assetId={assetId} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{assetName}</p>
              <div className="mt-1 flex items-center gap-2">
                <NetworkBadge label={networkBadge} />
                <span className="truncate text-xs text-muted-foreground">{networkLabel}</span>
              </div>
            </div>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('walletAddress')}</dt>
              <dd className="mt-1 break-all font-mono text-xs font-medium text-foreground">{address}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t('summaryWithdrawalAmount')}</dt>
              <dd className="font-semibold tabular-nums">{amountUsd}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t('summaryNetworkFee')}</dt>
              <dd className="font-semibold tabular-nums">{networkFee}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t('summaryPlatformFee')}</dt>
              <dd className="font-semibold tabular-nums">{platformFee}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-3">
              <dt className="font-semibold text-foreground">{t('youWillReceive')}</dt>
              <dd className="text-lg font-bold tabular-nums text-[#0052ff]">{youWillReceive}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t('summaryProcessingTime')}</dt>
              <dd className="font-semibold text-[#0052ff]">{processingTime}</dd>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('irreversibleNotice')}
          </p>
        </div>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(
              'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 text-sm font-semibold text-white shadow-lg shadow-[#0052ff]/20 transition-all',
              'hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60',
              isProcessing && 'animate-pulse'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('processing')}
              </>
            ) : (
              <>
                {t('confirmWithdrawal')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
