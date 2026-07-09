'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowDownLeft, ArrowUpRight, History, Lock, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import { WalletHelpPanel } from '@/components/wallet/layout/WalletSidePanels'
import { WithdrawalHistorySection } from '@/components/wallet/withdraw/WithdrawalHistorySection'
import { WithdrawFormCard } from '@/components/wallet/withdraw/WithdrawFormCard'
import { WithdrawSummaryCard } from '@/components/wallet/withdraw/WithdrawSummaryCard'
import { WithdrawTrustPanel } from '@/components/wallet/withdraw/WithdrawTrustPanel'
import { WithdrawLimitsCard } from '@/components/wallet/withdraw/WithdrawLimitsCard'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { useEmailVerification } from '@/lib/auth/email-verification-context'
import { isEmailNotVerifiedResult } from '@/lib/auth/email-verification-client'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import {
  getNetworksForAsset,
  resolveApiCurrency,
  WITHDRAW_ASSETS,
  type WithdrawAssetId,
} from '@/lib/payments/withdraw-networks'
import { initiateWithdrawal } from '@/lib/wallet/actions'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import {
  calculateDisplayWithdrawalReceive,
  formatDisplayFeeUsd,
} from '@/lib/fees/display'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useWalletWithdrawalRealtime } from '@/lib/hooks/useWalletWithdrawalRealtime'
import { fetchWalletWithdrawalRequests } from '@/lib/data/queries'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

type WithdrawPageViewProps = {
  initialPaymentOptions: PaymentProviderOptions
}

function pickDefaultAsset(availableApiCurrencies: string[]): WithdrawAssetId {
  for (const asset of WITHDRAW_ASSETS) {
    if (getNetworksForAsset(asset.id, availableApiCurrencies).length > 0) {
      return asset.id
    }
  }
  return 'USDT'
}

