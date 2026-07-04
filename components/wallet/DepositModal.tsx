'use client'

import { useEffect, useState, useTransition } from 'react'
import { ExternalLink, Loader2, QrCode } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { initiateDeposit } from '@/lib/payments/actions'
import {
  buildDepositCurrencyOptions,
  DEFAULT_DEPOSIT_CURRENCY,
} from '@/lib/payments/currency-options'
import type { PaymentProviderId, PaymentProviderOptions } from '@/lib/payments/types'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'

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

type DepositStep = 'form' | 'ready'
export default function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const t = useTranslations('wallet.modals.deposit')
  const tCommon = useTranslations('common')
  const tCompliance = useTranslations('compliance')
  const kyc = useFinancialKycAccess()
  const [amount, setAmount] = useState('100')
  const [currency, setCurrency] = useState(DEFAULT_DEPOSIT_CURRENCY)
  const [depositOptions, setDepositOptions] = useState<DepositCurrencyOption[]>(() =>
    toDepositSelectOptions(buildDepositCurrencyOptions())
  )
  const [currencies, setCurrencies] = useState(() =>
    toDepositSelectOptions(buildDepositCurrencyOptions()).map((item) => ({
      value: item.value,
      label: item.label,
    }))
  )
  const [step, setStep] = useState<DepositStep>('form')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [checkoutProvider, setCheckoutProvider] = useState<'binance_pay' | 'now_payments' | null>(
    null
  )
  const [payAddress, setPayAddress] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState<number | null>(null)
  const [payCurrency, setPayCurrency] = useState<string | null>(null)
  const [qrCodeLink, setQrCodeLink] = useState<string | null>(null)
  const [paymentOpened, setPaymentOpened] = useState(false)
  const [pending, startTransition] = useTransition()

  const openPaymentTab = (url: string) => {
    const tab = window.open(url, '_blank', 'noopener,noreferrer')
    if (!tab) {
      toast.error(t('popupBlocked'), {
        description: t('popupBlockedHint'),
      })
      return false
    }
    tab.focus()
    return true
  }

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
        setCurrencies(nextOptions.map((item) => ({ value: item.value, label: item.label })))
        setCurrency((current) =>
          nextOptions.some((item) => item.value === current)
            ? current
            : nextOptions[0]?.value ?? DEFAULT_DEPOSIT_CURRENCY
        )
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        toast.error(t('refreshCurrenciesError'), {
          description: t('refreshCurrenciesHint'),
        })
      })

    return () => controller.abort()
  }, [open, t])

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
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(t('invalidAmount'))
      return
    }

    startTransition(async () => {
      const selected =
        depositOptions.find((item) => item.value === currency) ??
        depositOptions.find((item) => item.currency === currency)

      const result = await initiateDeposit({
        amountUsd: value,
        currency: selected?.currency ?? currency,
        provider: selected?.provider,
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
        setStep('ready')
        toast.success(t('paymentCreated'), {
          description: t('paymentCreatedDesc'),
        })
        return
      }

      if (result.payAddress) {
        setStep('ready')
        toast.success(t('addressReady'), {
          description: t('addressReadyDesc'),
        })
        return
      }

      toast.success(t('depositInitiated'))
    })
  }

  const handleConfirmAndOpen = () => {
    if (!checkoutUrl) return
    const opened = openPaymentTab(checkoutUrl)
    if (opened) {
      setPaymentOpened(true)
      toast.success(t('paymentPageOpened'), {
        description: t('paymentPageOpenedDesc'),
      })
    }
  }

  const providerLabel =
    checkoutProvider === 'binance_pay' ? 'Binance Pay' : 'NOWPayments'

  const openButtonLabel =
    checkoutProvider === 'binance_pay' ? t('openBinanceCheckout') : t('openPaymentCheckout')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {step === 'form' ? t('subtitleForm') : t('subtitleReady')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            {tCommon('close')}
          </button>
        </div>

        <div className="space-y-4">
          {step === 'form' ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('amountUsd')}
                </label>
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                  disabled={pending}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('currency')}</label>
                <CustomSelect
                  value={currency}
                  onValueChange={setCurrency}
                  options={currencies}
                  placeholder={t('selectCurrency')}
                  disabled={pending || currencies.length === 0}
                />
                <p className="mt-1.5 text-xs text-gray-500">{t('currencyHint')}</p>
              </div>

              <button
                type="button"
                onClick={handleCreatePayment}
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0052ff] py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('creatingPayment')}
                  </>
                ) : (
                  t('continueToPayment')
                )}
              </button>
            </>
          ) : (
            <>
              {checkoutUrl ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">
                    {checkoutProvider === 'binance_pay'
                      ? t('binanceCheckoutReady')
                      : t('cryptoInvoiceReady')}
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    {paymentOpened
                      ? t('completeInTab', { provider: providerLabel })
                      : checkoutProvider === 'binance_pay'
                        ? t('confirmBinance')
                        : t('confirmNowPayments')}
                  </p>
                  {qrCodeLink ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-blue-800">
                      <QrCode className="h-4 w-4" />
                      {t('qrAvailable')}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {payAddress ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">{t('sendCryptoTo')}</p>
                  <p className="mt-2 break-all font-mono text-xs">{payAddress}</p>
                  {payAmount != null && payCurrency ? (
                    <p className="mt-2 text-xs">
                      {t('amountLabel')}{' '}
                      <span className="font-semibold">{payAmount}</span>{' '}
                      {payCurrency.toUpperCase()}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {checkoutUrl ? (
                <button
                  type="button"
                  onClick={handleConfirmAndOpen}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0052ff] py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  {paymentOpened
                    ? t('openAgain', { provider: providerLabel })
                    : t('confirmOpen', { action: openButtonLabel })}
                </button>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetState}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('newDeposit')}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
