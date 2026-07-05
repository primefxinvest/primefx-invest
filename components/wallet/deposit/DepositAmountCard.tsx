'use client'

import { ArrowDownToLine, Loader2, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

/** Used by DepositModal quick presets — not shown on the deposit page. */
export const QUICK_DEPOSIT_AMOUNTS = [100, 250, 500, 1000, 5000, 10000] as const

type DepositAmountCardProps = {
  amount: string
  onAmountChange: (value: string) => void
  onDeposit: () => void
  isProcessing?: boolean
  processingLabel?: string
  amountError?: string | null
  configError?: string | null
  depositDisabled?: boolean
}

function sanitizeAmountInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length <= 1) return cleaned
  return `${parts[0]}.${parts.slice(1).join('')}`
}

export function DepositAmountCard({
  amount,
  onAmountChange,
  onDeposit,
  isProcessing = false,
  processingLabel,
  amountError,
  configError,
  depositDisabled = false,
}: DepositAmountCardProps) {
  const t = useTranslations('wallet.deposit')
  const buttonDisabled = isProcessing || depositDisabled || !amount.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buttonDisabled) onDeposit()
  }

  return (
    <div className={cn(dashboardCardClass, 'mx-auto w-full max-w-lg shadow-md')}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ArrowDownToLine className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t('cardTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('cardSubtitle')}</p>
        </div>
      </div>

      {configError ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900" role="status">
          {configError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="deposit-amount" className="mb-2 block text-sm font-medium text-foreground">
            {t('amount')}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              $
            </span>
            <input
              id="deposit-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => onAmountChange(sanitizeAmountInput(e.target.value))}
              readOnly={isProcessing}
              placeholder={t('amountPlaceholder')}
              aria-invalid={Boolean(amountError)}
              className={cn(
                'relative min-h-14 w-full rounded-xl border bg-background py-3 pl-8 pr-16 text-2xl font-bold tabular-nums text-foreground transition-colors',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                amountError ? 'border-destructive' : 'border-border',
                isProcessing && 'opacity-60'
              )}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              USD
            </span>
          </div>
          {amountError ? (
            <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
              {amountError}
            </p>
          ) : null}
        </div>

        <div>
          <button
            type="submit"
            disabled={buttonDisabled}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {processingLabel}
              </>
            ) : (
              t('depositNow')
            )}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('redirectNotice')}
          </p>
        </div>
      </form>
    </div>
  )
}
