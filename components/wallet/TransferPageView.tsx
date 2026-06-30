'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  QrCode,
  Send,
  Shield,
  User,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import { WalletStepIndicator } from '@/components/wallet/layout/WalletStepIndicator'
import { WalletSecurityNotice, walletTransferCta } from '@/components/wallet/layout/WalletSidePanels'
import { WalletListSkeleton } from '@/components/wallet/layout/WalletListSkeleton'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { searchTransferRecipient, submitWalletTransfer } from '@/lib/wallet/actions'
import type { TransferRecipientMethod } from '@/lib/wallet/types'
import { calculateP2pTransferFee } from '@/lib/fees/constants'
import { cn } from '@/lib/utils'

const TRANSFER_METHODS = [
  { id: 'email', label: 'Email Address' },
  { id: 'username', label: 'Username' },
  { id: 'id', label: 'PrimeFx ID' },
] as const

type RecipientPreview = {
  id: string
  email: string
  fullName: string | null
  primeFxId: string
  kycVerified: boolean
}

export function TransferPageView() {
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
  const [step, setStep] = useState(1)
  const [method, setMethod] = useState<TransferRecipientMethod>('email')
  const [recipient, setRecipient] = useState('')
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null)
  const [lookupPending, setLookupPending] = useState(false)
  const [amount, setAmount] = useState('250')
  const [currency, setCurrency] = useState('USD')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  const transferAmount = Number(amount) || 0
  const transferFees = useMemo(() => calculateP2pTransferFee(transferAmount), [transferAmount])

  const available = useMemo(() => {
    const match = wallet?.availableBalance?.replace(/[^0-9.-]/g, '')
    return Number(match) || 0
  }, [wallet?.availableBalance])

  const transferTx = useMemo(
    () => transactions.filter((tx) => tx.type === 'Transfer'),
    [transactions]
  )

  const sentToday = useMemo(
    () =>
      transferTx
        .filter((tx) => !tx.isCredit && tx.status.toLowerCase() === 'completed')
        .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0),
    [transferTx]
  )

  const receivedToday = useMemo(
    () =>
      transferTx
        .filter((tx) => tx.isCredit && tx.status.toLowerCase() === 'completed')
        .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0),
    [transferTx]
  )

  const recentTransfers = transferTx.slice(0, 5).map((tx) => ({
    id: tx.id,
    name: tx.description ?? 'Transfer',
    amount: tx.amount,
    status: tx.status,
    time: tx.date,
    credit: tx.isCredit,
  }))

  const statusCounts = useMemo(() => {
    const counts = { completed: 0, pending: 0, processing: 0, failed: 0 }
    for (const tx of transferTx) {
      const status = tx.status.toLowerCase()
      if (status === 'completed') counts.completed += 1
      else if (status === 'pending') counts.pending += 1
      else if (status === 'processing') counts.processing += 1
      else if (status === 'failed' || status === 'cancelled') counts.failed += 1
    }
    return counts
  }, [transferTx])

  useEffect(() => {
    setRecipientPreview(null)
    const query = recipient.trim()
    if (query.length < 3) return
    if (method === 'email' && !query.includes('@')) return

    const timer = window.setTimeout(async () => {
      setLookupPending(true)
      try {
        const result = await searchTransferRecipient(method, query)
        setRecipientPreview(result.found ? result.recipient : null)
      } catch {
        setRecipientPreview(null)
      } finally {
        setLookupPending(false)
      }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [recipient, method])

  const handleContinue = () => {
    if (!kyc.loading && !kyc.verified) {
      showKycRequiredToast({
        status: kyc.status,
        action: 'transfer',
        fallback: kyc.summary ?? 'Complete KYC before transferring funds.',
      })
      return
    }

    if (step === 1) {
      if (!recipientPreview) {
        toast.error('Recipient not found. Check the email, username, or PrimeFx ID.')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      const value = Number(amount)
      if (!Number.isFinite(value) || value < 5) {
        toast.error('Minimum transfer is $5.00')
        return
      }
      if (value > available) {
        toast.error('Insufficient balance')
        return
      }
      if (transferFees.senderTotal > available) {
        toast.error(`Insufficient balance for $${transferFees.fee.toFixed(2)} transfer fee`)
        return
      }
      setStep(3)
      return
    }

    if (step === 3) {
      startTransition(async () => {
        const result = await submitWalletTransfer({
          method,
          recipientQuery: recipient.trim(),
          amountUsd: Number(amount),
          message: message.trim() || undefined,
        })

        if (!result.success) {
          toast.error('Transfer failed', { description: result.error })
          return
        }

        setStep(4)
        toast.success('Transfer completed', {
          description: `Reference ${result.referenceId}`,
        })
        setRecipient('')
        setRecipientPreview(null)
        setMessage('')
        router.refresh()
      })
    }
  }

  return (
    <div className="space-y-6">
      <WalletPageHeader
        title="Transfer"
        description="Send money instantly to any PrimeFx user"
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
            icon={Send}
          />
          <WalletStatCard
            label="Sent Today"
            value={`$${sentToday.toFixed(2)}`}
            icon={ArrowUpRight}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label="Received Today"
            value={`$${receivedToday.toFixed(2)}`}
            icon={ArrowRight}
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
          <WalletStatCard
            label="Monthly Transfers"
            value={`$${transferTx.reduce((s, t) => s + Math.abs(t.amountValue), 0).toFixed(2)}`}
            subtext={`${transferTx.length} transactions`}
            icon={History}
            iconClassName="bg-orange-50 text-orange-600"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <WalletStepIndicator
              steps={['Recipient', 'Amount', 'Review', 'Confirm']}
              current={step}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">Send money</h2>

            {step < 4 ? (
              <>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {TRANSFER_METHODS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMethod(item.id)
                        setRecipientPreview(null)
                      }}
                      className={cn(
                        'rounded-xl border px-4 py-3 text-sm font-semibold',
                        method === item.id
                          ? 'border-[#0052ff] bg-blue-50 text-[#0052ff]'
                          : 'border-gray-200 text-gray-700'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Recipient</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={
                      method === 'email'
                        ? 'user@example.com'
                        : method === 'id'
                          ? 'PFX00012458'
                          : 'username'
                    }
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                    disabled={step > 1 || pending}
                  />
                </div>

                {lookupPending ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Looking up recipient...
                  </div>
                ) : recipientPreview ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0052ff]/10 text-[#0052ff]">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {recipientPreview.fullName || recipientPreview.email}
                        </p>
                        {recipientPreview.kycVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-500">{recipientPreview.primeFxId}</p>
                    </div>
                  </div>
                ) : recipient.trim().length >= 3 ? (
                  <p className="mt-3 text-sm text-amber-600">No matching PrimeFx user found.</p>
                ) : null}

                {step >= 2 ? (
                  <>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="number"
                          min="5"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                          disabled={step > 2 || pending}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Available: ${available.toFixed(2)} · Min $5 · Max $10,000 · Fee 1.2%
                        </p>
                        {transferAmount >= 5 ? (
                          <p className="mt-1 text-xs text-gray-500">
                            Total debit: ${transferFees.senderTotal.toFixed(2)} (includes $
                            {transferFees.fee.toFixed(2)} fee)
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>
                        <CustomSelect
                          value={currency}
                          onValueChange={setCurrency}
                          options={[{ value: 'USD', label: 'USD' }]}
                          disabled={step > 2 || pending}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700">Message (optional)</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={100}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                        disabled={step > 2 || pending}
                      />
                      <p className="mt-1 text-right text-xs text-gray-400">{message.length}/100</p>
                    </div>
                  </>
                ) : null}

                {step === 3 && recipientPreview ? (
                  <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                    <p className="font-semibold text-gray-900">Review transfer</p>
                    <p className="mt-2 text-gray-600">
                      Send <strong>${Number(amount).toFixed(2)}</strong> to{' '}
                      <strong>{recipientPreview.fullName || recipientPreview.email}</strong>
                    </p>
                    {message ? <p className="mt-1 text-gray-500">“{message}”</p> : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={pending}
                  onClick={handleContinue}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {step === 3 ? 'Confirm transfer' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <p className="mt-3 text-lg font-semibold text-gray-900">Transfer complete</p>
                <p className="mt-1 text-sm text-gray-600">Funds were sent instantly to the recipient.</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-4 text-sm font-semibold text-[#0052ff] hover:underline"
                >
                  Send another transfer
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">Transfer conditions</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>Minimum transfer: $5.00</li>
                <li>Maximum per transaction: $10,000.00</li>
                <li>Daily limit (verified): $25,000.00</li>
                <li>Daily limit (unverified): $1,000.00</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">Security & safety</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0052ff]" />
                  KYC required for transfers
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0052ff]" />
                  2FA recommended for large transfers
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#0052ff]" />
                  Instant internal transfers
                </li>
              </ul>
              <div className="mt-4">
                <WalletSecurityNotice>Your money is safe — transfers are encrypted end-to-end.</WalletSecurityNotice>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Send Money', icon: Send },
                { label: 'Request Money', icon: ArrowRight },
                { label: 'Scan QR', icon: QrCode },
                { label: 'Transfer History', icon: History },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <action.icon className="h-5 w-5 text-[#0052ff]" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Recent transfers</h3>
            <AsyncState
              loading={transactionsLoading && !transactions.length}
              error={transactionsError}
              onRetry={reloadTransactions}
              isEmpty={recentTransfers.length === 0}
              emptyTitle="No transfers yet"
              emptyDescription="Send money to another PrimeFx user and it will appear here."
              emptyAction={walletTransferCta()}
              errorTitle="Could not load transfers"
              compact
              skeleton={<WalletListSkeleton rows={3} />}
            >
              <ul className="space-y-3">
                {recentTransfers.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{tx.name}</p>
                      <p className="text-xs text-gray-400">{tx.time}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-bold', tx.credit ? 'text-emerald-600' : 'text-gray-900')}>
                        {tx.amount}
                      </p>
                      <span className="text-xs text-gray-500">{tx.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </AsyncState>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Transfer status</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Completed', count: statusCounts.completed, color: 'text-emerald-600' },
                { label: 'Pending', count: statusCounts.pending, color: 'text-amber-600' },
                { label: 'Processing', count: statusCounts.processing, color: 'text-blue-600' },
                { label: 'Failed', count: statusCounts.failed, color: 'text-red-600' },
              ].map((item) => (
                <li key={item.label} className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                  <span className={cn('font-semibold', item.color)}>{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Zap, label: 'Instant Transfers' },
          { icon: Send, label: '1.2% Transfer Fee' },
          { icon: Shield, label: 'Secure Transfers' },
          { icon: Clock, label: '24/7 Support' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <item.icon className="h-5 w-5 text-[#0052ff]" />
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
