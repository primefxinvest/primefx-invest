'use client'

import { ArrowUpFromLine, Loader2, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CustomSelect } from '@/components/ui/custom-select'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { calculateWithdrawalFee, WITHDRAWAL_NOTICE_DAYS } from '@/lib/fees/constants'
import { cn } from '@/lib/utils'

type WithdrawFormCardProps = {
  amount: string
  onAmountChange: (value: string) => void
  currency: string
  onCurrencyChange: (value: string) => void
  currencies: Array<{ value: string; label: string }>
  address: string
  onAddressChange: (value: string) => void
  note: string
  onNoteChange: (value: string) => void
  available: number
  onSubmit: () => void
  isProcessing?: boolean
  kycLoading?: boolean
  withdrawDisabled?: boolean
  nowPaymentsEnabled?: boolean
}

export function WithdrawFormCard({
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  currencies,
  address,
  onAddressChange,
  note,
  onNoteChange,
  available,
  onSubmit,
  isProcessing = false,
  kycLoading = false,
  withdrawDisabled = false,
  nowPaymentsEnabled = true,
}: WithdrawFormCardProps) {
  const t = useTranslations('wallet.withdraw')
  const tDeposit = useTranslations('wallet.deposit')

  const amountNum = Number(amount) || 0
  const minWithdrawal = INVESTOR_RULES.financial.minimumWithdrawal
  const { fee, netAmount } = calculateWithdrawalFee(amountNum)
  const isLocked = isProcessing || kycLoading
  const buttonDisabled = isLocked || withdrawDisabled || !amount.trim() || !address.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buttonDisabled) onSubmit()
  }

  const buttonLabel = kycLoading
    ? tDeposit('kycCheckingButton')
    : isProcessing
      ? t('processing')
      : t('reviewWithdrawal')

  return (
    <div className={cn(dashboardCardClass, 'shadow-md')}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
          <ArrowUpFromLine className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            {t('withdrawDetails')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {t('description')}
          </p>
        </div>
      </div>

      {!nowPaymentsEnabled ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900" role="status">
          {t('nowPaymentsNotConfigured')}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="withdraw-currency" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('cryptoCurrency')}
              </label>
              <CustomSelect
                value={currency}
                onValueChange={onCurrencyChange}
                options={currencies}
                disabled={isLocked || currencies.length === 0}
                placeholder={t('selectCurrency')}
              />
            </div>

            <div>
              <label htmlFor="withdraw-amount" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('amountUsd')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  $
                </span>
                <input
                  id="withdraw-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value.replace(/[^\d.]/g, ''))}
                  readOnly={isLocked}
                  className={cn(
                    'w-full rounded-xl border border-border bg-background py-3 pl-7 pr-4 text-lg font-bold tabular-nums text-foreground',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    isLocked && 'opacity-60'
                  )}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Min ${minWithdrawal.toFixed(2)} · Available ${available.toFixed(2)}
              </p>
            </div>

            <div>
              <label htmlFor="withdraw-address" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('walletAddress')}
              </label>
              <input
                id="withdraw-address"
                type="text"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder={t('addressPlaceholder')}
                readOnly={isLocked}
                className={cn(
                  'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground',
                  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                  isLocked && 'opacity-60'
                )}
              />
            </div>

            <div>
              <label htmlFor="withdraw-note" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('noteOptional')}
              </label>
              <textarea
                id="withdraw-note"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                maxLength={100}
                rows={2}
                readOnly={isLocked}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">{t('youWillReceive')}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              ${netAmount.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('fee')}: ${fee.toFixed(2)} ({(INVESTOR_RULES.financial.withdrawalFeeRate * 100).toFixed(1)}%)
            </p>
            <p className="mt-2 text-xs font-medium text-amber-700">
              {t('noticeRequired', { days: WITHDRAWAL_NOTICE_DAYS })}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={buttonDisabled}
          aria-busy={isLocked}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLocked ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {buttonLabel}
            </>
          ) : (
            t('reviewWithdrawal')
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('securityNotice')}
        </p>
      </form>
    </div>
  )
}