export function WithdrawPageView({ initialPaymentOptions }: WithdrawPageViewProps) {
  const t = useTranslations('wallet.withdraw')
  const tDeposit = useTranslations('wallet.deposit')
  const tBalances = useTranslations('wallet.balances')
  const tCompliance = useTranslations('compliance')
  const router = useRouter()
  const user = useSessionUser()
  const kyc = useFinancialKycAccess()
  const { requireVerifiedEmail, openVerificationModal } = useEmailVerification()
  const {
    wallet,
    transactions,
    walletLoading,
    walletError,
    reloadWallet,
  } = useWalletPageData()

  const withdrawalHistoryQuery = useAsyncData(() => fetchWalletWithdrawalRequests(), [])

  useWalletWithdrawalRealtime({
    userId: user.id,
    enabled: Boolean(user.id),
    onUpdate: () => {
      void withdrawalHistoryQuery.reload({ silent: true })
      reloadWallet()
    },
  })

  const withdrawalHistory = withdrawalHistoryQuery.data ?? []

  const availableApiCurrencies = useMemo(() => {
    if (initialPaymentOptions.withdrawalCurrencies.length > 0) {
      return initialPaymentOptions.withdrawalCurrencies.map((c) => c.value)
    }
    return ['USDT_TRC20', 'BTC', 'ETH', 'USDC', 'BNB', 'SOL', 'MATIC']
  }, [initialPaymentOptions.withdrawalCurrencies])

  const cryptoWithdrawalsEnabled = initialPaymentOptions.nowPaymentsEnabled

  const [amount, setAmount] = useState('')
  const [assetId, setAssetId] = useState<WithdrawAssetId>(() =>
    pickDefaultAsset(availableApiCurrencies)
  )
  const [networkId, setNetworkId] = useState(() => {
    const networks = getNetworksForAsset(pickDefaultAsset(availableApiCurrencies), availableApiCurrencies)
    return networks[0]?.id ?? 'TRC20'
  })
  const [address, setAddress] = useState('')
  const [pending, startTransition] = useTransition()

  const available = useMemo(() => {
    const match = wallet?.availableBalance?.replace(/[^0-9.-]/g, '')
    return Number(match) || 0
  }, [wallet?.availableBalance])

  const reserved = useMemo(() => {
    const match = wallet?.reservedBalance?.replace(/[^0-9.-]/g, '')
    return Number(match) || 0
  }, [wallet?.reservedBalance])

  const withdrawableAmount = useMemo(() => {
    const match = wallet?.withdrawableBalance?.replace(/[^0-9.-]/g, '')
    return Number(match) || available
  }, [wallet?.withdrawableBalance, available])

  const activeHoldCount = useMemo(
    () =>
      withdrawalHistory.filter((row) =>
        ['pending_notice', 'ready', 'approved', 'processing'].includes(row.status)
      ).length,
    [withdrawalHistory]
  )

  const totalWithdrawn = useMemo(() => {
    const fromRequests = withdrawalHistory
      .filter((row) => row.status === 'completed')
      .reduce((sum, row) => sum + row.amountUsd, 0)
    if (fromRequests > 0) return fromRequests
    return transactions
      .filter((tx) => tx.type === 'Withdrawal' && tx.status.toLowerCase() === 'completed')
      .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0)
  }, [withdrawalHistory, transactions])

  const amountNum = Number(amount) || 0
  const minWithdrawal = INVESTOR_RULES.financial.minimumWithdrawal
  const withdrawBlocked = kyc.loading || kyc.fetchError || !kyc.verified || !cryptoWithdrawalsEnabled

  const displayFees = calculateDisplayWithdrawalReceive(amountNum, networkId)

  const handleSubmit = () => {
    if (!requireVerifiedEmail()) return

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

    if (!cryptoWithdrawalsEnabled) {
      toast.error(t('cryptoUnavailable'))
      return
    }

    if (!address.trim()) {
      toast.error(t('addressRequired'))
      return
    }

    const apiCurrency = resolveApiCurrency(assetId, networkId, availableApiCurrencies)
    if (!apiCurrency) {
      toast.error(t('noNetworksAvailable'))
      return
    }

    startTransition(async () => {
      const result = await initiateWithdrawal({
        amountUsd: amountNum,
        currency: apiCurrency,
        address: address.trim(),
      })
      if (!result.success) {
        if (isEmailNotVerifiedResult(result)) {
          openVerificationModal()
        }
        toast.error(t('failed'), { description: result.error })
        return
      }
      toast.success(t('submitted'), { description: t('submittedDesc') })
      setAmount('')
      setAddress('')
      void withdrawalHistoryQuery.reload({ silent: true })
      router.refresh()
    })
  }

  return (
    <div className={cn('min-w-0 pb-24 md:pb-0', pageStackClass)}>
      <WalletPageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Link
            href="/transactions"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <History className="h-4 w-4 text-[#0052ff]" aria-hidden />
            {t('withdrawalHistory')}
          </Link>
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
        <div className="grid grid-cols-2 gap-1.5 sm:gap-3 xl:grid-cols-4">
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
            label={t('totalWithdrawn')}
            value={`$${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext={tBalances('allTime')}
            icon={ArrowDownLeft}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            compact
            label="Reserved Balance"
            value={wallet?.reservedBalance ?? `$${reserved.toFixed(2)}`}
            subtext={`${activeHoldCount} active hold${activeHoldCount === 1 ? '' : 's'}`}
            icon={Lock}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            compact
            label={t('withdrawableBalance')}
            value={wallet?.withdrawableBalance ?? `$${withdrawableAmount.toFixed(2)}`}
            subtext={tBalances('afterFees')}
            icon={ArrowUpRight}
            iconClassName="bg-indigo-50 text-indigo-600"
          />
        </div>
      </AsyncState>

      <div
        className={cn(
          'grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]',
          sectionStackClass
        )}
      >
        <div className="min-w-0 space-y-5">
          <WithdrawFormCard
            amount={amount}
            onAmountChange={setAmount}
            assetId={assetId}
            onAssetChange={(next) => {
              setAssetId(next)
              const networks = getNetworksForAsset(next, availableApiCurrencies)
              setNetworkId(networks[0]?.id ?? '')
            }}
            networkId={networkId}
            onNetworkChange={setNetworkId}
            availableApiCurrencies={availableApiCurrencies}
            address={address}
            onAddressChange={setAddress}
            available={withdrawableAmount}
            onSubmit={handleSubmit}
            isProcessing={pending}
            kycLoading={kyc.loading}
            withdrawDisabled={withdrawBlocked}
            cryptoWithdrawalsEnabled={cryptoWithdrawalsEnabled}
          />

          <div className="lg:hidden">
            <WithdrawTrustPanel />
          </div>

          <WithdrawalHistorySection
            withdrawals={withdrawalHistory}
            loading={withdrawalHistoryQuery.loading && !withdrawalHistory.length}
            error={withdrawalHistoryQuery.error}
            onRetry={() => void withdrawalHistoryQuery.reload()}
            onHoldExpired={() => {
              void withdrawalHistoryQuery.reload({ silent: true })
              reloadWallet()
            }}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <WithdrawSummaryCard
            withdrawalAmount={`$${amountNum > 0 ? amountNum.toFixed(2) : '0.00'}`}
            networkFee={formatDisplayFeeUsd(displayFees.networkFeeUsd)}
            platformFee={formatDisplayFeeUsd(displayFees.platformFeeUsd)}
            youWillReceive={formatDisplayFeeUsd(displayFees.youWillReceiveUsd)}
            processingTime={t('processingTimeRange')}
          />

          <WithdrawLimitsCard verified={kyc.verified} />

          <div className="hidden lg:block">
            <WithdrawTrustPanel />
          </div>

          <WalletHelpPanel />
        </aside>
      </div>
    </div>
  )
}
