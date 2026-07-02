'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  ArrowRight,
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
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import {
  buildWithdrawalCurrencyOptions,
  DEFAULT_WITHDRAW_CURRENCY,
} from '@/lib/payments/currency-options'
import { initiateWithdrawal } from '@/lib/wallet/actions'
import { walletTxStatusLabel, walletTxTypeLabel } from '@/lib/wallet/i18n'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { calculateWithdrawalFee, WITHDRAWAL_NOTICE_DAYS } from '@/lib/fees/constants'

const FEE_RATE = INVESTOR_RULES.financial.withdrawalFeeRate

type WithdrawPageViewProps = {
  initialPaymentOptions: PaymentProviderOptions
}

export function WithdrawPageView({ initialPaymentOptions }: WithdrawPageViewProps) {
  const t = useTranslations('wallet.withdraw')
  const tDeposit = useTranslations('wallet.deposit')
  const tBalances = useTranslations('wallet.balances')
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
  const [amount, setAmount] = useState('500')
  const [currency, setCurrency] = useState(() => {
    const first = initialPaymentOptions.withdrawalCurrencies[0]?.value
    if (first) return first
    return DEFAULT_WITHDRAW_CURRENCY
  })
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [twoFa, setTwoFa] = useState('')
  const [showPin, setShowPin] = useState(false)
  const currencies =
    initialPaymentOptions.withdrawalCurrencies.length > 0
      ? initialPaymentOptions.withdrawalCurrencies
      : buildWithdrawalCurrencyOptions()
  const nowPaymentsEnabled = initialPaymentOptions.nowPaymentsEnabled
  const [pending, startTransition] = useTransition()

  const available = useMemo(() => {
    const match = wallet?.availableBalance?.replace(/[^0-9.-]/g, '')
    return Number(match) || 0
  }, [wallet?.availableBalance])

  const amountNum = Number(amount) || 0
  const { fee, netAmount: receive } = calculateWithdrawalFee(amountNum)

  const recentWithdrawals = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'Withdrawal')
        .slice(0, 5)
        .map((tx) => ({
          id: tx.id,
          label: walletTxTypeLabel(tWallet, tx.type),
          sublabel: tx.referenceId,
          amount: tx.amount,
          status: walletTxStatusLabel(tWallet, tx.status),
          statusKey: tx.status.toLowerCase(),
          time: `${tx.date}${tx.time ? ` · ${tx.time}` : ''}`,
          positive: false,
        })),
    [transactions, tWallet]
  )

  const pendingWithdrawals = transactions.filter(
    (tx) => tx.type === 'Withdrawal' && tx.status.toLowerCase() === 'pending'
  )

  const totalWithdrawn = transactions
    .filter((tx) => tx.type === 'Withdrawal' && tx.status.toLowerCase() === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0)

  const minWithdrawal = INVESTOR_RULES.financial.minimumWithdrawal

  const handleSubmit = () => {
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

    if (amountNum < minWithdrawal) {
      toast.error(t('minWithdrawalError', { amount: `$${minWithdrawal.toFixed(2)}` }))
      return
    }
    if (amountNum > available) {
      toast.error(t('exceedsBalance'))
      return
    }

    if (!nowPaymentsEnabled) {
      toast.error(tDeposit('nowPaymentsConfigError'), {
        description: tDeposit('nowPaymentsConfigHint'),
      })
      return
    }

    if (!address.trim()) {
      toast.error(t('addressRequired'))
      return
    }

    startTransition(async () => {
      const result = await initiateWithdrawal({
        amountUsd: amountNum,
        currency,
        address: address.trim(),
      })
      if (!result.success) {
        toast.error(t('failed'), { description: result.error })
        return
      }
      toast.success(t('submitted'), {
        description: t('nowPaymentsProcessing'),
      })
      setAmount('')
      setAddress('')
      setNote('')
      router.refresh()
    })
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
            label={tBalances('available')}
            value={wallet?.availableBalance ?? '$0.00'}
            subtext={tBalances('usdWallet')}
            icon={Wallet}
          />
          <WalletStatCard
            label={t('withdrawableBalance')}
            value={`$${Math.max(0, available - fee).toFixed(2)}`}
            subtext={tBalances('afterFees')}
            icon={CreditCard}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label={t('pendingWithdrawal')}
            value={`$${pendingWithdrawals.reduce((s, tx) => s + Math.abs(tx.amountValue), 0).toFixed(2)}`}
            subtext={`${pendingWithdrawals.length} ${pendingWithdrawals.length === 1 ? t('request') : t('requests')}`}
            icon={Loader2}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            label={t('totalWithdrawn')}
            value={`$${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext={tBalances('allTime')}
            icon={ArrowRight}
            iconClassName="bg-orange-50 text-orange-600"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">{t('withdrawDetails')}</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('cryptoCurrency')}</label>
                  <CustomSelect
                    value={currency}
                    onValueChange={setCurrency}
                    options={currencies}
                    disabled={pending || currencies.length === 0}
                    placeholder={t('selectCurrency')}
                  />
                  {!nowPaymentsEnabled ? (
                    <p className="mt-1 text-xs text-amber-700">{t('nowPaymentsNotConfigured')}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('amountUsd')}</label>
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('noteOptional')}</label>
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
                <p className="text-sm text-gray-600">{t('youWillReceive')}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">${receive.toFixed(2)}</p>
                <p className="mt-2 text-sm text-gray-500">
                  {t('fee')}: ${fee.toFixed(2)} ({(FEE_RATE * 100).toFixed(1)}%)
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  {t('noticeRequired', { days: WITHDRAWAL_NOTICE_DAYS })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">{t('securityVerification')}</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('withdrawalPin')} <span className="font-normal text-gray-400">{t('optional')}</span>
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
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('twoFaCode')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={twoFa}
                    onChange={(e) => setTwoFa(e.target.value)}
                    maxLength={6}
                    placeholder={t('twoFaPlaceholder')}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('getCode')}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <WalletSecurityNotice>{t('securityNotice')}</WalletSecurityNotice>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('reviewWithdrawal')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <WalletLimitsPanel
            rules={[
              { label: t('limitsMin'), value: '$10.00' },
              { label: t('limitsMax'), value: '$10,000.00' },
              { label: t('limitsFee'), value: '5%' },
              { label: t('limitsNotice'), value: `${WITHDRAWAL_NOTICE_DAYS} ${t('days')}` },
            ]}
          />
          <WalletRecentPanel
            title={t('recentWithdrawals')}
            items={recentWithdrawals}
            loading={transactionsLoading && !transactions.length}
            error={transactionsError}
            onRetry={reloadTransactions}
            emptyTitle={t('noWithdrawalsTitle')}
            emptyDescription={t('noWithdrawalsDesc')}
          />
          <WalletHelpPanel />
        </div>
      </div>
    </div>
  )
}
