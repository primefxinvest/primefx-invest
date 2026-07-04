'use client'

import { useTranslations } from 'next-intl'
import { CustomSelect } from '@/components/ui/custom-select'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { cn } from '@/lib/utils'

export const QUICK_DEPOSIT_AMOUNTS = [50, 100, 250, 500, 1000, 5000] as const

type DepositAmountCardProps = {
  amount: string
  onAmountChange: (value: string) => void
  currency: string
  onCurrencyChange: (value: string) => void
  currencyOptions: { value: string; label: string }[]
  formattedReceive: string
  disabled?: boolean
  amountError?: string | null
}

function formatUsdInput(value: string): string {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return '$0.00'
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function DepositAmountCard({
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  currencyOptions,
  formattedReceive,
  disabled = false,
  amountError,
}: DepositAmountCardProps) {
  const t = useTranslations('wallet.deposit')
  const min = INVESTOR_RULES.financial.minimumDeposit
  const max = INVESTOR_RULES.financial.maximumSingleDeposit

  return (
    <div className={dashboardCardClass}>
      <h2 className={dashboardSectionTitleClass}>{t('amountSectionTitle')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('amountSectionSubtitle')}</p>

      <div className="mt-5 space-y-5">
        <div>
          <label htmlFor="deposit-amount" className="mb-2 block text-sm font-medium text-foreground">
            {t('amount')}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              $
            </span>
            <input
              id="deposit-amount"
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step="0.01"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              disabled={disabled}
              aria-invalid={Boolean(amountError)}
              className={cn(
                'min-h-11 w-full rounded-xl border bg-background py-3 pl-8 pr-4 text-lg font-semibold tabular-nums text-foreground transition-colors',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                amountError ? 'border-destructive' : 'border-border',
                disabled && 'opacity-60'
              )}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t('amountLimitsDynamic', {
              min: min.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
              max: max.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            })}
          </p>
          {amountError ? (
            <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
              {amountError}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {t('formattedPreview', { value: formatUsdInput(amount) })}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">{t('quickAmounts')}</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_DEPOSIT_AMOUNTS.map((preset) => {
              const selected = Number(amount) === preset
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAmountChange(String(preset))}
                  className={cn(
                    'inline-flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors',
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-foreground hover:border-primary/40 hover:bg-primary/5',
                    disabled && 'pointer-events-none opacity-60'
                  )}
                >
                  ${preset.toLocaleString()}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t('cryptoCurrency')}
          </label>
          <CustomSelect
            value={currency}
            onValueChange={onCurrencyChange}
            options={currencyOptions}
            placeholder={t('selectCurrency')}
            disabled={disabled || currencyOptions.length === 0}
          />
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">{t('youWillReceive')}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {formattedReceive}
          </p>
        </div>
      </div>
    </div>
  )
}
