'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Banknote,
  Bitcoin,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import {
  WalletHelpPanel,
  WalletLimitsPanel,
  WalletRecentPanel,
  WalletSecurityNotice,
} from '@/components/wallet/layout/WalletSidePanels'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { getPaymentProviderOptions } from '@/lib/payments/actions'
import { initiateWithdrawal, submitManualWithdrawal } from '@/lib/wallet/actions'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { cn } from '@/lib/utils'

const METHOD_CURRENCY: Partial<Record<(typeof WITHDRAW_METHODS)[number]['id'], string>> = {
  usdt_trc20: 'USDT_TRC20',
  usdt_erc20: 'USDT_ERC20',
}

const WITHDRAW_METHODS = [
  { id: 'bank', label: 'Bank Transfer', icon: Banknote, eta: '1-3 business days' },
  { id: 'usdt_trc20', label: 'USDT (TRC20)', icon: Wallet, eta: '~5 mins' },
  { id: 'usdt_erc20', label: 'USDT (ERC20)', icon: Wallet, eta: '~10 mins' },
  { id: 'crypto', label: 'Crypto Wallet', icon: Bitcoin, eta: '~5-30 mins' },
  { id: 'card', label: 'PrimeFx Card', icon: CreditCard, eta: 'Instant' },
] as const

const FEE_RATE = 0.01
const MIN_FEE = 1

