'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, DollarSign, TrendingUp, Award, Percent } from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
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
import {
  fetchAssetAllocation,
  fetchLearningProgress,
  fetchMarketOverview,
  fetchPortfolioChart,
  fetchPortfolioMetrics,
  fetchReferralData,
  fetchRewardsData,
} from '@/lib/data/queries'
import { formatDate } from '@/lib/data/format'

export default function DashboardPage() {
  const user = useSessionUser()
  const [selectedPeriod, setSelectedPeriod] = useState('This Year')

  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    reload: reloadMetrics,
  } = useAsyncData(() => fetchPortfolioMetrics(), [])
  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
    reload: reloadChart,
  } = useAsyncData(() => fetchPortfolioChart(), [])
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="mt-0.5 text-sm text-gray-500">Here&apos;s your investment overview for today.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      <AsyncState
        loading={metricsLoading}
        error={metricsError}
        onRetry={reloadMetrics}
        skeleton={<MetricCardsSkeleton />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Total Invested"
            value={metrics?.totalInvested ?? '$0.00'}
            trend={metrics?.trends[0]?.percentage ?? '0%'}
            iconBg="bg-blue-50 text-[#0052ff]"
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Current Value"
            value={metrics?.currentValue ?? '$0.00'}
            trend={metrics?.trends[1]?.percentage ?? '0%'}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <MetricCard
            icon={<Award className="h-5 w-5" />}
            label="Total Profit"
            value={metrics?.totalProfit ?? '$0.00'}
            trend={metrics?.trends[2]?.percentage ?? '0%'}
            iconBg="bg-purple-50 text-purple-600"
          />
          <MetricCard
            icon={<Percent className="h-5 w-5" />}
            label="ROI (Overall)"
            value={metrics?.roiPercentage ?? '0%'}
            trend={metrics?.trends[3]?.percentage ?? '0%'}
            iconBg="bg-orange-50 text-orange-600"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Portfolio Performance</h2>
            <CustomSelect
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              size="sm"
              className="min-w-[9rem]"
              options={[
                { value: 'This Year', label: 'This Year' },
                { value: 'Last Month', label: 'Last Month' },
                { value: 'Last 3 Months', label: 'Last 3 Months' },
              ]}
              placeholder="Period"
            />
          </div>
          <AsyncState
            loading={chartLoading}
            error={chartError}
            onRetry={reloadChart}
            isEmpty={!chartData?.length}
            emptyTitle="No performance data"
            emptyDescription="Invest to start tracking your portfolio performance over time."
            emptyAction={
              <Link
                href="/invest"
                className="text-sm font-semibold text-[#0052ff] hover:underline"
              >
                Explore plans
              </Link>
            }
            skeleton={<Skeleton className="h-64 w-full rounded-lg" />}
            compact
          >
            <PortfolioChart data={chartData ?? []} />
          </AsyncState>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">Asset Allocation</h2>
          <AsyncState
            loading={allocationLoading}
            error={allocationError}
            onRetry={reloadAllocation}
            isEmpty={!allocation?.length}
            emptyTitle="No allocation yet"
            emptyDescription="Start investing to see how your portfolio is distributed."
            emptyAction={
              <Link
                href="/invest"
                className="text-sm font-semibold text-[#0052ff] hover:underline"
              >
                Start investing
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
            emptyTitle="No market data"
            emptyDescription="Market overview will appear once assets are configured."
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
