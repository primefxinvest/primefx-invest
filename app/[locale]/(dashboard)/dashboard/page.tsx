'use client'

import { Suspense, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Calendar, DollarSign, TrendingUp, Award, Percent, Wallet } from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
import { StatusCardGrid } from '@/components/shared/status-cards'
import { PortfolioChart, AssetAllocationChart } from '@/components/shared/Charts'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions'
import { CustomSelect } from '@/components/ui/custom-select'
import DashboardPlansCarousel from '@/components/dashboard/DashboardPlansCarousel'
import DashboardRecentTransactions from '@/components/dashboard/DashboardRecentTransactions'
import DashboardStatusCards from '@/components/dashboard/DashboardStatusCards'
import MarketOverviewWidget from '@/components/dashboard/MarketOverviewWidget'
import { AsyncState } from '@/components/shared/data-state'
import { ChartCardSkeleton, MetricCardsSkeleton } from '@/components/shared/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useUserWalletRealtime } from '@/lib/hooks/useTransactionsRealtime'
import {
  fetchAssetAllocation,
  fetchLearningProgress,
  fetchMarketOverview,
  fetchPortfolioChart,
  fetchPortfolioMetrics,
  fetchReferralData,
  fetchRewardsData,
  fetchWalletData,
} from '@/lib/data/queries'
import { formatDate } from '@/lib/data/format'
import { SyncPendingDeposits } from '@/components/wallet/SyncPendingDeposits'