export function WithdrawPageView() {
  const router = useRouter()
  const kyc = useFinancialKycAccess()
  const {
    wallet,
    transactions,
    walletLoading,
    walletError,
    reloadWallet,
    transactionsLoading,
    transactionsError,
    reloadTransactions,
  } = useWalletPageData()
  const [method, setMethod] = useState<(typeof WITHDRAW_METHODS)[number]['id']>('bank')
  const [amount, setAmount] = useState('500')
  const [currency, setCurrency] = useState('USDT_TRC20')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [twoFa, setTwoFa] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getPaymentProviderOptions().then((options) => {
      setCurrencies(options.withdrawalCurrencies)
      if (options.withdrawalCurrencies[0]) setCurrency(options.withdrawalCurrencies[0].value)
    })
  }, [])

  const available = useMemo(() => {
    const match = wallet?.availableBalance?.replace(/[^0-9.-]/g, '')
    return Number(match) || 0
  }, [wallet?.availableBalance])

  const amountNum = Number(amount) || 0
  const fee = Math.max(MIN_FEE, amountNum * FEE_RATE)
  const receive = Math.max(0, amountNum - fee)

  const recentWithdrawals = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'Withdrawal')
        .slice(0, 5)
        .map((tx) => ({
          id: tx.id,
          label: tx.type,
          sublabel: tx.referenceId,
          amount: tx.amount,
          status: tx.status,
          time: `${tx.date}${tx.time ? ` · ${tx.time}` : ''}`,
          positive: false,
        })),
    [transactions]
  )

  const pendingWithdrawals = transactions.filter(
    (tx) => tx.type === 'Withdrawal' && tx.status.toLowerCase() === 'pending'
  )

  const totalWithdrawn = transactions
    .filter((tx) => tx.type === 'Withdrawal' && tx.status.toLowerCase() === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0)

  useEffect(() => {
    const mapped = METHOD_CURRENCY[method]
    if (mapped) setCurrency(mapped)
  }, [method])

  const minWithdrawal = INVESTOR_RULES.financial.minimumWithdrawal

  const handleSubmit = () => {
    if (!kyc.loading && !kyc.verified) {
      showKycRequiredToast({
        status: kyc.status,
        action: 'withdrawal',
        fallback: kyc.summary ?? 'Complete KYC before withdrawing funds.',
      })
      return
    }

    if (amountNum < minWithdrawal) {
      toast.error(`Minimum withdrawal is $${minWithdrawal.toFixed(2)}`)
      return
    }
    if (amountNum > available) {
      toast.error('Amount exceeds available balance')
      return
    }
    if (method !== 'bank' && method !== 'card' && !address.trim()) {
      toast.error('Enter your payout wallet address')
      return
    }

    const methodLabels: Record<(typeof WITHDRAW_METHODS)[number]['id'], string> = {
      bank: 'Bank transfer',
      usdt_trc20: 'USDT (TRC20)',
      usdt_erc20: 'USDT (ERC20)',
      crypto: 'Crypto wallet',
      card: 'PrimeFx Card',
    }

    if (method === 'bank' || method === 'card') {
      startTransition(async () => {
        const result = await submitManualWithdrawal({
          amountUsd: amountNum,
          methodLabel: methodLabels[method],
          note,
        })
        if (!result.success) {
          toast.error('Withdrawal failed', { description: result.error })
          return
        }
        toast.success('Withdrawal submitted', {
          description: `Reference ${result.referenceId}. Processing may take 1-3 business days.`,
        })
        setAmount('')
        setNote('')
        router.refresh()
      })
      return
    }

    startTransition(async () => {
      const payoutCurrency = METHOD_CURRENCY[method] ?? currency
      const result = await initiateWithdrawal({
        amountUsd: amountNum,
        currency: payoutCurrency,
        address: address.trim(),
      })
      if (!result.success) {
        toast.error('Withdrawal failed', { description: result.error })
        return
      }
      toast.success('Withdrawal submitted', {
        description: 'Your payout is being processed.',
      })
      setAmount('')
      setAddress('')
      setNote('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <WalletPageHeader
        title="Withdrawal"
        description="Withdraw your funds securely to your preferred method"
      />

      <KycFinancialBanner />

      <AsyncState
        loading={walletLoading && !wallet}
        error={walletError}
        onRetry={reloadWallet}
        errorTitle="Could not load wallet"
        skeleton={<MetricCardsSkeleton count={4} />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WalletStatCard
            label="Available Balance"
            value={wallet?.availableBalance ?? '$0.00'}
            subtext="USD Wallet"
            icon={Wallet}
          />
          <WalletStatCard
            label="Withdrawable Balance"
            value={`$${Math.max(0, available - fee).toFixed(2)}`}
            subtext="After fees"
            icon={Banknote}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label="Pending Withdrawal"
            value={`$${pendingWithdrawals.reduce((s, t) => s + Math.abs(t.amountValue), 0).toFixed(2)}`}
            subtext={`${pendingWithdrawals.length} request${pendingWithdrawals.length === 1 ? '' : 's'}`}
            icon={Loader2}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            label="Total Withdrawn"
            value={`$${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext="All time"
            icon={ArrowRight}
            iconClassName="bg-orange-50 text-orange-600"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">1. Select withdrawal method</h2>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {WITHDRAW_METHODS.map((item) => {
                const Icon = item.icon
                const selected = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={cn(
                      'min-w-[140px] shrink-0 rounded-xl border p-4 text-left',
                      selected ? 'border-[#0052ff] bg-blue-50/40' : 'border-gray-200'
                    )}
                  >
                    <Icon className="h-5 w-5 text-[#0052ff]" />
                    <p className="mt-2 text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.eta}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">2. Withdrawal details</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                {method === 'bank' ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Bank account</label>
                    <CustomSelect
                      value="gtbank"
                      onValueChange={() => {}}
                      options={[{ value: 'gtbank', label: 'GT Bank •••• 5678' }]}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>
                    <CustomSelect
                      value={currency}
                      onValueChange={setCurrency}
                      options={currencies}
                      disabled={pending}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Amount (USD)</label>
                  <input
                    type="number"
                    min="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                    disabled={pending}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Min: ${minWithdrawal.toFixed(2)} · Max: $5,000.00 · Available: ${available.toFixed(2)}
                  </p>
                </div>
                {method !== 'bank' && method !== 'card' ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Wallet address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter payout address"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                      disabled={pending}
                    />
                  </div>
                ) : null}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={100}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{note.length}/100</p>
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 p-5">
                <p className="text-sm text-gray-600">You will receive</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">${receive.toFixed(2)}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Fee: ${fee.toFixed(2)} ({(FEE_RATE * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">3. Security verification</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Withdrawal PIN <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm"
                    placeholder="••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">2FA code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={twoFa}
                    onChange={(e) => setTwoFa(e.target.value)}
                    maxLength={6}
                    placeholder="6 digit code"
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Get Code
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <WalletSecurityNotice>
                For your security, withdrawals above $1,000 require email confirmation.
              </WalletSecurityNotice>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Review Withdrawal
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <WalletLimitsPanel
            rules={[
              { label: 'Min withdrawal', value: '$10.00' },
              { label: 'Max per transaction', value: '$10,000.00' },
              { label: 'Withdrawal fee', value: '1% (Min $1.00)' },
            ]}
          />
          <WalletRecentPanel
            title="Recent withdrawals"
            items={recentWithdrawals}
            loading={transactionsLoading && !transactions.length}
            error={transactionsError}
            onRetry={reloadTransactions}
            emptyTitle="No withdrawals yet"
            emptyDescription="Withdrawal requests will show up here once you cash out."
          />
          <WalletHelpPanel />
        </div>
      </div>
    </div>
  )
}
