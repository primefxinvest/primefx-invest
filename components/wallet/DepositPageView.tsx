'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Banknote,
  Bitcoin,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import { WalletStepIndicator } from '@/components/wallet/layout/WalletStepIndicator'
import {
  WalletHelpPanel,
  WalletLimitsPanel,
  WalletRecentPanel,
  WalletSecurityNotice,
  walletDepositCta,
} from '@/components/wallet/layout/WalletSidePanels'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { getPaymentProviderOptions } from '@/lib/payments/actions'
import { initiateDeposit, submitBankDeposit } from '@/lib/wallet/actions'
import { cn } from '@/lib/utils'

const DEPOSIT_METHODS = [
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: Banknote,
    eta: '1-3 business days',
    badge: 'Recommended',
  },
  { id: 'usdt_trc20', label: 'USDT (TRC20)', icon: Wallet, eta: '~5 mins', badge: 'Low Fee' },
  { id: 'usdt_erc20', label: 'USDT (ERC20)', icon: Wallet, eta: '~10 mins', badge: 'Medium Fee' },
  { id: 'btc', label: 'Bitcoin (BTC)', icon: Bitcoin, eta: '~10-30 mins', badge: 'Network Fee' },
  { id: 'card', label: 'PrimeFx Card', icon: CreditCard, eta: 'Instant', badge: 'No Fee' },
] as const

const BANK_DETAILS = {
  bankName: 'GT Bank',
  accountName: 'PrimeFx Invest Ltd',
  accountNumber: '1234567890',
  routingNumber: '057103739',
  swift: 'GTBIRWRW',
  reference: 'PFXD20240526001',
}

function cryptoCurrencyForMethod(method: (typeof DEPOSIT_METHODS)[number]['id']) {
  if (method === 'usdt_trc20') return 'USDT_TRC20'
  if (method === 'usdt_erc20') return 'USDT_ERC20'
  if (method === 'btc') return 'BTC'
  return 'USDT'
}

