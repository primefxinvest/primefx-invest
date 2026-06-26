'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import { getPlanTheme } from '@/lib/invest/plan-config'
import { cn } from '@/lib/utils'
import { processInvestment } from '@/lib/invest/actions'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { getKycBlockReason } from '@/lib/investor/kyc'

import { fetchWalletData } from '@/lib/data/queries'
import { formatCurrency } from '@/lib/data/format'

interface InvestModalProps {
  plan: InvestmentPlan | null
  open: boolean
  onClose: () => void
  onSuccess: (plan: InvestmentPlan, amount: number) => void
}

export default function InvestModal({ plan, open, onClose, onSuccess }: InvestModalProps) {
  const router = useRouter()
  const kyc = useFinancialKycAccess()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletLoading, setWalletLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setWalletLoading(true)
      fetchWalletData()
        .then((wallet) => {
          const available = wallet.balanceBreakdown.find((b) => b.label === 'Available Balance')
          setWalletBalance(available?.value ?? 0)
        })
        .finally(() => setWalletLoading(false))
    }
    if (open && plan) {
      setAmount(String(plan.minAmount))
    }
  }, [open, plan])

  if (!open || !plan) return null

  const theme = getPlanTheme(plan)
  const numericAmount = Number(amount.replace(/,/g, ''))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!kyc.loading && !kyc.verified) {
      toast.error('KYC verification required', {
        description:
          getKycBlockReason(kyc.status, 'investment') ??
          kyc.summary ??
          'Complete KYC before investing.',
      })
      return
    }

    if (!numericAmount || Number.isNaN(numericAmount)) {
      toast.error('Enter a valid investment amount.')
      return
    }

    if (numericAmount < plan.minAmount) {
      toast.error(`Minimum investment for ${plan.name} is ${plan.minInvestment}.`)
      return
    }

    if (numericAmount > walletBalance) {
      toast.error('Insufficient wallet balance. Please deposit funds first.')
      return
    }

    setLoading(true)

    const result = await processInvestment({
      planId: plan.id,
      planName: plan.name,
      amount: numericAmount,
    })

    setLoading(false)

    if (!result.success) {
      toast.error(result.error ?? 'Investment failed. Please try again.')
      return
    }

    router.refresh()
    onSuccess(plan, numericAmount)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900">Invest in {plan.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {plan.weeklyRoi} weekly return · Min {plan.minInvestment}
        </p>

        {!kyc.loading && !kyc.verified ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {getKycBlockReason(kyc.status, 'investment') ?? kyc.summary}
          </div>
        ) : null}

        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">Available Wallet Balance</p>
          <p className="text-lg font-bold text-gray-900">
            {walletLoading ? 'Loading...' : formatCurrency(walletBalance)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="invest-amount" className="mb-2 block text-sm font-medium text-gray-700">
              Investment Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                id="invest-amount"
                type="number"
                min={plan.minAmount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-7 pr-4 text-gray-900 outline-none focus:border-[#0052ff] focus:ring-2 focus:ring-[#0052ff]/20"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {[plan.minAmount, plan.minAmount * 2, plan.minAmount * 5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#0052ff] hover:text-[#0052ff]"
              >
                ${preset.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || (!kyc.loading && !kyc.verified)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60',
              theme.button
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Investment'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
