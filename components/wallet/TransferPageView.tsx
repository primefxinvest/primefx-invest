'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
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
import {
  DISPLAY_INTERNAL_TRANSFER_FEE_USD,
  formatDisplayFeeUsd,
} from '@/lib/fees/display'
import { walletTxStatusLabel, walletTxTypeLabel } from '@/lib/wallet/i18n'
import { TransferConfirmDialog } from '@/components/wallet/transfer/TransferConfirmDialog'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { pageStackClass, gridGapClass, sectionStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

const TRANSFER_METHODS = [
  { id: 'email', labelKey: 'methodEmail' },
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
  const sessionUser = useSessionUser()
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selfTransfer, setSelfTransfer] = useState(false)
  const submitLockRef = useRef(false)
  const recipientInputRef = useRef<HTMLInputElement>(null)
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
    setSelfTransfer(false)
    const query = recipient.trim()
    if (query.length < 3) return
    if (method === 'email' && !query.includes('@')) return

    if (method === 'id') {
      const prefix = query.trim().replace(/^PFX/i, '')
      if (prefix.length < 4) return
    }

    const timer = window.setTimeout(async () => {
      setLookupPending(true)
      try {
        const result = await searchTransferRecipient(method, query)
        if (result.found && result.recipient.id === sessionUser.id) {
          setRecipientPreview(null)
          setSelfTransfer(true)
          return
        }
        setRecipientPreview(result.found ? result.recipient : null)
      } catch {
        setRecipientPreview(null)
      } finally {
        setLookupPending(false)
      }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [recipient, method, sessionUser.id])

  const executeTransfer = () => {
    if (submitLockRef.current || pending || !recipientPreview) return
    submitLockRef.current = true

    startTransition(async () => {
      try {
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

        setConfirmOpen(false)
        setStep(4)
        toast.success(t('transferCompleted'), {
          description: t('transferCompletedDesc', { reference: result.referenceId ?? '' }),
        })
        setRecipient('')
        setRecipientPreview(null)
        setMessage('')
        reloadWallet()
        reloadTransactions()
        router.refresh()
        window.dispatchEvent(new Event('primefx:transactions-updated'))
      } finally {
        submitLockRef.current = false
      }
    })
  }

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
      if (selfTransfer) {
        toast.error(t('selfTransferError'))
        return
      }
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
        toast.error(t('insufficientBalanceFee', { fee: transferFees.fee.toFixed(2) }))
        return
      }
      setStep(3)
      return
    }

    if (step === 3) {
      setConfirmOpen(true)
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
    <div className={cn('min-w-0', pageStackClass)}>
      <WalletPageHeader title={t('title')} description={t('description')} />

      <KycFinancialBanner />

      <AsyncState
        loading={walletLoading && !wallet}
        error={walletError}
        onRetry={reloadWallet}
        errorTitle={t('loadWalletError')}
        skeleton={<MetricCardsSkeleton count={4} />}
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <WalletStatCard
            compact
            label={t('availableBalance')}
            value={wallet?.availableBalance ?? '$0.00'}
            subtext={tBalances('usdWallet')}
            icon={Send}
          />
          <WalletStatCard
            compact
            label={t('sentToday')}
            value={`$${sentToday.toFixed(2)}`}
            icon={ArrowUpRight}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            compact
            label={t('receivedToday')}
            value={`$${receivedToday.toFixed(2)}`}
            icon={ArrowRight}
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
          <WalletStatCard
            compact
            label={tActivity('transfers')}
            value={`$${transferTx.reduce((s, tx) => s + Math.abs(tx.amountValue), 0).toFixed(2)}`}
            subtext={`${transferTx.length} ${tDeposit('transactions')}`}
            icon={History}
            iconClassName="bg-orange-50 text-orange-600"
          />
        </div>
      </AsyncState>

      <div className={cn('grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]', gridGapClass)}>
        <div className={sectionStackClass}>
          {wallet?.primeFxId ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t('yourIdTitle')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('yourIdDesc')}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">{t('primeFxIdLabel')}</p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
                    {wallet.primeFxId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrimeFxId}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted sm:whitespace-nowrap"
                >
                    <Copy className="h-4 w-4" />
                    {t('copyId')}
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <WalletStepIndicator
              steps={[t('stepRecipient'), t('stepAmount'), t('stepReview'), t('stepConfirm')]}
              current={step}
            />
          </div>

          <div id="transfer-form" className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-foreground">{t('sendMoney')}</h2>

            {step < 4 ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                  {TRANSFER_METHODS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMethod(item.id)
                        setRecipient('')
                        setRecipientPreview(null)
                        setSelfTransfer(false)
                      }}
                      className={cn(
                        'min-h-[44px] rounded-xl border px-4 py-3 text-sm font-semibold transition-colors',
                        method === item.id
                          ? 'border-[#0052ff] bg-[#0052ff]/5 text-[#0052ff]'
                          : 'border-border text-foreground hover:border-[#0052ff]/30'
                      )}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-foreground">{t('recipient')}</label>
                  <input
                    ref={recipientInputRef}
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={method === 'email' ? t('placeholderEmail') : t('placeholderId')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20"
                    disabled={step > 1 || pending}
                    autoComplete="off"
                  />
                </div>

                {lookupPending ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('lookingUpRecipient')}
                  </div>
                ) : selfTransfer ? (
                  <p className="mt-3 text-sm font-medium text-red-600">{t('selfTransferError')}</p>
                ) : recipientPreview ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0052ff]/10 text-[#0052ff]">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {recipientPreview.fullName || recipientPreview.email}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          {t('verified')}
                        </span>
                        {recipientPreview.kycVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {t('kycVerifiedBadge')}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{recipientPreview.primeFxId}</p>
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
                          {t('availableLimits', { available: available.toFixed(2) })}
                        </p>
                        {transferAmount >= 5 ? (
                          <p className="mt-1 text-xs text-gray-500">
                            {t('totalDebit', {
                              total: transferFees.senderTotal.toFixed(2),
                              fee: transferFees.fee.toFixed(2),
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
                        amount: Number(amount).toFixed(2),
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
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {pending ? t('processing') : step === 3 ? t('confirmTransfer') : t('continue')}
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

          <div className={cn('grid grid-cols-1 lg:grid-cols-2', gridGapClass)}>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">{t('conditionsTitle')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>{t('minTransferCondition')}</li>
                <li>{t('maxTransferCondition')}</li>
                <li>{t('dailyLimitVerified')}</li>
                <li>{t('dailyLimitUnverified')}</li>
                <li>{t('internalTransferFeeCondition', { fee: formatDisplayFeeUsd(DISPLAY_INTERNAL_TRANSFER_FEE_USD) })}</li>
                <li>Transfer Speed: Instant</li>
                <li>Methods: Email Address, PrimeFx ID</li>
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
              <button
                type="button"
                onClick={() => recipientInputRef.current?.focus()}
                className="flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Send className="h-5 w-5 text-[#0052ff]" />
                {t('sendMoneyAction')}
              </button>
              <button
                type="button"
                disabled
                aria-disabled
                title={t('comingSoonAction')}
                className="flex min-h-[44px] cursor-not-allowed flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 text-xs font-semibold text-muted-foreground opacity-50"
              >
                <ArrowRight className="h-5 w-5" />
                {t('requestMoney')}
              </button>
              <button
                type="button"
                disabled
                aria-disabled
                title={t('comingSoonAction')}
                className="flex min-h-[44px] cursor-not-allowed flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 text-xs font-semibold text-muted-foreground opacity-50"
              >
                <QrCode className="h-5 w-5" />
                {t('scanQr')}
              </button>
              <Link
                href="/transactions"
                className="flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <History className="h-5 w-5 text-[#0052ff]" />
                {t('transferHistory')}
              </Link>
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

      <TransferConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeTransfer}
        isProcessing={pending}
        recipientName={recipientPreview?.fullName || recipientPreview?.email || ''}
        recipientId={recipientPreview?.primeFxId || ''}
        amount={Number(amount).toFixed(2)}
        fee={transferFees.fee.toFixed(2)}
        totalDebit={transferFees.senderTotal.toFixed(2)}
        message={message.trim() || undefined}
      />

      <div className={cn('grid grid-cols-2 lg:grid-cols-4', gridGapClass)}>
        {[
          { icon: Zap, label: t('featureInstant') },
          { icon: Send, label: t('featureFee', { fee: formatDisplayFeeUsd(DISPLAY_INTERNAL_TRANSFER_FEE_USD) }) },
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
