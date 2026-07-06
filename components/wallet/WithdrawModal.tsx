'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { initiateWithdrawal } from '@/lib/payments/actions'
import {
  buildWithdrawalCurrencyOptions,
  DEFAULT_WITHDRAW_CURRENCY,
} from '@/lib/payments/currency-options'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { useEmailVerification } from '@/lib/auth/email-verification-context'
import { isEmailNotVerifiedResult } from '@/lib/auth/email-verification-client'

interface WithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const t = useTranslations('wallet.modals.withdraw')
  const tCommon = useTranslations('common')
  const tCompliance = useTranslations('compliance')
  const kyc = useFinancialKycAccess()
  const { requireVerifiedEmail, openVerificationModal } = useEmailVerification()
  const [amount, setAmount] = useState('50')
  const [currency, setCurrency] = useState(DEFAULT_WITHDRAW_CURRENCY)
  const [address, setAddress] = useState('')
  const [currencies, setCurrencies] = useState(() => buildWithdrawalCurrencyOptions())
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()

    fetch('/api/payments/options', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load payment options')
        return response.json() as Promise<PaymentProviderOptions>
      })
      .then((options) => {
        if (options.withdrawalCurrencies.length === 0) return

        setCurrencies(options.withdrawalCurrencies)
        setCurrency((current) =>
          options.withdrawalCurrencies.some((item) => item.value === current)
            ? current
            : options.withdrawalCurrencies[0].value
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

  const handleSubmit = () => {
    if (!requireVerifiedEmail()) return

    if (!kyc.loading && !kyc.verified) {
      showKycRequiredToast({
        status: kyc.status,
        action: 'withdrawal',
        title: tCompliance('kycToastTitle'),
        description:
          kycBlockReason(tCompliance, kyc.status, 'withdrawal') ??
          kyc.summary ??
          kycFallbackMessage(tCompliance, 'withdrawal'),
      })
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(t('invalidAmount'))
      return
    }
    if (!address.trim()) {
      toast.error(t('addressRequired'))
      return
    }

    startTransition(async () => {
      const result = await initiateWithdrawal({
        amountUsd: value,
        currency,
        address: address.trim(),
      })

      if (!result.success) {
        if (isEmailNotVerifiedResult(result)) {
          openVerificationModal()
        }
        toast.error(t('failed'), { description: result.error })
        return
      }

      toast.success(t('submitted'), {
        description: t('submittedDesc'),
      })
      onOpenChange(false)
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            {tCommon('close')}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{t('amountUsd')}</label>
            <input
              type="number"
              min="20"
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
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{t('walletAddress')}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('addressPlaceholder')}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
              disabled={pending}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
