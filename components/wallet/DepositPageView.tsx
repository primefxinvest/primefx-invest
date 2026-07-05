'use client'

import { useMemo } from 'react'
import { BarChart3, Clock, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import { DepositAmountCard } from '@/components/wallet/deposit/DepositAmountCard'
import { DepositTrustBadges } from '@/components/wallet/deposit/DepositTrustBadges'
import {
  DepositErrorBanner,
  DepositSecuritySection,
} from '@/components/wallet/deposit/DepositSecuritySection'
import { useDepositFlow } from '@/components/wallet/deposit/useDepositFlow'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { SyncPendingDeposits } from '@/components/wallet/SyncPendingDeposits'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import { pageStackClass, gridGapClass, sectionStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

type DepositPageViewProps = {
  initialPaymentOptions: PaymentProviderOptions
}

export function DepositPageView({ initialPaymentOptions }: DepositPageViewProps) {
  const t = useTranslations('wallet.deposit')
  const tBalances = useTranslations('wallet.balances')

  const { wallet, transactions, walletLoading, walletError, reloadWallet } = useWalletPageData()
  const flow = useDepositFlow({ initialPaymentOptions })

  const pendingDeposits = transactions.filter(
    (tx) => tx.type === 'Deposit' && tx.status.toLowerCase() === 'pending'
  )

  const monthDeposits = useMemo(() => {
    const deposits = transactions.filter((tx) => tx.type === 'Deposit' && tx.isCredit)
    return {
      total: deposits.reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0),
      count: deposits.length,
    }
  }, [transactions])

  const isProcessing = flow.pending || flow.step === 'redirecting'
  const processingLabel =
    flow.step === 'redirecting' ? t('redirecting') : t('creatingPayment')

  return (
    <div className={cn('min-w-0 pb-24 md:pb-0', pageStackClass)}>
      <SyncPendingDeposits onSynced={reloadWallet} />

      <WalletPageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              {t('badgeCryptoOnly')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {t('supportedBy')}
              <span className="font-bold text-[#0052ff]">NOWPayments</span>
            </span>
          </div>
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
        <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4', gridGapClass)}>
          <WalletStatCard
            label={tBalances('available')}
            value={wallet?.availableBalance ?? '$0.00'}
            subtext={tBalances('usdWallet')}
            icon={Wallet}
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
          <WalletStatCard
            label={t('totalDeposited')}
            value={wallet?.totalBalance ?? '$0.00'}
            subtext={tBalances('allTime')}
            icon={BarChart3}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label={t('pendingDeposits')}
            value={`$${pendingDeposits.reduce((s, tx) => s + Math.abs(tx.amountValue), 0).toFixed(2)}`}
            subtext={`${pendingDeposits.length} ${pendingDeposits.length === 1 ? t('transaction') : t('transactions')}`}
            icon={Clock}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            label={t('monthDeposits')}
            value={`$${monthDeposits.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext={`${monthDeposits.count} ${t('transactions')}`}
            icon={BarChart3}
            iconClassName="bg-indigo-50 text-indigo-600"
          />
        </div>
      </AsyncState>

      <DepositTrustBadges />

      <div className={cn('mx-auto max-w-lg', sectionStackClass)}>
        <DepositAmountCard
          amount={flow.amount}
          onAmountChange={flow.setAmount}
          onDeposit={flow.handleContinue}
          isProcessing={isProcessing}
          processingLabel={processingLabel}
          amountError={flow.amountError}
          configError={!flow.nowPaymentsEnabled ? t('nowPaymentsNotConfigured') : null}
          depositDisabled={!flow.nowPaymentsEnabled}
        />

        {flow.flowError ? (
          <DepositErrorBanner
            message={flow.flowError}
            onRetry={flow.handleContinue}
            retryLabel={t('retryDeposit')}
          />
        ) : null}

        <DepositSecuritySection />
      </div>
    </div>
  )
}
