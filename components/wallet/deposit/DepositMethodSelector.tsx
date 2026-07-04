'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PaymentMethodBrand } from '@/components/wallet/PaymentMethodBrand'
import { DEPOSIT_METHOD_OPTIONS, type DepositMethodId } from '@/lib/payments/brands'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const CRYPTO_BADGES = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'DOGE', 'LTC'] as const

type DepositMethodSelectorProps = {
  method: DepositMethodId
  onMethodChange: (method: DepositMethodId) => void
  nowPaymentsEnabled: boolean
  binancePayEnabled: boolean
  disabled?: boolean
}

export function DepositMethodSelector({
  method,
  onMethodChange,
  nowPaymentsEnabled,
  binancePayEnabled,
  disabled = false,
}: DepositMethodSelectorProps) {
  const t = useTranslations('wallet.deposit')

  return (
    <div className={dashboardCardClass}>
      <h2 className={dashboardSectionTitleClass}>{t('methodSectionTitle')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('methodSectionSubtitle')}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {DEPOSIT_METHOD_OPTIONS.map((item) => {
          const selected = method === item.id
          const enabled =
            item.id === 'nowpayments' ? nowPaymentsEnabled : binancePayEnabled
          const label = t(item.labelKey)
          const isCrypto = item.id === 'nowpayments'

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled || !enabled}
              onClick={() => onMethodChange(item.id)}
              className={cn(
                'relative flex min-h-[11rem] flex-col rounded-2xl border p-5 text-left transition-all',
                'min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                selected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                  : 'border-border bg-card hover:border-primary/30',
                (!enabled || disabled) && 'cursor-not-allowed opacity-60'
              )}
            >
              {selected ? (
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : null}

              <PaymentMethodBrand
                src={item.logoSrc}
                alt={label}
                fallbackIcon={item.fallbackIcon}
                className="h-11 w-[8.5rem]"
              />

              <p className="mt-4 text-base font-bold text-foreground">
                {isCrypto ? t('methodCryptoPayment') : t('methodBinancePay')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isCrypto ? t('poweredByNowPayments') : t('poweredByBinancePay')}
              </p>

              {isCrypto ? (
                <>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('supportedAssets')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CRYPTO_BADGES.map((coin) => (
                      <span
                        key={coin}
                        className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground"
                      >
                        {coin}
                      </span>
                    ))}
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {t('andMore')}
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t('binancePayDescription')}
                </p>
              )}

              <span className="mt-auto inline-flex w-fit rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {t(item.etaKey)}
              </span>

              {!enabled ? (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  {isCrypto ? t('nowPaymentsNotConfigured') : t('binancePayNotConfigured')}
                </p>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
