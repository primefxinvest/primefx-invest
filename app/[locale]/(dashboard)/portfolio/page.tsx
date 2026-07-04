'use client'

import { Link } from '@/i18n/navigation'
import { useCallback, useMemo, useState } from 'react'
import {
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
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { ErrorState } from '@/components/shared/data-state'
import { MetricCardsSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import {
  PerformanceChart,
  AllocationDonut,
  MonthlyReturnsChart,
} from '@/components/portfolio/Charts.lazy'
import { CapitalWithdrawButton } from '@/components/portfolio/CapitalWithdrawButton'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useCapitalWithdrawalRequestsRealtime } from '@/lib/hooks/useCapitalWithdrawalRealtime'
import { pageStackClass } from '@/lib/layout/spacing'
import {
  fetchAssetAllocation,
  fetchCapitalWithdrawalRequests,
  fetchPortfolioChartsBundle,
  fetchPortfolioInvestments,
  fetchPortfolioOverview,
} from '@/lib/data/queries'
import type { PortfolioChartPeriod } from '@/lib/data/portfolio-performance'
const planIcons: Record<string, typeof Sprout> = {
  'Starter Plan': Sprout,
  'Growth Plan': Layers,
  'Prime Plan': Crown,
  'Elite Plan': Gem,
}

const PORTFOLIO_CACHE_OPTS = { cacheTtlMs: 30_000 } as const

export default function PortfolioPage() {
  const user = useSessionUser()
  const [chartPeriod, setChartPeriod] = useState<PortfolioChartPeriod>('1Y')
  const { data: overview, loading: overviewLoading, error: overviewError, reload: reloadOverview } =
    useAsyncData(() => fetchPortfolioOverview(), [], undefined, {
      ...PORTFOLIO_CACHE_OPTS,
      cacheKey: 'portfolio-overview',
    })
  const { data: chartsBundle } = useAsyncData(
    () => fetchPortfolioChartsBundle(chartPeriod),
    [chartPeriod],
    undefined,
    {
      ...PORTFOLIO_CACHE_OPTS,
      cacheKey: `portfolio-charts-bundle-${chartPeriod}`,
    }
  )
  const { data: allocation = [] } = useAsyncData(() => fetchAssetAllocation(), [], undefined, {
    ...PORTFOLIO_CACHE_OPTS,
    cacheKey: 'portfolio-asset-allocation',
  })
  const { data: investments, loading: investmentsLoading, error: investmentsError, reload: reloadInvestments } =
    useAsyncData(() => fetchPortfolioInvestments(), [], undefined, {
      ...PORTFOLIO_CACHE_OPTS,
      cacheKey: 'portfolio-investments',
    })
  const {
    data: capitalWithdrawals = [],
    reload: reloadCapitalWithdrawals,
  } = useAsyncData(() => fetchCapitalWithdrawalRequests(), [], undefined, {
    ...PORTFOLIO_CACHE_OPTS,
    cacheKey: 'portfolio-capital-withdrawals',
  })

  const chartData = chartsBundle?.chart ?? []
  const monthlyReturns = chartsBundle?.monthlyReturns ?? []
  const performanceStats = chartsBundle?.performanceStats

  const reloadCapitalWithdrawalState = useCallback(() => {
    void reloadCapitalWithdrawals()
    void reloadInvestments()
  }, [reloadCapitalWithdrawals, reloadInvestments])

  useCapitalWithdrawalRequestsRealtime({
    userId: user.id,
    enabled: Boolean(user.id),
    onChange: () => {
      reloadCapitalWithdrawalState()
    },
  })

  const capitalWithdrawalByInvestment = useMemo(() => {
    const map = new Map<string, (typeof capitalWithdrawals)[number]>()
    capitalWithdrawals.forEach((request) => {
      map.set(request.investmentId, request)
    })
    return map
  }, [capitalWithdrawals])

  const portfolioActiveInvestments = investments?.active ?? []
  const portfolioCompletedInvestments = investments?.completed ?? []

  const portfolioPerformanceStats = {
    bestMonth: performanceStats?.bestMonth ?? '0%',
    avgMonthlyReturn: performanceStats?.avgMonthlyReturn ?? '0%',
    winningMonths: performanceStats?.winningMonths ?? '0',
    maxDrawdown: performanceStats?.maxDrawdown ?? '0%',
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

  const profitLossValue = portfolioOverview.profitLoss
  const isProfitNegative =
    profitLossValue.includes('-') ||
    profitLossValue.includes('(') ||
    profitLossValue.startsWith('−')

  if (overviewLoading && !overview) {
    return (
      <div className={pageStackClass}>
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200/80" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>
        <MetricCardsSkeleton count={4} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <TableSkeleton rows={1} cols={1} showHeader={false} />
          </div>
          <div className="xl:col-span-5">
            <TableSkeleton rows={1} cols={1} showHeader={false} />
          </div>
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
    <div className={cn('min-w-0', pageStackClass)}>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Portfolio Overview</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Track your investments, performance, and growth in real-time.
        </p>
      </header>

      <section aria-label="Portfolio summary">
        <KpiGrid count={4} aria-label="Portfolio summary">
          <KpiCard
            label="Current Value"
            value={portfolioOverview.currentValue}
            caption="Updated in real-time"
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            label="Profit / Loss"
            value={portfolioOverview.profitLoss}
            caption="Total profit or loss"
            valueClassName={isProfitNegative ? 'text-red-600' : 'text-emerald-600'}
            icon={<BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-violet-50 text-violet-600"
          />
          <KpiCard
            label="Total Invested"
            value={portfolioOverview.totalInvested}
            caption={`Across ${portfolioOverview.activePlans} active plans`}
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-blue-50 text-[#0052ff]"
          />
          <KpiCard
            label="ROI %"
            value={portfolioOverview.roi}
            caption="Overall return"
            valueClassName={isProfitNegative ? 'text-red-600' : 'text-emerald-600'}
            icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-orange-50 text-orange-500"
          />
        </KpiGrid>
      </section>

      <section aria-label="Performance charts" className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-7">
          <PerformanceChart
            data={chartData}
            stats={portfolioPerformanceStats}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-5">
          <AllocationDonut data={allocation} totalValue={portfolioOverview.currentValue} />
        </div>
      </section>

      <section aria-label="Investments" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                        <CapitalWithdrawButton
                          investmentId={inv.id}
                          planName={inv.plan}
                          pendingRequest={capitalWithdrawalByInvestment.get(inv.id)}
                          onRequested={reloadCapitalWithdrawalState}
                        />
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
      </section>

      <section aria-label="Returns and highlights" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <MonthlyReturnsChart data={monthlyReturns} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Best Performing Asset</h2>
          {portfolioActiveInvestments.length === 0 ? (
            <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
              No active investments yet.{' '}
              <Link href="/invest" className="ml-1 font-medium text-[#0052ff] hover:underline">
                Start investing
              </Link>
            </div>
          ) : (
          <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{bestPerformingAsset.name}</p>
                <p className="text-[12px] text-slate-500">Top ROI among active plans</p>
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
          )}
        </div>
      </section>
    </div>
  )
}
