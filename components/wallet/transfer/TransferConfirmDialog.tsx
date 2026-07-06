'use client'

import { ArrowRight, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type TransferConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isProcessing: boolean
  recipientName: string
  recipientId: string
  amount: string
  fee: string
  totalDebit: string
  message?: string
}

export function TransferConfirmDialog({
  open,
  onClose,
  onConfirm,
  isProcessing,
  recipientName,
  recipientId,
  amount,
  fee,
  totalDebit,
  message,
}: TransferConfirmDialogProps) {
  const t = useTranslations('wallet.transfer')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-confirm-title"
    >
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="transfer-confirm-title" className="text-lg font-bold text-foreground">
            {t('reviewTransfer')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label={t('closeReview')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('recipient')}</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{recipientName}</dd>
              <dd className="font-mono text-xs text-muted-foreground">{recipientId}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t('transferAmount')}</dt>
              <dd className="font-semibold tabular-nums">${amount}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t('transferFee')}</dt>
              <dd className="text-right">
                <span className="block font-semibold tabular-nums">${fee}</span>
                <span className="text-xs text-muted-foreground">{t('transferFeeFixed')}</span>
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-3">
              <dt className="font-semibold text-foreground">{t('totalDebitLabel')}</dt>
              <dd className="text-lg font-bold tabular-nums text-[#0052ff]">${totalDebit}</dd>
            </div>
            {message ? (
              <div>
                <dt className="text-muted-foreground">{t('messageLabel')}</dt>
                <dd className="mt-0.5 text-foreground">"{message}"</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(
              'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 text-sm font-semibold text-white',
              'hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('processing')}
              </>
            ) : (
              <>
                {t('confirmTransfer')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
