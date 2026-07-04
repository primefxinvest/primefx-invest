'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { ArrowRight, Bitcoin, ExternalLink, Loader2, QrCode, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import { DepositHeroCard } from '@/components/wallet/deposit/DepositHeroCard'
import { DepositAmountCard } from '@/components/wallet/deposit/DepositAmountCard'
import { DepositMethodSelector } from '@/components/wallet/deposit/DepositMethodSelector'
import { DepositSummaryCard } from '@/components/wallet/deposit/DepositSummaryCard'
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
import { walletTxStatusLabel, walletTxTypeLabel } from '@/lib/wallet/i18n'
import { pageStackClass, gridGapClass, sectionStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

const WalletLimitsPanel = dynamic(
  () => import('@/components/wallet/layout/WalletSidePanels').then((m) => m.WalletLimitsPanel),
  { ssr: false }
)
const WalletRecentPanel = dynamic(
  () => import('@/components/wallet/layout/WalletSidePanels').then((m) => m.WalletRecentPanel),
  { ssr: false }
)
const WalletHelpPanel = dynamic(
  () => import('@/components/wallet/layout/WalletSidePanels').then((m) => m.WalletHelpPanel),
  { ssr: false }
)
const WalletDepositCta = dynamic(
  () => import('@/components/wallet/layout/WalletSidePanels').then((m) => m.WalletDepositCta),
  { ssr: false }
)

type DepositPageViewProps = {
  initialPaymentOptions: PaymentProviderOptions
}

export function DepositPageView({ initialPaymentOptions }: DepositPageViewProps) {
  const t = useTranslations('wallet.deposit')
  const tBalances = useTranslations('wallet.balances')
  const tWallet = useTranslations('wallet')

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

  const flow = useDepositFlow({ initialPaymentOptions })

  const recentDeposits = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'Deposit')
        .slice(0, 4)
        .map((tx) => ({
          id: tx.id,
          label: walletTxTypeLabel(tWallet, tx.type),
          sublabel: tx.referenceId,
          amount: tx.amount,
          status: walletTxStatusLabel(tWallet, tx.status),
          statusKey: tx.status.toLowerCase(),
          time: `${tx.date}${tx.time ? ` · ${tx.time}` : ''}`,
          positive: tx.isCredit,
        })),
    [transactions, tWallet]
  )

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

  const depositAmountFormatted = Number(flow.amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  const feeFormatted = flow.feeEstimate.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const isProcessing = flow.pending || flow.step === 'redirecting'

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <SyncPendingDeposits onSynced={reloadWallet} />

      <WalletPageHeader title={t('title')} description={t('description')} />

      <KycFinancialBanner />

      <AsyncState
        loading={walletLoading && !wallet}
        error={walletError}
        onRetry={reloadWallet}
        errorTitle={t('loadWalletError')}
        skeleton={<MetricCardsSkeleton count={4} />}
      >
        <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4', gridGapClass)}>
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
            icon={ArrowRight}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label={t('pendingDeposits')}
            value={`$${pendingDeposits.reduce((s, tx) => s + Math.abs(tx.amountValue), 0).toFixed(2)}`}
            subtext={`${pendingDeposits.length} ${pendingDeposits.length === 1 ? t('transaction') : t('transactions')}`}
            icon={Loader2}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            label={t('monthDeposits')}
            value={`$${monthDeposits.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext={`${monthDeposits.count} ${t('transactions')}`}
            icon={Bitcoin}
            iconClassName="bg-indigo-50 text-indigo-600"
          />
        </div>
      </AsyncState>

      <div className={cn('grid grid-cols-1 xl:grid-cols-[1fr_320px]', gridGapClass)}>
        <div className={sectionStackClass}>
          <DepositHeroCard supportedCryptoCount={flow.supportedCryptoCount} />

          <DepositAmountCard
            amount={flow.amount}
            onAmountChange={flow.setAmount}
            currency={flow.currency}
            onCurrencyChange={flow.setCurrency}
            currencyOptions={flow.filteredCurrencies}
            formattedReceive={flow.formattedReceive}
            disabled={isProcessing}
            amountError={flow.amountError}
          />

          <DepositMethodSelector
            method={flow.method}
            onMethodChange={flow.setMethod}
            nowPaymentsEnabled={flow.nowPaymentsEnabled}
            binancePayEnabled={flow.binancePayEnabled}
            disabled={isProcessing}
          />

          <DepositSummaryCard
            depositAmount={depositAmountFormatted}
            networkFeeEstimate={feeFormatted}
            expectedCredit={flow.formattedReceive}
            processingTime={flow.processingTime}
            methodLabel={flow.methodLabel}
            currencyLabel={flow.currencyLabel}
          />

          {flow.flowError ? (
            <DepositErrorBanner
              message={flow.flowError}
              onRetry={flow.handleContinue}
              retryLabel={t('retryDeposit')}
            />
          ) : null}

          {flow.step === 'address' && flow.payAddress ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-semibold text-emerald-900">{t('paymentReady')}</h3>
              <p className="mt-1 text-sm text-emerald-800">{t('sendToAddress')}</p>
              <p className="mt-3 break-all font-mono text-sm text-foreground">{flow.payAddress}</p>
              <QrCode className="mt-3 h-8 w-8 text-muted-foreground" aria-hidden />
            </div>
          ) : null}

          <button
            type="button"
            disabled={isProcessing}
            onClick={flow.handleContinue}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {flow.step === 'redirecting' ? t('redirecting') : t('creatingPayment')}
              </>
            ) : (
              <>
                {t('continue')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>

          {flow.checkoutUrl ? (
            <a
              href={flow.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              {t('openCheckout')} <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}

          <DepositSecuritySection />
        </div>

        <aside className={cn('space-y-4', sectionStackClass)}>
          <WalletLimitsPanel
            rules={[
              { label: t('limitsMin'), value: '$10.00' },
              {
                label: t('limitsMax'),
                value: '$500,000.00',
              },
              { label: t('limitsFee'), value: t('limitsFeeValue') },
              { label: t('limitsTime'), value: t('limitsTimeValue') },
            ]}
          />
          <WalletRecentPanel
            title={t('recentDeposits')}
            items={recentDeposits}
            loading={transactionsLoading && !transactions.length}
            error={transactionsError}
            onRetry={reloadTransactions}
            emptyTitle={t('noDepositsTitle')}
            emptyDescription={t('noDepositsDesc')}
            emptyAction={<WalletDepositCta />}
          />
          <WalletHelpPanel />
        </aside>
      </div>
    </div>
  )
}
