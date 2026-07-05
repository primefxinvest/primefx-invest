'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowDownLeft, Clock, Loader2, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import {
  WalletHelpPanel,
  WalletLimitsPanel,
  WalletRecentPanel,
} from '@/components/wallet/layout/WalletSidePanels'
import { WithdrawFormCard } from '@/components/wallet/withdraw/WithdrawFormCard'
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
import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/fees/constants'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

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
    return first ?? DEFAULT_WITHDRAW_CURRENCY
  })
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  const currencies =
    initialPaymentOptions.withdrawalCurrencies.length > 0
      ? initialPaymentOptions.withdrawalCurrencies
      : buildWithdrawalCurrencyOptions()
  const nowPaymentsEnabled = initialPaymentOptions.nowPaymentsEnabled

  const available = useMemo(() => {
    const match = wallet?.availableBalance?.replace(/[^0-9.-]/g, '')
    return Number(match) || 0
  }, [wallet?.availableBalance])

  const pendingWithdrawals = useMemo(
    () => transactions.filter((tx) => tx.type === 'Withdrawal' && tx.status.toLowerCase() === 'pending'),
    [transactions]
  )

  const pendingTotal = useMemo(
    () => pendingWithdrawals.reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0),
    [pendingWithdrawals]
  )

  const totalWithdrawn = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'Withdrawal' && tx.status.toLowerCase() === 'completed')
        .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0),
    [transactions]
  )

  const withdrawableAmount = Math.max(0, available - pendingTotal)
  const amountNum = Number(amount) || 0
  const minWithdrawal = INVESTOR_RULES.financial.minimumWithdrawal
  const withdrawBlocked = kyc.loading || kyc.fetchError || !kyc.verified || !nowPaymentsEnabled

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

  const handleSubmit = () => {
    if (kyc.loading) return

    if (kyc.fetchError) {
      toast.error(tDeposit('kycFetchError'))
      return
    }

    if (!kyc.verified) {
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
    if (amountNum > withdrawableAmount) {
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
      toast.success(t('submitted'), { description: t('nowPaymentsProcessing') })
      setAmount('')
      setAddress('')
      setNote('')
      router.refresh()
    })
  }

  return (
    <div className={cn('min-w-0 pb-24 md:pb-0', pageStackClass)}>
      <WalletPageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <span className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {t('limitsNotice')}: {WITHDRAWAL_NOTICE_DAYS} {t('days')}
          </span>
        }
      />

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
            label={tBalances('available')}
            value={wallet?.availableBalance ?? '$0.00'}
            subtext={tBalances('usdWallet')}
            icon={Wallet}
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
          <WalletStatCard
            compact
            label={t('pendingWithdrawal')}
            value={`$${pendingTotal.toFixed(2)}`}
            subtext={`${pendingWithdrawals.length} ${pendingWithdrawals.length === 1 ? t('request') : t('requests')}`}
            icon={Clock}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            compact
            label={t('totalWithdrawn')}
            value={`$${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext={tBalances('allTime')}
            icon={ArrowDownLeft}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            compact
            label={t('withdrawableBalance')}
            value={`$${withdrawableAmount.toFixed(2)}`}
            subtext={tBalances('afterFees')}
            icon={Loader2}
            iconClassName="bg-indigo-50 text-indigo-600"
          />
        </div>
      </AsyncState>

      <div className={cn('grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]', sectionStackClass)}>
        <WithdrawFormCard
          amount={amount}
          onAmountChange={setAmount}
          currency={currency}
          onCurrencyChange={setCurrency}
          currencies={currencies}
          address={address}
          onAddressChange={setAddress}
          note={note}
          onNoteChange={setNote}
          available={withdrawableAmount}
          onSubmit={handleSubmit}
          isProcessing={pending}
          kycLoading={kyc.loading}
          withdrawDisabled={withdrawBlocked}
          nowPaymentsEnabled={nowPaymentsEnabled}
        />

        <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
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
        </aside>
      </div>
    </div>
  )
}
