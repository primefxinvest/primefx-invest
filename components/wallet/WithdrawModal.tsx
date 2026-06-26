'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { getPaymentProviderOptions, initiateWithdrawal } from '@/lib/payments/actions'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { getKycBlockReason } from '@/lib/investor/kyc'

interface WithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const kyc = useFinancialKycAccess()
  const [amount, setAmount] = useState('50')
  const [currency, setCurrency] = useState('USDT_TRC20')
  const [address, setAddress] = useState('')
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return

    getPaymentProviderOptions().then((options) => {
      setCurrencies(options.withdrawalCurrencies)
      if (options.withdrawalCurrencies[0]) {
        setCurrency(options.withdrawalCurrencies[0].value)
      }
    })
  }, [open])

  const handleSubmit = () => {
    if (!kyc.loading && !kyc.verified) {
      toast.error('KYC verification required', {
        description:
          getKycBlockReason(kyc.status, 'withdrawal') ??
          kyc.summary ??
          'Complete KYC before withdrawing funds.',
      })
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid withdrawal amount.')
      return
    }
    if (!address.trim()) {
      toast.error('Enter your wallet address.')
      return
    }

    startTransition(async () => {
      const result = await initiateWithdrawal({
        amountUsd: value,
        currency,
        address: address.trim(),
      })

      if (!result.success) {
        toast.error('Withdrawal failed', { description: result.error })
        return
      }

      toast.success('Withdrawal submitted', {
        description: 'Your payout is being processed by NOWPayments.',
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
            <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
            <p className="mt-1 text-sm text-gray-500">
              Crypto withdrawals are processed via NOWPayments mass payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Amount (USD)</label>
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
            <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>
            <CustomSelect
              value={currency}
              onValueChange={setCurrency}
              options={currencies}
              placeholder="Select currency"
              disabled={pending || currencies.length === 0}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Wallet address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Paste your crypto wallet address"
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
                Submitting withdrawal...
              </>
            ) : (
              'Submit Withdrawal'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
