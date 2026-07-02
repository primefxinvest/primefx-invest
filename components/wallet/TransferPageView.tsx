'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Copy,
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
import { WalletSecurityNotice, WalletTransferCta } from '@/components/wallet/layout/WalletSidePanels'
import { WalletListSkeleton } from '@/components/wallet/layout/WalletListSkeleton'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { searchTransferRecipient, submitWalletTransfer } from '@/lib/wallet/actions'
import type { TransferRecipientMethod } from '@/lib/wallet/types'
import { calculateP2pTransferFee } from '@/lib/fees/constants'
import { walletTxStatusLabel, walletTxTypeLabel } from '@/lib/wallet/i18n'
import { cn } from '@/lib/utils'

const TRANSFER_METHODS = [
  { id: 'email', labelKey: 'methodEmail' },
  { id: 'username', labelKey: 'methodUsername' },
  { id: 'id', labelKey: 'methodId' },
] as const

type RecipientPreview = {
  id: string
  email: string
  fullName: string | null
  primeFxId: string
  kycVerified: boolean
}

export function TransferPageView() {
  const t = useTranslations('wallet.transfer')
  const tDeposit = useTranslations('wallet.deposit')
  const tBalances = useTranslations('wallet.balances')
  const tActivity = useTranslations('wallet.activity')
  const tTransactions = useTranslations('wallet.transactions')
  const tWallet = useTranslations('wallet')
  const tCompliance = useTranslations('compliance')
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
    name: tx.description ?? walletTxTypeLabel(tWallet, 'Transfer'),
    amount: tx.amount,
    status: walletTxStatusLabel(tWallet, tx.status),
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
        title: tCompliance('kycToastTitle'),
        description:
          kycBlockReason(tCompliance, kyc.status, 'transfer') ??
          kyc.summary ??
          kycFallbackMessage(tCompliance, 'transfer'),
      })
      return
    }

    if (step === 1) {
      if (!recipientPreview) {
        toast.error(t('recipientNotFound'))
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      const value = Number(amount)
      if (!Number.isFinite(value) || value < 5) {
        toast.error(t('minTransfer'))
        return
      }
      if (value > available) {
        toast.error(t('insufficientBalance'))
        return
      }
      if (transferFees.senderTotal > available) {
        toast.error(t('insufficientBalanceFee', { fee: `$${transferFees.fee.toFixed(2)}` }))
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
          toast.error(t('failed'), { description: result.error })
          return
        }

        setStep(4)
        toast.success(t('transferCompleted'), {
          description: t('transferCompletedDesc', { reference: result.referenceId ?? '' }),
        })
        setRecipient('')
        setRecipientPreview(null)
        setMessage('')
        router.refresh()
      })
    }
  }

  const handleCopyPrimeFxId = async () => {
    const value = wallet?.primeFxId
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('copied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <WalletPageHeader title={t('title')} description={t('description')} />

      <KycFinancialBanner />

      <AsyncState
        loading={walletLoading && !wallet}
        error={walletError}
        onRetry={reloadWallet}
        errorTitle={t('loadWalletError')}
        skeleton={<MetricCardsSkeleton count={4} />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WalletStatCard
            label={t('availableBalance')}
            value={wallet?.availableBalance ?? '$0.00'}
            subtext={tBalances('usdWallet')}
            icon={Send}
          />
          <WalletStatCard
            label={t('sentToday')}
            value={`$${sentToday.toFixed(2)}`}
            icon={ArrowUpRight}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label={t('receivedToday')}
            value={`$${receivedToday.toFixed(2)}`}
            icon={ArrowRight}
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
          <WalletStatCard
            label={tActivity('transfers')}
            value={`$${transferTx.reduce((s, tx) => s + Math.abs(tx.amountValue), 0).toFixed(2)}`}
            subtext={`${transferTx.length} ${tDeposit('transactions')}`}
            icon={History}
            iconClassName="bg-orange-50 text-orange-600"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {wallet?.primeFxId ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('yourIdTitle')}</h2>
                  <p className="mt-1 text-sm text-gray-600">{t('yourIdDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrimeFxId}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4" />
                  {t('copyId')}
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500">{t('primeFxIdLabel')}</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">
                  {wallet.primeFxId}
                </p>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <WalletStepIndicator
              steps={[t('stepRecipient'), t('stepAmount'), t('stepReview'), t('stepConfirm')]}
              current={step}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">{t('sendMoney')}</h2>

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
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('recipient')}</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={
                      method === 'email'
                        ? t('placeholderEmail')
                        : method === 'id'
                          ? t('placeholderId')
                          : t('placeholderUsername')
                    }
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                    disabled={step > 1 || pending}
                  />
                </div>

                {lookupPending ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('lookingUpRecipient')}
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
                            {t('verified')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-500">{recipientPreview.primeFxId}</p>
                    </div>
                  </div>
                ) : recipient.trim().length >= 3 ? (
                  <p className="mt-3 text-sm text-amber-600">{t('noMatchingUser')}</p>
                ) : null}

                {step >= 2 ? (
                  <>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">{tDeposit('amount')}</label>
                        <input
                          type="number"
                          min="5"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                          disabled={step > 2 || pending}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {t('availableLimits', { available: `$${available.toFixed(2)}` })}
                        </p>
                        {transferAmount >= 5 ? (
                          <p className="mt-1 text-xs text-gray-500">
                            {t('totalDebit', {
                              total: `$${transferFees.senderTotal.toFixed(2)}`,
                              fee: `$${transferFees.fee.toFixed(2)}`,
                            })}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">{tDeposit('currency')}</label>
                        <CustomSelect
                          value={currency}
                          onValueChange={setCurrency}
                          options={[{ value: 'USD', label: 'USD' }]}
                          disabled={step > 2 || pending}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700">{tDeposit('noteOptional')}</label>
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
                    <p className="font-semibold text-gray-900">{t('reviewTransfer')}</p>
                    <p className="mt-2 text-gray-600">
                      {t('sendAmountTo', {
                        amount: `$${Number(amount).toFixed(2)}`,
                        name: recipientPreview.fullName || recipientPreview.email,
                      })}
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
                  {step === 3 ? t('confirmTransfer') : t('continue')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <p className="mt-3 text-lg font-semibold text-gray-900">{t('transferComplete')}</p>
                <p className="mt-1 text-sm text-gray-600">{t('fundsSentInstantly')}</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-4 text-sm font-semibold text-[#0052ff] hover:underline"
                >
                  {t('sendAnother')}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">{t('conditionsTitle')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>{t('minTransferCondition')}</li>
                <li>{t('maxTransferCondition')}</li>
                <li>{t('dailyLimitVerified')}</li>
                <li>{t('dailyLimitUnverified')}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">{t('securityTitle')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0052ff]" />
                  {t('kycRequired')}
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0052ff]" />
                  {t('twoFaRecommended')}
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#0052ff]" />
                  {t('instantInternal')}
                </li>
              </ul>
              <div className="mt-4">
                <WalletSecurityNotice>{t('securityNotice')}</WalletSecurityNotice>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">{t('quickActions')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t('sendMoneyAction'), icon: Send },
                { label: t('requestMoney'), icon: ArrowRight },
                { label: t('scanQr'), icon: QrCode },
                { label: t('transferHistory'), icon: History },
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
            <h3 className="mb-4 font-semibold text-gray-900">{t('recentTransfers')}</h3>
            <AsyncState
              loading={transactionsLoading && !transactions.length}
              error={transactionsError}
              onRetry={reloadTransactions}
              isEmpty={recentTransfers.length === 0}
              emptyTitle={t('noTransfers')}
              emptyDescription={t('recentEmptyDesc')}
              emptyAction={<WalletTransferCta />}
              errorTitle={tTransactions('loadError')}
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
            <h3 className="mb-4 font-semibold text-gray-900">{t('transferStatus')}</h3>
            <ul className="space-y-2 text-sm">
              {[
                { status: 'completed', count: statusCounts.completed, color: 'text-emerald-600' },
                { status: 'pending', count: statusCounts.pending, color: 'text-amber-600' },
                { status: 'processing', count: statusCounts.processing, color: 'text-blue-600' },
                { status: 'failed', count: statusCounts.failed, color: 'text-red-600' },
              ].map((item) => (
                <li key={item.status} className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    {walletTxStatusLabel(tWallet, item.status)}
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
          { icon: Zap, label: t('featureInstant') },
          { icon: Send, label: t('featureFee') },
          { icon: Shield, label: t('featureSecure') },
          { icon: Clock, label: t('featureSupport') },
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
