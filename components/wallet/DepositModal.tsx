'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Check, ExternalLink, Loader2, QrCode } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { PaymentMethodBrand } from '@/components/wallet/PaymentMethodBrand'
import { QUICK_DEPOSIT_AMOUNTS } from '@/components/wallet/deposit/DepositAmountCard'
import { initiateDeposit, fetchDepositCurrencyLimits } from '@/lib/payments/actions'
import { formatDepositMinimumError } from '@/lib/payments/deposit-limits-client'
import {
  buildDepositCurrencyOptions,
  DEFAULT_DEPOSIT_CURRENCY,
} from '@/lib/payments/currency-options'
import { DEPOSIT_METHOD_OPTIONS, type DepositMethodId } from '@/lib/payments/brands'
import type { PaymentProviderId, PaymentProviderOptions } from '@/lib/payments/types'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { cn } from '@/lib/utils'

type DepositCurrencyOption = {
  value: string
  label: string
  provider: PaymentProviderId
  currency: string
}

function toDepositSelectOptions(items: PaymentProviderOptions['depositCurrencies']): DepositCurrencyOption[] {
  const valueCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.value] = (acc[item.value] ?? 0) + 1
    return acc
  }, {})

  return items.map((item) => {
    const duplicate = (valueCounts[item.value] ?? 0) > 1
    const value = duplicate ? `${item.provider}:${item.value}` : item.value
    const providerLabel = item.provider === 'binance_pay' ? 'Binance Pay' : 'NOWPayments'

    return {
      value,
      label: duplicate ? `${item.label} · ${providerLabel}` : item.label,
      provider: item.provider,
      currency: item.value,
    }
  })
}

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DepositStep = 'form' | 'ready' | 'redirecting'

