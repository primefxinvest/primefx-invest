'use client'

import { Suspense, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Calendar, DollarSign, TrendingUp, Award, Percent, Wallet } from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
import { StatusCardGrid } from '@/components/shared/status-cards'
import { PortfolioChart, AssetAllocationChart } from '@/components/shared/Charts.lazy'
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
import { pageStackClass, gridGapClass, pageHeaderGapClass } from '@/lib/layout/spacing'
import {
  dashboardCardClass,
  dashboardSectionTitleClass,
  dashboardMutedTextClass,
} from '@/lib/layout/surfaces'
import { CHART_HEIGHT_AREA, CHART_HEIGHT_DONUT, CHART_SKELETON_AREA_CLASS } from '@/lib/layout/charts'
import { cn } from '@/lib/utils'

const PERIOD_KEYS = {
  'This Year': 'periodThisYear',
  'Last Month': 'periodLastMonth',
  'Last 3 Months': 'periodLast3Months',
} as const

const CACHE_OPTS = { cacheKey: '', cacheTtlMs: 30_000 } as const

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
  } = useAsyncData(() => fetchPortfolioMetrics(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-portfolio-metrics',
  })
  const {
    data: wallet,
    loading: walletLoading,
    error: walletError,
    reload: reloadWallet,
  } = useAsyncData(() => fetchWalletData(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-wallet-data',
  })
  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
    reload: reloadChart,
  } = useAsyncData(() => fetchPortfolioChart(selectedPeriod), [selectedPeriod], undefined, {
    ...CACHE_OPTS,
    cacheKey: `dashboard-portfolio-chart-${selectedPeriod}`,
  })
  const {
    data: allocation,
    loading: allocationLoading,
    error: allocationError,
    reload: reloadAllocation,
  } = useAsyncData(() => fetchAssetAllocation(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-asset-allocation',
  })
  const {
    data: markets,
    loading: marketsLoading,
    error: marketsError,
    reload: reloadMarkets,
  } = useAsyncData(() => fetchMarketOverview(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-market-overview',
  })
  const { data: rewards } = useAsyncData(() => fetchRewardsData(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-rewards-data',
  })
  const { data: referral } = useAsyncData(() => fetchReferralData(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-referral-data',
  })
  const { data: learning } = useAsyncData(() => fetchLearningProgress(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-learning-progress',
  })

  useUserWalletRealtime({
    userId: user.id,
    enabled: Boolean(user.id),
    onUpdate: () => {
      void reloadWallet({ silent: true })
      void reloadMetrics({ silent: true })
    },
  })

  return (
    <div className={pageStackClass}>
      <Suspense fallback={null}>
        <SyncPendingDeposits onSynced={reloadWallet} />
      </Suspense>

      <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between', pageHeaderGapClass)}>
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {t('welcome', { name: user.name.split(' ')[0] })}
          </h1>
          <p className={cn('mt-0.5', dashboardMutedTextClass)}>{t('overviewSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm sm:px-4 sm:py-2.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
          <span className="text-xs font-medium text-foreground sm:text-sm">
            {formatDate(new Date().toISOString())}
          </span>
        </div>
      </div>

      <section aria-label={t('overviewSubtitle')}>
        <AsyncState
          loading={metricsLoading || walletLoading}
          error={metricsError ?? walletError}
          onRetry={() => {
            void reloadMetrics()
            void reloadWallet()
          }}
          skeleton={<MetricCardsSkeleton count={3} />}
        >
          <div className="space-y-2.5 sm:space-y-3">
            <StatusCardGrid columns={3}>
              <Link href="/wallet" className="block transition-opacity hover:opacity-95">
                <MetricCard
                  icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
                  label={t('currentBalance')}
                  value={wallet?.availableBalance ?? '$0.00'}
                  iconBg="bg-emerald-50 text-emerald-600"
                />
              </Link>
              <Link href="/portfolio" className="block transition-opacity hover:opacity-95">
                <MetricCard
                  icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
                  label={t('currentValue')}
                  value={metrics?.currentValue ?? '$0.00'}
                  trend={metrics?.trends[1]?.percentage ?? '0%'}
                  iconBg="bg-emerald-50 text-emerald-600"
                />
              </Link>
              <MetricCard
                icon={<Award className="h-4 w-4 sm:h-5 sm:w-5" />}
                label={t('totalProfit')}
                value={metrics?.totalProfit ?? '$0.00'}
                trend={metrics?.trends[2]?.percentage ?? '0%'}
                iconBg="bg-purple-50 text-purple-600"
              />
            </StatusCardGrid>
            <StatusCardGrid columns={2} className="max-w-2xl">
              <MetricCard
                icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                label={t('totalInvested')}
                value={metrics?.totalInvested ?? '$0.00'}
                trend={metrics?.trends[0]?.percentage ?? '0%'}
                iconBg="bg-primary/10 text-primary"
              />
              <MetricCard
                icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />}
                label={t('roiOverall')}
                value={metrics?.roiPercentage ?? '0%'}
                trend={metrics?.trends[3]?.percentage ?? '0%'}
                iconBg="bg-orange-50 text-orange-600"
              />
            </StatusCardGrid>
          </div>
        </AsyncState>
      </section>

      <section aria-label={t('portfolioPerformance')} className={cn('grid grid-cols-1 xl:grid-cols-3', gridGapClass)}>
        <div className={cn(dashboardCardClass, 'xl:col-span-2')}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className={dashboardSectionTitleClass}>{t('portfolioPerformance')}</h2>
            <CustomSelect
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value as keyof typeof PERIOD_KEYS)}
              size="sm"
              className="min-w-0 w-auto"
              triggerClassName="border-0 bg-transparent px-1 shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 text-muted-foreground font-medium"
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
              <Link href="/invest" className="text-sm font-semibold text-primary hover:underline">
                {t('explorePlans')}
              </Link>
            }
            skeleton={<Skeleton className={cn('w-full rounded-lg', CHART_SKELETON_AREA_CLASS)} />}
            compact
          >
            <PortfolioChart data={chartData ?? []} height={CHART_HEIGHT_AREA} />
          </AsyncState>
        </div>

        <div className={dashboardCardClass}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className={dashboardSectionTitleClass}>{t('assetAllocation')}</h2>
            <Link href="/portfolio" className="shrink-0 text-xs font-semibold text-primary hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          <AsyncState
            loading={allocationLoading}
            error={allocationError}
            onRetry={reloadAllocation}
            isEmpty={!allocation?.length}
            emptyTitle={t('noAllocationTitle')}
            emptyDescription={t('noAllocationDesc')}
            emptyAction={
              <Link href="/invest" className="text-sm font-semibold text-primary hover:underline">
                {t('startInvesting')}
              </Link>
            }
            skeleton={
              <div className="space-y-3">
                <Skeleton className="mx-auto h-32 w-32 rounded-full" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-2.5 w-full" />
                  ))}
                </div>
              </div>
            }
            compact
          >
            <>
              <AssetAllocationChart data={allocation ?? []} height={CHART_HEIGHT_DONUT} />
              <div className="mt-3 space-y-1.5">
                {allocation?.map((asset) => (
                  <div key={asset.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="text-muted-foreground">{asset.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{asset.value}%</span>
                  </div>
                ))}
              </div>
            </>
          </AsyncState>
        </div>
      </section>

      <DashboardQuickActions />

      <section aria-label={t('recentTransactions')} className={cn('grid grid-cols-1 items-start xl:grid-cols-3', gridGapClass)}>
        <div className={cn('space-y-3 sm:space-y-4', 'xl:col-span-2')}>
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
            skeleton={<ChartCardSkeleton height="h-40" />}
            compact
          >
            <MarketOverviewWidget markets={markets ?? []} />
          </AsyncState>
        </div>
      </section>

      <section aria-label={t('rewardsProgress')}>
        <DashboardStatusCards rewards={rewards} referral={referral} learning={learning} />
      </section>
    </div>
  )
}