export function DepositPageView() {
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
  const [method, setMethod] = useState<(typeof DEPOSIT_METHODS)[number]['id']>('bank')
  const [amount, setAmount] = useState('500')
  const [currency, setCurrency] = useState('USDT')
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([])
  const [note, setNote] = useState('')
  const [step, setStep] = useState<'form' | 'ready'>('form')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [payAddress, setPayAddress] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getPaymentProviderOptions().then((options) => {
      setCurrencies(options.depositCurrencies.map((item) => ({ value: item.value, label: item.label })))
      if (options.depositCurrencies[0]) setCurrency(options.depositCurrencies[0].value)
    })
  }, [])

  const recentDeposits = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'Deposit')
        .slice(0, 4)
        .map((tx) => ({
          id: tx.id,
          label: tx.type,
          sublabel: tx.referenceId,
          amount: tx.amount,
          status: tx.status,
          time: `${tx.date}${tx.time ? ` · ${tx.time}` : ''}`,
          positive: tx.isCredit,
        })),
    [transactions]
  )

  const monthDeposits = useMemo(() => {
    const deposits = transactions.filter((tx) => tx.type === 'Deposit' && tx.isCredit)
    return {
      total: deposits.reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0),
      count: deposits.length,
    }
  }, [transactions])

  const pendingDeposits = transactions.filter(
    (tx) => tx.type === 'Deposit' && tx.status.toLowerCase() === 'pending'
  )

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`)
    }
  }

  useEffect(() => {
    if (method === 'bank' || method === 'card') return
    setCurrency(cryptoCurrencyForMethod(method))
  }, [method])

  const handleDeposit = () => {
    if (!kyc.loading && !kyc.verified) {
      showKycRequiredToast({
        status: kyc.status,
        action: 'deposit',
        fallback: kyc.summary ?? 'Complete KYC before making a deposit.',
      })
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value < 10) {
      toast.error('Minimum deposit is $10.00')
      return
    }

    if (method === 'bank') {
      startTransition(async () => {
        const result = await submitBankDeposit({ amountUsd: value, note })
        if (!result.success) {
          toast.error('Deposit failed', { description: result.error })
          return
        }
        setStep('ready')
        toast.success('Bank deposit submitted', {
          description: `Reference ${result.referenceId}. Funds credit after confirmation.`,
        })
        router.refresh()
      })
      return
    }

    if (method === 'card') {
      toast.info('PrimeFx Card deposits', {
        description: 'Card funding will be available soon. Use crypto or bank transfer for now.',
      })
      return
    }

    startTransition(async () => {
      const depositCurrency = cryptoCurrencyForMethod(method)
      const result = await initiateDeposit({ amountUsd: value, currency: depositCurrency })
      if (!result.success) {
        toast.error('Deposit failed', { description: result.error })
        return
      }
      setCheckoutUrl(result.checkoutUrl ?? null)
      setPayAddress(result.payAddress ?? null)
      setStep('ready')
      toast.success('Payment created')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <WalletPageHeader
        title="Deposit"
        description="Fund your account securely and start investing"
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
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
          <WalletStatCard
            label="Total Deposited"
            value={wallet?.totalBalance ?? '$0.00'}
            subtext="All time"
            icon={Banknote}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label="Pending Deposits"
            value={`$${pendingDeposits.reduce((s, t) => s + Math.abs(t.amountValue), 0).toFixed(2)}`}
            subtext={`${pendingDeposits.length} transaction${pendingDeposits.length === 1 ? '' : 's'}`}
            icon={Loader2}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            label="This Month Deposits"
            value={`$${monthDeposits.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext={`${monthDeposits.count} transactions`}
            icon={ArrowRight}
            iconClassName="bg-indigo-50 text-indigo-600"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <WalletStepIndicator
              steps={['Select Method', 'Enter Details', 'Confirm Payment', 'Deposit Successful']}
              current={step === 'form' ? 1 : 2}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">1. Select deposit method</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DEPOSIT_METHODS.map((item) => {
                const Icon = item.icon
                const selected = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMethod(item.id)
                      setStep('form')
                    }}
                    className={cn(
                      'relative rounded-xl border p-4 text-left transition-all',
                      selected
                        ? 'border-[#0052ff] bg-blue-50/40 ring-2 ring-[#0052ff]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {selected ? (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#0052ff] text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                    <Icon className="h-6 w-6 text-[#0052ff]" />
                    <p className="mt-3 font-semibold text-gray-900">{item.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.eta}</p>
                    <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      {item.badge}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">2. Deposit details</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {method !== 'bank' && method !== 'card' ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>
                    <CustomSelect
                      value={currency}
                      onValueChange={setCurrency}
                      options={currencies}
                      placeholder="Select currency"
                      disabled={pending}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>
                    <CustomSelect
                      value="USD"
                      onValueChange={() => {}}
                      options={[{ value: 'USD', label: 'USD' }]}
                      disabled
                    />
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                    disabled={pending}
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum: $10.00 · Maximum: $50,000.00</p>
                </div>
                <div className="rounded-lg bg-blue-50 px-4 py-3">
                  <p className="text-xs text-gray-500">You will receive</p>
                  <p className="text-lg font-bold text-gray-900">{Number(amount || 0).toFixed(2)} USD</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={100}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                    placeholder="Add a note for your records"
                  />
                </div>
              </div>

              {method === 'bank' ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900">Bank transfer details</h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    {[
                      ['Bank Name', BANK_DETAILS.bankName],
                      ['Account Name', BANK_DETAILS.accountName],
                      ['Account Number', BANK_DETAILS.accountNumber, true],
                      ['Routing Number', BANK_DETAILS.routingNumber],
                      ['SWIFT Code', BANK_DETAILS.swift],
                      ['Reference / Memo', BANK_DETAILS.reference, true],
                    ].map(([label, value, copyable]) => (
                      <div key={String(label)} className="flex items-center justify-between gap-3">
                        <dt className="text-gray-500">{label}</dt>
                        <dd className="flex items-center gap-2 font-medium text-gray-900">
                          {value}
                          {copyable ? (
                            <button
                              type="button"
                              onClick={() => copyText(String(value), String(label))}
                              className="text-[#0052ff] hover:text-blue-700"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <WalletSecurityNotice>
                    Important: Use the reference code above as payment reference to avoid delays.
                  </WalletSecurityNotice>
                </div>
              ) : step === 'ready' && (checkoutUrl || payAddress) ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <h3 className="font-semibold text-emerald-900">Payment ready</h3>
                  {checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0052ff]"
                    >
                      Open checkout <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  {payAddress ? (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600">Send to address:</p>
                      <p className="mt-1 break-all font-mono text-sm">{payAddress}</p>
                      <QrCode className="mt-2 h-8 w-8 text-gray-400" />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  Select a method and amount, then continue to see payment instructions.
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={handleDeposit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue to Confirmation
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Secure & Encrypted', text: 'Bank-level security for every deposit.' },
              { title: 'Fast Processing', text: 'Deposits processed quickly and efficiently.' },
              { title: 'Zero Deposit Fees', text: 'No deposit fees on supported methods.' },
              { title: 'Multiple Options', text: 'Bank, crypto, and card options.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-sm text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <WalletLimitsPanel
            rules={[
              { label: 'Min deposit', value: '$10.00' },
              { label: 'Max per transaction', value: '$50,000.00' },
              { label: 'Deposit fee', value: '0%' },
              { label: 'Processing time', value: 'Instant – 3 days' },
            ]}
          />
          <WalletRecentPanel
            title="Recent deposits"
            items={recentDeposits}
            loading={transactionsLoading && !transactions.length}
            error={transactionsError}
            onRetry={reloadTransactions}
            emptyTitle="No deposits yet"
            emptyDescription="Your deposit history will appear here after your first funding."
            emptyAction={walletDepositCta()}
          />
          <WalletHelpPanel />
        </div>
      </div>
    </div>
  )
}
