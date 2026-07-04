'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { PAYMENT_PROVIDERS } from '@/lib/payments/config'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import type { DepositMethodId } from '@/lib/payments/brands'
import {
  buildDepositCurrencyOptions,
  DEFAULT_DEPOSIT_CURRENCY,
  formatCurrencyLabel,
} from '@/lib/payments/currency-options'
import { NOW_PAYMENTS_CURRENCIES } from '@/lib/payments/currency-options'
import { initiateDeposit } from '@/lib/wallet/actions'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'

type UseDepositFlowOptions = {
  initialPaymentOptions: PaymentProviderOptions
}

export function useDepositFlow({ initialPaymentOptions }: UseDepositFlowOptions) {
  const t = useTranslations('wallet.deposit')
  const tCompliance = useTranslations('compliance')
  const router = useRouter()
  const kyc = useFinancialKycAccess()
  const submitLockRef = useRef(false)

  const [method, setMethod] = useState<DepositMethodId>('nowpayments')
  const [amount, setAmountState] = useState('500')
  const [step, setStep] = useState<'form' | 'redirecting' | 'address'>('form')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [payAddress, setPayAddress] = useState<string | null>(null)
  const [flowError, setFlowError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const nowPaymentsEnabled = initialPaymentOptions.nowPaymentsEnabled
  const binancePayEnabled = initialPaymentOptions.binancePayEnabled

  const depositCurrencies =
    initialPaymentOptions.depositCurrencies.length > 0
      ? initialPaymentOptions.depositCurrencies
      : buildDepositCurrencyOptions().map((item) => ({
          value: item.value,
          label: item.label,
          provider: item.provider,
        }))

  const filteredCurrencies = useMemo(
    () =>
      depositCurrencies
        .filter((item) =>
          method === 'binancepay' ? item.provider === 'binance_pay' : item.provider === 'now_payments'
        )
        .map((item) => ({ value: item.value, label: item.label })),
    [depositCurrencies, method]
  )

  const [currency, setCurrency] = useState(() => {
    const firstNow = depositCurrencies.find((item) => item.provider === 'now_payments')?.value
    return firstNow ?? DEFAULT_DEPOSIT_CURRENCY
  })

  const numericAmount = Number(amount)
  const minDeposit = INVESTOR_RULES.financial.minimumDeposit
  const maxDeposit = INVESTOR_RULES.financial.maximumSingleDeposit

  const feePercent =
    method === 'binancepay'
      ? PAYMENT_PROVIDERS.binance_pay.depositFeePercent
      : PAYMENT_PROVIDERS.now_payments.depositFeePercent

  const feeEstimate = useMemo(() => {
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0
    return (numericAmount * feePercent) / 100
  }, [numericAmount, feePercent])

  const expectedCredit = useMemo(() => {
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0
    return Math.max(0, numericAmount - feeEstimate)
  }, [numericAmount, feeEstimate])

  const formattedReceive = expectedCredit.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const validateAmount = useCallback((): boolean => {
    if (!Number.isFinite(numericAmount) || numericAmount < minDeposit) {
      setAmountError(t('minDepositError'))
      return false
    }
    if (numericAmount > maxDeposit) {
      setAmountError(
        t('maxDepositError', {
          max: maxDeposit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        })
      )
      return false
    }
    setAmountError(null)
    return true
  }, [numericAmount, minDeposit, maxDeposit, t])

  const handleMethodChange = useCallback(
    (next: DepositMethodId) => {
      setMethod(next)
      setFlowError(null)
      setStep('form')
      const preferredProvider = next === 'binancepay' ? 'binance_pay' : 'now_payments'
      const nextCurrency = depositCurrencies.find((item) => item.provider === preferredProvider)?.value
      if (nextCurrency) setCurrency(nextCurrency)
    },
    [depositCurrencies]
  )

  const redirectToCheckout = useCallback((url: string) => {
    setStep('redirecting')
    window.location.href = url
  }, [])

  const handleContinue = useCallback(() => {
    if (submitLockRef.current || pending) return

    setFlowError(null)

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

    if (!validateAmount()) return

    if (method === 'nowpayments' && !nowPaymentsEnabled) {
      setFlowError(t('nowPaymentsConfigError'))
      toast.error(t('nowPaymentsConfigError'), { description: t('nowPaymentsConfigHint') })
      return
    }

    if (method === 'binancepay' && !binancePayEnabled) {
      setFlowError(t('binancePayConfigError'))
      toast.error(t('binancePayConfigError'), { description: t('binancePayConfigHint') })
      return
    }

    submitLockRef.current = true

    startTransition(async () => {
      try {
        const provider = method === 'binancepay' ? 'binance_pay' : 'now_payments'
        const result = await initiateDeposit({
          amountUsd: numericAmount,
          currency,
          provider,
        })

        if (!result.success) {
          setFlowError(result.error ?? t('depositFailed'))
          toast.error(t('depositFailed'), { description: result.error })
          return
        }

        toast.success(t('paymentCreated'))
        router.refresh()

        if (result.checkoutUrl) {
          redirectToCheckout(result.checkoutUrl)
          return
        }

        if (result.payAddress) {
          setCheckoutUrl(null)
          setPayAddress(result.payAddress)
          setStep('address')
          return
        }

        setFlowError(t('depositFailed'))
      } catch {
        setFlowError(t('networkError'))
        toast.error(t('networkError'), { description: t('networkErrorHint') })
      } finally {
        submitLockRef.current = false
      }
    })
  }, [
    pending,
    kyc,
    tCompliance,
    validateAmount,
    method,
    nowPaymentsEnabled,
    binancePayEnabled,
    numericAmount,
    currency,
    t,
    router,
    redirectToCheckout,
  ])

  const methodLabel =
    method === 'binancepay' ? t('methodBinancePay') : t('methodCryptoPayment')
  const processingTime = method === 'binancepay' ? t('etaInstant') : t('etaCrypto')

  return {
    method,
    setMethod: handleMethodChange,
    amount,
    setAmount: (value: string) => {
      setAmountState(value)
      setAmountError(null)
      setFlowError(null)
    },
    currency,
    setCurrency,
    filteredCurrencies,
    step,
    checkoutUrl,
    payAddress,
    flowError,
    setFlowError,
    amountError,
    pending,
    handleContinue,
    formattedReceive,
    feeEstimate,
    expectedCredit,
    methodLabel,
    processingTime,
    nowPaymentsEnabled,
    binancePayEnabled,
    supportedCryptoCount: NOW_PAYMENTS_CURRENCIES.length,
    currencyLabel: formatCurrencyLabel(currency),
  }
}
