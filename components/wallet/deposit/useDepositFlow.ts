'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import {
  buildDepositCurrencyOptions,
  DEFAULT_DEPOSIT_CURRENCY,
} from '@/lib/payments/currency-options'
import { initiateDeposit } from '@/lib/wallet/actions'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'

type UseDepositFlowOptions = {
  initialPaymentOptions: PaymentProviderOptions
}

export type DepositStep = 'idle' | 'creating' | 'redirecting'

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

  const currency = useMemo(() => {
    const firstNow = depositCurrencies.find((item) => item.provider === 'now_payments')?.value
    return firstNow ?? DEFAULT_DEPOSIT_CURRENCY
  }, [depositCurrencies])

  const numericAmount = Number(amount)
  const minDeposit = INVESTOR_RULES.financial.minimumDeposit
  const maxDeposit = INVESTOR_RULES.financial.maximumSingleDeposit

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

        console.log('NOWPayments Response:', result)

        if (!result.success) {
          setStep('idle')
          setFlowError(result.error ?? t('depositFailed'))
          toast.error(t('depositFailed'), { description: result.error })
          submitLockRef.current = false
          return
        }

        const invoiceId = result.paymentId ?? result.orderId
        console.log('Invoice Created:', invoiceId)

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
    !nowPaymentsEnabled

  return {
    amount,
    setAmount: (value: string) => {
      setAmountState(value)
      setAmountError(null)
      setFlowError(null)
    },
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