export default function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const t = useTranslations('wallet.modals.deposit')
  const tDeposit = useTranslations('wallet.deposit')
  const tCommon = useTranslations('common')
  const tCompliance = useTranslations('compliance')
  const kyc = useFinancialKycAccess()
  const submitLockRef = useRef(false)

  const [method, setMethod] = useState<DepositMethodId>('nowpayments')
  const [amount, setAmount] = useState('100')
  const [currency, setCurrency] = useState(DEFAULT_DEPOSIT_CURRENCY)
  const [depositOptions, setDepositOptions] = useState<DepositCurrencyOption[]>(() =>
    toDepositSelectOptions(buildDepositCurrencyOptions())
  )
  const [step, setStep] = useState<DepositStep>('form')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [checkoutProvider, setCheckoutProvider] = useState<'binance_pay' | 'now_payments' | null>(null)
  const [payAddress, setPayAddress] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState<number | null>(null)
  const [payCurrency, setPayCurrency] = useState<string | null>(null)
  const [qrCodeLink, setQrCodeLink] = useState<string | null>(null)
  const [paymentOpened, setPaymentOpened] = useState(false)
  const [pending, startTransition] = useTransition()
  const [limits, setLimits] = useState<{
    effectiveMinUsd: number
    networkFeeUsd: number
    payCurrency: string
  } | null>(null)
  const [limitsLoading, setLimitsLoading] = useState(false)

  const filteredOptions = useMemo(
    () =>
      depositOptions.filter((item) =>
        method === 'binancepay' ? item.provider === 'binance_pay' : item.provider === 'now_payments'
      ),
    [depositOptions, method]
  )

  const currencies = useMemo(
    () => filteredOptions.map((item) => ({ value: item.value, label: item.label })),
    [filteredOptions]
  )

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()

    fetch('/api/payments/options', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load payment options')
        return response.json() as Promise<PaymentProviderOptions>
      })
      .then((options) => {
        if (options.depositCurrencies.length === 0) return

        const nextOptions = toDepositSelectOptions(options.depositCurrencies)
        setDepositOptions(nextOptions)
        setCurrency((current) => {
          const match = nextOptions.find((item) => item.value === current)
          return match?.value ?? nextOptions[0]?.value ?? DEFAULT_DEPOSIT_CURRENCY
        })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        toast.error(t('refreshCurrenciesError'), { description: t('refreshCurrenciesHint') })
      })

    return () => controller.abort()
  }, [open, t])

  useEffect(() => {
    const preferred = filteredOptions[0]?.value
    if (preferred && !filteredOptions.some((item) => item.value === currency)) {
      setCurrency(preferred)
    }
  }, [filteredOptions, currency])

  const selectedCurrencyOption = useMemo(
    () =>
      filteredOptions.find((item) => item.value === currency) ??
      depositOptions.find((item) => item.value === currency),
    [filteredOptions, depositOptions, currency]
  )

  const depositCurrencyCode = selectedCurrencyOption?.currency ?? currency

  useEffect(() => {
    if (!open || method !== 'nowpayments') {
      setLimits(null)
      return
    }

    let cancelled = false
    setLimitsLoading(true)

    void fetchDepositCurrencyLimits(depositCurrencyCode)
      .then((result) => {
        if (cancelled) return
        setLimits({
          effectiveMinUsd: result.effectiveMinUsd,
          networkFeeUsd: result.networkFeeUsd,
          payCurrency: result.payCurrency,
        })
      })
      .catch(() => {
        if (cancelled) return
        setLimits({
          effectiveMinUsd: INVESTOR_RULES.financial.minimumDeposit,
          networkFeeUsd: 1,
          payCurrency: depositCurrencyCode.toLowerCase().replace(/_/g, ''),
        })
      })
      .finally(() => {
        if (!cancelled) setLimitsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, method, depositCurrencyCode])

  const effectiveMinDeposit =
    method === 'nowpayments' && limits
      ? limits.effectiveMinUsd
      : INVESTOR_RULES.financial.minimumDeposit

  const resetState = () => {
    setStep('form')
    setCheckoutUrl(null)
    setCheckoutProvider(null)
    setPayAddress(null)
    setPayAmount(null)
    setPayCurrency(null)
    setQrCodeLink(null)
    setPaymentOpened(false)
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  const handleCreatePayment = () => {
    if (submitLockRef.current || pending) return

    if (!kyc.loading && !kyc.verified) {
      showKycRequiredToast({
        status: kyc.status,
        action: 'deposit',
        title: tCompliance('kycToastTitle'),
        description:
          kycBlockReason(tCompliance, kyc.status, 'deposit') ??
          kyc.summary ??
          kycFallbackMessage(tCompliance, 'deposit'),
      })
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value < effectiveMinDeposit) {
      toast.error(
        method === 'nowpayments' && limits
          ? formatDepositMinimumError(depositCurrencyCode, effectiveMinDeposit)
          : tDeposit('minDepositError')
      )
      return
    }

    submitLockRef.current = true

    startTransition(async () => {
      try {
        const selected = selectedCurrencyOption

        const provider: PaymentProviderId | undefined =
          method === 'binancepay' ? 'binance_pay' : 'now_payments'

        const result = await initiateDeposit({
          amountUsd: value,
          currency: selected?.currency ?? depositCurrencyCode,
          provider: selected?.provider ?? provider,
        })

        if (!result.success) {
          toast.error(t('failed'), { description: result.error })
          return
        }

        const url = result.checkoutUrl ?? null
        setCheckoutUrl(url)
        setCheckoutProvider(result.provider ?? null)
        setQrCodeLink(result.qrCodeLink ?? null)
        setPayAddress(result.payAddress ?? null)
        setPayAmount(result.payAmount ?? null)
        setPayCurrency(result.payCurrency ?? null)

        if (url) {
          toast.success(t('paymentCreated'), { description: t('paymentCreatedDesc') })
          setStep('redirecting')
          window.location.href = url
          return
        }

        if (result.payAddress) {
          setStep('ready')
          toast.success(t('addressReady'), { description: t('addressReadyDesc') })
          return
        }

        toast.success(t('depositInitiated'))
      } catch {
        toast.error(tDeposit('networkError'), { description: tDeposit('networkErrorHint') })
      } finally {
        submitLockRef.current = false
      }
    })
  }

  const handleConfirmAndOpen = () => {
    if (!checkoutUrl) return
    window.location.href = checkoutUrl
    setPaymentOpened(true)
  }

  const providerLabel = checkoutProvider === 'binance_pay' ? 'Binance Pay' : 'NOWPayments'
  const openButtonLabel =
    checkoutProvider === 'binance_pay' ? t('openBinanceCheckout') : t('openPaymentCheckout')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:max-w-lg sm:rounded-xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 'form' ? tDeposit('methodSectionSubtitle') : t('subtitleReady')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            {tCommon('close')}
          </button>
        </div>

        <div className="space-y-4">
          {step === 'form' || step === 'redirecting' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {DEPOSIT_METHOD_OPTIONS.map((item) => {
                  const selected = method === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id)}
                      className={cn(
                        'relative rounded-xl border p-3 text-left transition-all',
                        selected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                      )}
                    >
                      {selected ? (
                        <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                      ) : null}
                      <PaymentMethodBrand
                        src={item.logoSrc}
                        alt={tDeposit(item.labelKey)}
                        fallbackIcon={item.fallbackIcon}
                        className="h-8 w-[6.5rem]"
                      />
                      <p className="mt-2 text-xs font-semibold text-foreground">
                        {item.id === 'nowpayments'
                          ? tDeposit('methodCryptoPayment')
                          : tDeposit('methodBinancePay')}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('amountUsd')}
                </label>
                <input
                  type="number"
                  min={INVESTOR_RULES.financial.minimumDeposit}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={pending}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_DEPOSIT_AMOUNTS.slice(0, 4).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className="min-h-11 rounded-lg border border-border px-3 text-xs font-semibold hover:border-primary/40"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t('currency')}</label>
                <CustomSelect
                  value={currency}
                  onValueChange={setCurrency}
                  options={currencies}
                  placeholder={t('selectCurrency')}
                  disabled={pending || currencies.length === 0 || limitsLoading}
                />
              </div>

              {method === 'nowpayments' ? (
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{tDeposit('limitsMinLabel')}</dt>
                      <dd className="font-semibold tabular-nums text-foreground">
                        {limitsLoading || !limits
                          ? tDeposit('loadingLimits')
                          : limits.effectiveMinUsd.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            })}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{tDeposit('summaryNetworkFee')}</dt>
                      <dd className="font-semibold tabular-nums text-foreground">
                        {limitsLoading || !limits
                          ? '—'
                          : limits.networkFeeUsd.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            })}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{tDeposit('payCurrencyLabel')}</dt>
                      <dd className="font-mono text-xs font-semibold uppercase text-foreground">
                        {limitsLoading || !limits ? '—' : limits.payCurrency}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCreatePayment}
                disabled={pending || (method === 'nowpayments' && limitsLoading)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {pending || step === 'redirecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {step === 'redirecting' ? tDeposit('redirecting') : t('creatingPayment')}
                  </>
                ) : (
                  t('continueToPayment')
                )}
              </button>
            </>
          ) : (
            <>
              {checkoutUrl ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-semibold text-foreground">
                    {checkoutProvider === 'binance_pay'
                      ? t('binanceCheckoutReady')
                      : t('cryptoInvoiceReady')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paymentOpened
                      ? t('completeInTab', { provider: providerLabel })
                      : checkoutProvider === 'binance_pay'
                        ? t('confirmBinance')
                        : t('confirmNowPayments')}
                  </p>
                  {qrCodeLink ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <QrCode className="h-4 w-4" />
                      {t('qrAvailable')}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {payAddress ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">{t('sendCryptoTo')}</p>
                  <p className="mt-2 break-all font-mono text-xs">{payAddress}</p>
                  {payAmount != null && payCurrency ? (
                    <p className="mt-2 text-xs">
                      {t('amountLabel')}{' '}
                      <span className="font-semibold">{payAmount}</span> {payCurrency.toUpperCase()}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {checkoutUrl ? (
                <button
                  type="button"
                  onClick={handleConfirmAndOpen}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  {paymentOpened ? t('openAgain', { provider: providerLabel }) : openButtonLabel}
                </button>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetState}
                  className="min-h-11 flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {t('newDeposit')}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="min-h-11 flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {tCommon('done')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