const PERIOD_KEYS = {
  'This Year': 'periodThisYear',
  'Last Month': 'periodLastMonth',
  'Last 3 Months': 'periodLast3Months',
} as const

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const user = useSessionUser()
  const [selectedPeriod, setSelectedPeriod] = useState<keyof typeof PERIOD_KEYS>('This Year')

  const periodOptions = (Object.keys(PERIOD_KEYS) as Array<keyof typeof PERIOD_KEYS>).map((value) => ({
    value,
    label: t(PERIOD_KEYS[value]),
  }))

  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    reload: reloadMetrics,
  } = useAsyncData(() => fetchPortfolioMetrics(), [])
  const {
    data: wallet,
    loading: walletLoading,
    error: walletError,
    reload: reloadWallet,
  } = useAsyncData(() => fetchWalletData(), [])
  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
    reload: reloadChart,
  } = useAsyncData(() => fetchPortfolioChart(selectedPeriod), [selectedPeriod])
  const {
    data: allocation,
    loading: allocationLoading,
    error: allocationError,
    reload: reloadAllocation,
  } = useAsyncData(() => fetchAssetAllocation(), [])
  const {
    data: markets,
    loading: marketsLoading,
    error: marketsError,
    reload: reloadMarkets,
  } = useAsyncData(() => fetchMarketOverview(), [])
  const { data: rewards } = useAsyncData(() => fetchRewardsData(), [])
  const { data: referral } = useAsyncData(() => fetchReferralData(), [])
  const { data: learning } = useAsyncData(() => fetchLearningProgress(), [])

  useUserWalletRealtime({
    userId: user.id,
    enabled: Boolean(user.id),
    onUpdate: () => {
      void reloadWallet({ silent: true })
      void reloadMetrics({ silent: true })
    },
  })

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SyncPendingDeposits onSynced={reloadWallet} />
      </Suspense>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('welcome', { name: user.name.split(' ')[0] })}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('overviewSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      <AsyncState
        loading={metricsLoading || walletLoading}
        error={metricsError ?? walletError}
        onRetry={() => {
          void reloadMetrics()
          void reloadWallet()
        }}
        skeleton={<MetricCardsSkeleton count={5} />}
      >
        <StatusCardGrid columns={5}>
          <Link href="/wallet" className="block transition-opacity hover:opacity-95">
            <MetricCard
              icon={<Wallet className="h-5 w-5" />}
              label={t('currentBalance')}
              value={wallet?.availableBalance ?? '$0.00'}
              iconBg="bg-emerald-50 text-emerald-600"
            />
          </Link>
          <MetricCard
            icon={<DollarSign className="h-5 w-5" />}
            label={t('totalInvested')}
            value={metrics?.totalInvested ?? '$0.00'}
            trend={metrics?.trends[0]?.percentage ?? '0%'}
            iconBg="bg-blue-50 text-[#0052ff]"
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            label={t('currentValue')}
            value={metrics?.currentValue ?? '$0.00'}
            trend={metrics?.trends[1]?.percentage ?? '0%'}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <MetricCard
            icon={<Award className="h-5 w-5" />}
            label={t('totalProfit')}
            value={metrics?.totalProfit ?? '$0.00'}
            trend={metrics?.trends[2]?.percentage ?? '0%'}
            iconBg="bg-purple-50 text-purple-600"
          />
          <MetricCard
            icon={<Percent className="h-5 w-5" />}
            label={t('roiOverall')}
            value={metrics?.roiPercentage ?? '0%'}
            trend={metrics?.trends[3]?.percentage ?? '0%'}
            iconBg="bg-orange-50 text-orange-600"
          />
        </StatusCardGrid>
      </AsyncState>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">{t('portfolioPerformance')}</h2>
            <CustomSelect
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value as keyof typeof PERIOD_KEYS)}
              size="sm"
              className="min-w-0 w-auto"
              triggerClassName="border-0 bg-transparent px-1 shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 text-gray-600 font-medium"
              options={periodOptions}
              placeholder={t('period')}
            />
          </div>
          <AsyncState
            loading={chartLoading}
            error={chartError}
            onRetry={reloadChart}
            isEmpty={!chartData?.length}
            emptyTitle={t('noPerformanceTitle')}
            emptyDescription={t('noPerformanceDesc')}
            emptyAction={
              <Link
                href="/invest"
                className="text-sm font-semibold text-[#0052ff] hover:underline"
              >
                {t('explorePlans')}
              </Link>
            }
            skeleton={<Skeleton className="h-64 w-full rounded-lg" />}
            compact
          >
            <PortfolioChart data={chartData ?? []} />
          </AsyncState>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">{t('assetAllocation')}</h2>
          <AsyncState
            loading={allocationLoading}
            error={allocationError}
            onRetry={reloadAllocation}
            isEmpty={!allocation?.length}
            emptyTitle={t('noAllocationTitle')}
            emptyDescription={t('noAllocationDesc')}
            emptyAction={
              <Link
                href="/invest"
                className="text-sm font-semibold text-[#0052ff] hover:underline"
              >
                {t('startInvesting')}
              </Link>
            }
            skeleton={
              <div className="space-y-4">
                <Skeleton className="mx-auto h-40 w-40 rounded-full" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-full" />
                  ))}
                </div>
              </div>
            }
            compact
          >
            <>
              <AssetAllocationChart data={allocation ?? []} />
              <div className="mt-4 space-y-2">
                {allocation?.map((asset) => (
                  <div key={asset.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="text-gray-500">{asset.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{asset.value}%</span>
                  </div>
                ))}
              </div>
            </>
          </AsyncState>
        </div>
      </div>

      <DashboardQuickActions />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <DashboardPlansCarousel />
          <DashboardRecentTransactions />
        </div>
        <div className="self-start">
          <AsyncState
            loading={marketsLoading}
            error={marketsError}
            onRetry={reloadMarkets}
            isEmpty={!markets?.length}
            emptyTitle={t('noMarketTitle')}
            emptyDescription={t('noMarketDesc')}
            skeleton={<ChartCardSkeleton height="h-48" />}
            compact
          >
            <MarketOverviewWidget markets={markets ?? []} />
          </AsyncState>
        </div>
      </div>

      <DashboardStatusCards rewards={rewards} referral={referral} learning={learning} />
    </div>
  )
}
