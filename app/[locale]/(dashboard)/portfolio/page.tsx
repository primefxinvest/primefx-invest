'use client'

import { Link } from '@/i18n/navigation'
import {
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  BarChart2,
  Percent,
  ChevronRight,
  Sprout,
  Layers,
  Crown,
  Gem,
} from 'lucide-react'
import { SummaryCard } from '@/components/portfolio/SummaryCard'
import { StatusCardGrid } from '@/components/shared/status-cards'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { ErrorState } from '@/components/shared/data-state'
import { MetricCardsSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import PerformanceChart from '@/components/portfolio/PerformanceChart'
import AllocationDonut from '@/components/portfolio/AllocationDonut'
import PrimeAIAnalysisCard from '@/components/portfolio/PrimeAIAnalysisCard'
import MonthlyReturnsChart from '@/components/portfolio/MonthlyReturnsChart'
import DistributionMap from '@/components/portfolio/DistributionMap'
import { CapitalWithdrawButton } from '@/components/portfolio/CapitalWithdrawButton'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import {
  fetchAssetAllocation,
  fetchMonthlyReturns,
  fetchPortfolioChart,
  fetchPortfolioInvestments,
  fetchPortfolioMetrics,
  fetchPortfolioOverview,
  fetchPortfolioPerformanceStats,
} from '@/lib/data/queries'
const planIcons: Record<string, typeof Sprout> = {
  'Starter Plan': Sprout,
  'Growth Plan': Layers,
  'Prime Plan': Crown,
  'Elite Plan': Gem,
}

export default function PortfolioPage() {
  const { data: overview, loading: overviewLoading, error: overviewError, reload: reloadOverview } =
    useAsyncData(() => fetchPortfolioOverview(), [])
  const { data: metrics } = useAsyncData(() => fetchPortfolioMetrics(), [])
  const { data: performanceStats } = useAsyncData(() => fetchPortfolioPerformanceStats(), [])
  const { data: chartData = [] } = useAsyncData(() => fetchPortfolioChart(), [])
  const { data: allocation = [] } = useAsyncData(() => fetchAssetAllocation(), [])
  const { data: monthlyReturns = [] } = useAsyncData(() => fetchMonthlyReturns(), [])
  const { data: investments, loading: investmentsLoading, error: investmentsError, reload: reloadInvestments } =
    useAsyncData(() => fetchPortfolioInvestments(), [])

  const portfolioActiveInvestments = investments?.active ?? []
  const portfolioCompletedInvestments = investments?.completed ?? []

  const portfolioPerformanceStats = {
    bestMonth: performanceStats?.bestMonth ?? metrics?.trends[0]?.percentage ?? '0%',
    avgMonthlyReturn: performanceStats?.avgMonthlyReturn ?? metrics?.roiPercentage ?? '0%',
    winningMonths: performanceStats?.winningMonths ?? '0',
    maxDrawdown: performanceStats?.maxDrawdown ?? '0%',
  }

  const portfolioAIAnalysis = {
    riskLevel: 'Moderate',
    diversification: allocation.length > 2 ? 'Excellent' : 'Growing',
    longTermPotential: 'High',
    confidenceScore: 85,
  }

  const bestPerformingAsset = portfolioActiveInvestments[0]
    ? {
        name: portfolioActiveInvestments[0].plan,
        roi: portfolioActiveInvestments[0].roi,
        invested: portfolioActiveInvestments[0].invested,
        currentValue: portfolioActiveInvestments[0].currentValue,
      }
    : { name: '—', roi: '0%', invested: '$0.00', currentValue: '$0.00' }

  const portfolioOverview = overview ?? {
    totalInvested: '$0.00',
    currentValue: '$0.00',
    profitLoss: '$0.00',
    roi: '0%',
    activePlans: 0,
  }

  if (overviewLoading && !overview) {
    return (
      <div className="space-y-5">
        <MetricCardsSkeleton />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5"><TableSkeleton rows={1} cols={1} showHeader={false} /></div>
          <div className="xl:col-span-3"><TableSkeleton rows={1} cols={1} showHeader={false} /></div>
          <div className="xl:col-span-4"><TableSkeleton rows={1} cols={1} showHeader={false} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TableSkeleton rows={4} cols={5} />
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    )
  }

  if (overviewError) {
    return (
      <ErrorState
        title="Could not load portfolio"
        description={overviewError}
        onRetry={reloadOverview}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Portfolio Overview</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Track your investments, performance, and growth in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            May 10, 2024
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-400" />
            Download Report
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <StatusCardGrid columns={4}>
        <SummaryCard
          label="Total Invested"
          value={portfolioOverview.totalInvested}
          subtext={`Across ${portfolioOverview.activePlans} active plans`}
          icon={<DollarSign className="h-5 w-5" />}
          iconClass="bg-blue-50 text-[#0052ff]"
        />
        <SummaryCard
          label="Current Value"
          value={portfolioOverview.currentValue}
          subtext="Updated in real-time"
          icon={<TrendingUp className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Profit / Loss"
          value={portfolioOverview.profitLoss}
          subtext="Total Profit"
          icon={<BarChart2 className="h-5 w-5" />}
          iconClass="bg-violet-50 text-violet-600"
          valueClass="text-emerald-600"
        />
        <SummaryCard
          label="ROI %"
          value={portfolioOverview.roi}
          subtext="Overall Return"
          icon={<Percent className="h-5 w-5" />}
          iconClass="bg-orange-50 text-orange-500"
          valueClass="text-emerald-600"
        />
      </StatusCardGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
          <PerformanceChart data={chartData} stats={portfolioPerformanceStats} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <AllocationDonut data={allocation} totalValue={portfolioOverview.currentValue} />
        </div>
        <div className="xl:col-span-4">
          <PrimeAIAnalysisCard analysis={portfolioAIAnalysis} />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Active investments */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Active Investments</h2>
          </div>
          <ScrollTable>
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-3 py-3">Invested</th>
                  <th className="px-3 py-3">Current Value</th>
                  <th className="px-3 py-3">ROI %</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investmentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-3">
                        <div className="h-10 animate-pulse rounded-md bg-gray-200/80" />
                      </td>
                    </tr>
                  ))
                ) : investmentsError ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6">
                      <ErrorState
                        description={investmentsError}
                        onRetry={reloadInvestments}
                        compact
                      />
                    </td>
                  </tr>
                ) : portfolioActiveInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-slate-400">
                      No active investments yet.{' '}
                      <Link href="/invest" className="font-medium text-[#0052ff] hover:underline">
                        Start investing
                      </Link>
                    </td>
                  </tr>
                ) : (
                portfolioActiveInvestments.map((inv) => {
                  const Icon = planIcons[inv.plan] ?? Layers
                  return (
                    <tr key={inv.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${inv.iconBg}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{inv.plan}</p>
                            <span
                              className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${inv.riskColor}`}
                            >
                              {inv.risk}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-600">{inv.invested}</td>
                      <td className="px-3 py-3.5 font-medium text-slate-800">{inv.currentValue}</td>
                      <td className="px-3 py-3.5 font-semibold text-emerald-600">{inv.roi}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <CapitalWithdrawButton investmentId={inv.id} planName={inv.plan} />
                      </td>
                    </tr>
                  )
                })
                )}
              </tbody>
            </table>
          </ScrollTable>
          <div className="border-t border-slate-100 px-5 py-3">
            <Link
              href="/invest"
              className="flex items-center gap-1 text-[13px] font-medium text-[#0052ff] hover:underline"
            >
              View All Active <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Completed investments */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Completed Investments</h2>
          </div>
          <ScrollTable>
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-3 py-3">Invested</th>
                  <th className="px-3 py-3">Final Value</th>
                  <th className="px-3 py-3">Profit</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investmentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-3">
                        <div className="h-10 animate-pulse rounded-md bg-gray-200/80" />
                      </td>
                    </tr>
                  ))
                ) : portfolioCompletedInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-slate-400">
                      No completed investments yet.
                    </td>
                  </tr>
                ) : (
                portfolioCompletedInvestments.map((inv) => {
                  const Icon = planIcons[inv.plan] ?? Layers
                  return (
                    <tr key={inv.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{inv.plan}</p>
                            <p className="text-[11px] text-slate-400">{inv.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-600">{inv.invested}</td>
                      <td className="px-3 py-3.5 font-medium text-slate-800">{inv.finalValue}</td>
                      <td className="px-3 py-3.5 font-semibold text-emerald-600">{inv.profit}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-semibold text-emerald-600">{inv.status}</span>
                      </td>
                    </tr>
                  )
                })
                )}
              </tbody>
            </table>
          </ScrollTable>
          <div className="border-t border-slate-100 px-5 py-3">
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-[13px] font-medium text-[#0052ff] hover:underline"
            >
              View All Completed <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <MonthlyReturnsChart data={monthlyReturns} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <DistributionMap />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Best Performing Asset</h2>
          <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{bestPerformingAsset.name}</p>
                <p className="text-[12px] text-slate-500">Top ROI this quarter</p>
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-emerald-600">{bestPerformingAsset.roi}</p>
            <div className="mt-3 flex justify-between border-t border-purple-100 pt-3 text-[12px]">
              <div>
                <p className="text-slate-400">Invested</p>
                <p className="font-medium text-slate-700">{bestPerformingAsset.invested}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Current</p>
                <p className="font-medium text-slate-700">{bestPerformingAsset.currentValue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
