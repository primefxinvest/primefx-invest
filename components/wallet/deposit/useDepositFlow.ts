'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import {
  buildDepositCurrencyOptions,
  DEFAULT_DEPOSIT_CURRENCY,
  formatCurrencyLabel,
} from '@/lib/payments/currency-options'
import { formatDepositMinimumError } from '@/lib/payments/deposit-limits-client'
import { fetchDepositCurrencyLimits, initiateDeposit } from '@/lib/payments/actions'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'

type UseDepositFlowOptions = {
  initialPaymentOptions: PaymentProviderOptions
}

export type DepositStep = 'idle' | 'creating' | 'redirecting'

export type DepositCurrencyLimitsState = {
  effectiveMinUsd: number
  networkFeeUsd: number
  payCurrency: string
  currencyLabel: string
}

export function useDepositFlow({ initialPaymentOptions }: UseDepositFlowOptions) {
  const t = useTranslations('wallet.deposit')
  const tCompliance = useTranslations('compliance')
  const router = useRouter()
  const kyc = useFinancialKycAccess()
  const submitLockRef = useRef(false)

  const [amount, setAmountState] = useState('500')
  const [step, setStep] = useState<DepositStep>('idle')
  const [flowError, setFlowError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const nowPaymentsEnabled = initialPaymentOptions.nowPaymentsEnabled

  const depositCurrencies = useMemo(
    () =>
      initialPaymentOptions.depositCurrencies.length > 0
        ? initialPaymentOptions.depositCurrencies
        : buildDepositCurrencyOptions().map((item) => ({
            value: item.value,
            label: item.label,
            provider: item.provider,
          })),
    [initialPaymentOptions.depositCurrencies]
  )

  const nowPaymentsCurrencies = useMemo(
    () => depositCurrencies.filter((item) => item.provider === 'now_payments'),
    [depositCurrencies]
  )

  const [currency, setCurrencyState] = useState(() => {
    const firstNow = nowPaymentsCurrencies[0]?.value
    return firstNow ?? DEFAULT_DEPOSIT_CURRENCY
  })

  const [limits, setLimits] = useState<DepositCurrencyLimitsState | null>(null)
  const [limitsLoading, setLimitsLoading] = useState(false)

  useEffect(() => {
    if (!nowPaymentsEnabled) {
      setLimits(null)
      return
    }

    let cancelled = false
    setLimitsLoading(true)

    void fetchDepositCurrencyLimits(currency)
      .then((result) => {
        if (cancelled) return
        setLimits({
          effectiveMinUsd: result.effectiveMinUsd,
          networkFeeUsd: result.networkFeeUsd,
          payCurrency: result.payCurrency,
          currencyLabel: result.currencyLabel,
        })
      })
      .catch(() => {
        if (cancelled) return
        setLimits({
          effectiveMinUsd: INVESTOR_RULES.financial.minimumDeposit,
          networkFeeUsd: 1,
          payCurrency: currency.toLowerCase().replace(/_/g, ''),
          currencyLabel: formatCurrencyLabel(currency),
        })
      })
      .finally(() => {
        if (!cancelled) setLimitsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currency, nowPaymentsEnabled])

  const numericAmount = Number(amount)
  const platformMinDeposit = INVESTOR_RULES.financial.minimumDeposit
  const effectiveMinDeposit = limits?.effectiveMinUsd ?? platformMinDeposit
  const maxDeposit = INVESTOR_RULES.financial.maximumSingleDeposit

  const validateAmount = useCallback((): boolean => {
    if (!Number.isFinite(numericAmount) || numericAmount < effectiveMinDeposit) {
      setAmountError(
        limits
          ? formatDepositMinimumError(currency, effectiveMinDeposit)
          : t('minDepositError')
      )
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
  }, [numericAmount, effectiveMinDeposit, maxDeposit, limits, currency, t])

  const redirectToCheckout = useCallback((url: string) => {
    setStep('redirecting')
    toast.info(t('redirecting'))
    window.location.href = url
  }, [t])

  const handleContinue = useCallback(() => {
    if (submitLockRef.current || pending || step !== 'idle') return

    setFlowError(null)

    if (kyc.loading) {
      return
    }

    if (kyc.fetchError) {
      setFlowError(t('kycFetchError'))
      return
    }

    if (!kyc.verified) {
      const kycMessage =
        kycBlockReason(tCompliance, kyc.status, 'deposit') ??
        kyc.summary ??
        kycFallbackMessage(tCompliance, 'deposit')
      setFlowError(kycMessage)
      showKycRequiredToast({
        status: kyc.status,
        action: 'deposit',
        title: tCompliance('kycToastTitle'),
        description: kycMessage,
      })
      return
    }

    if (!validateAmount()) return

    if (!nowPaymentsEnabled) {
      setFlowError(t('nowPaymentsConfigError'))
      toast.error(t('nowPaymentsConfigError'), { description: t('nowPaymentsConfigHint') })
      return
    }

    submitLockRef.current = true
    setStep('creating')
    toast.info(t('creatingInvoice'))

    startTransition(async () => {
      try {
        const result = await initiateDeposit({
          amountUsd: numericAmount,
          currency,
          provider: 'now_payments',
        })

        if (!result.success) {
          setStep('idle')
          setFlowError(result.error ?? t('depositFailed'))
          toast.error(t('depositFailed'), { description: result.error })
          submitLockRef.current = false
          return
        }

        toast.success(t('paymentCreated'))

        router.refresh()

        if (result.checkoutUrl) {
          redirectToCheckout(result.checkoutUrl)
          return
        }

        setStep('idle')
        setFlowError(t('depositFailed'))
        submitLockRef.current = false
      } catch {
        setStep('idle')
        setFlowError(t('networkError'))
        toast.error(t('networkError'), { description: t('networkErrorHint') })
        submitLockRef.current = false
      }
    })
  }, [
    pending,
    step,
    kyc,
    tCompliance,
    validateAmount,
    nowPaymentsEnabled,
    numericAmount,
    currency,
    t,
    router,
    redirectToCheckout,
  ])

  const handleRetryKyc = useCallback(async () => {
    setFlowError(null)
    const result = await kyc.refresh()
    if (result.fetchError) {
      setFlowError(t('kycFetchError'))
    }
  }, [kyc, t])

  const processingLabel =
    step === 'redirecting'
      ? t('redirecting')
      : step === 'creating'
        ? t('creatingInvoice')
        : t('creatingPayment')

  const depositBlocked =
    kyc.loading ||
    kyc.fetchError ||
    !kyc.verified ||
    !nowPaymentsEnabled ||
    limitsLoading

  return {
    amount,
    setAmount: (value: string) => {
      setAmountState(value)
      setAmountError(null)
      setFlowError(null)
    },
    currency,
    setCurrency: (value: string) => {
      setCurrencyState(value)
      setAmountError(null)
      setFlowError(null)
    },
    currencyOptions: nowPaymentsCurrencies,
    limits,
    limitsLoading,
    step,
    flowError,
    amountError,
    pending: pending || step !== 'idle',
    processingLabel,
    handleContinue,
    handleRetryKyc,
    nowPaymentsEnabled,
    kyc,
    depositBlocked,
  }
}
