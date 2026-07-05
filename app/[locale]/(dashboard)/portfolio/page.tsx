'use client'

import { Link } from '@/i18n/navigation'
import { useCallback, useMemo, useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  BarChart2,
  ChevronRight,
  Sprout,
  Layers,
  Crown,
  Gem,
  Briefcase,
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
import ActiveInvestmentsTable from '@/components/portfolio/ActiveInvestmentsTable'
import PortfolioInvestmentTimeline from '@/components/portfolio/PortfolioInvestmentTimeline'
import PortfolioRiskExposure from '@/components/portfolio/PortfolioRiskExposure'
import PortfolioRecentActivity from '@/components/portfolio/PortfolioRecentActivity'
import DistributionMap from '@/components/portfolio/DistributionMap'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useCapitalWithdrawalRequestsRealtime } from '@/lib/hooks/useCapitalWithdrawalRealtime'
import { pageStackClass, gridGapClass } from '@/lib/layout/spacing'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import {
  fetchAssetAllocation,
  fetchCapitalWithdrawalRequests,
  fetchPortfolioChartsBundle,
  fetchPortfolioInvestments,
  fetchPortfolioOverview,
} from '@/lib/data/queries'
import type { PortfolioChartPeriod } from '@/lib/data/portfolio-performance'
import { cn } from '@/lib/utils'

const planIcons: Record<string, typeof Sprout> = {
  'Starter Plan': Sprout,
  'Growth Plan': Layers,
  'Prime Plan': Crown,
  'Elite Plan': Gem,
}

const PORTFOLIO_CACHE_OPTS = { cacheTtlMs: 30_000 } as const

const CATEGORY_COLORS: Record<string, string> = {
  'FOR BEGINNERS': '#10b981',
  'GROW YOUR WEALTH': '#0052ff',
  'BEST VALUE': '#7c3aed',
  'PREMIUM ACCESS': '#f97316',
}

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
    totalWeeklyEarnings: '$0.00',
    totalProfitsEarned: '$0.00',
  }

  const profitLossValue = portfolioOverview.profitLoss
  const isProfitNegative =
    profitLossValue.includes('-') ||
    profitLossValue.includes('(') ||
    profitLossValue.startsWith('−')

  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string
      title: string
      subtitle: string
      date: string
      status: 'completed' | 'active' | 'pending'
    }> = []

    portfolioActiveInvestments.forEach((inv) => {
      events.push({
        id: `active-${inv.id}`,
        title: `${inv.displayId} · ${inv.plan}`,
        subtitle: `${inv.invested} invested · ${inv.weeklyReturn} weekly`,
        date: 'Active',
        status: 'active',
      })
    })

    portfolioCompletedInvestments.forEach((inv) => {
      events.push({
        id: `completed-${inv.id}`,
        title: inv.plan,
        subtitle: `Final value ${inv.finalValue} · Profit ${inv.profit}`,
        date: inv.date,
        status: 'completed',
      })
    })

    capitalWithdrawals.forEach((req) => {
      events.push({
        id: `withdraw-${req.id}`,
        title: 'Capital withdrawal request',
        subtitle: `$${req.amountUsd.toFixed(2)} · ${req.status.replace('_', ' ')}`,
        date: new Date(req.requestedAt).toLocaleDateString(),
        status: req.status === 'ready' ? 'completed' : 'pending',
      })
    })

    return events.slice(0, 8)
  }, [portfolioActiveInvestments, portfolioCompletedInvestments, capitalWithdrawals])

  const planCategoryBuckets = useMemo(() => {
    const counts = new Map<string, number>()
    portfolioActiveInvestments.forEach((inv) => {
      counts.set(inv.category, (counts.get(inv.category) ?? 0) + 1)
    })
    const total = portfolioActiveInvestments.length || 1
    return Array.from(counts.entries()).map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
      color: CATEGORY_COLORS[label] ?? '#0052ff',
    }))
  }, [portfolioActiveInvestments])

  const overallAllocationLabel = useMemo(() => {
    if (!planCategoryBuckets.length) return 'No active plans'
    const dominant = planCategoryBuckets.reduce((a, b) => (a.percentage >= b.percentage ? a : b))
    return `${dominant.label} weighted`
  }, [planCategoryBuckets])

  if (overviewLoading && !overview) {
    return (
      <div className={pageStackClass}>
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200/80" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>
        <MetricCardsSkeleton count={5} />
        <div className={cn('grid grid-cols-1 xl:grid-cols-12', gridGapClass)}>
          <div className="xl:col-span-7">
            <TableSkeleton rows={1} cols={1} showHeader={false} />
          </div>
          <div className="xl:col-span-5">
            <TableSkeleton rows={1} cols={1} showHeader={false} />
          </div>
        </div>
        <div className={cn('grid grid-cols-1 xl:grid-cols-2', gridGapClass)}>
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
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Portfolio Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your investments, performance, and growth in real-time.
        </p>
      </header>

      {/* 1. Portfolio Summary KPI Row */}
      <section aria-label="Portfolio summary">
        <KpiGrid count={5} aria-label="Portfolio summary">
          <KpiCard
            label="Total Portfolio Value"
            value={portfolioOverview.currentValue}
            caption="Updated in real-time"
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            label="Total Invested"
            value={portfolioOverview.totalInvested}
            caption="Capital deployed"
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-blue-50 text-[#0052ff]"
          />
          <KpiCard
            label="Total Profit"
            value={portfolioOverview.profitLoss}
            caption="Net gain or loss"
            valueClassName={isProfitNegative ? 'text-red-600' : 'text-emerald-600'}
            icon={<BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-violet-50 text-violet-600"
          />
          <KpiCard
            label="Active Investments"
            value={String(portfolioOverview.activePlans)}
            caption="Independent positions"
            icon={<Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-slate-100 text-slate-600"
          />
          <KpiCard
            label="Weekly Earnings"
            value={portfolioOverview.totalWeeklyEarnings ?? '$0.00'}
            caption="Target across active plans"
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
        </KpiGrid>
      </section>

      {/* 2 & 3. Performance + Allocation */}
      <section
        aria-label="Performance charts"
        className={cn('grid grid-cols-1 xl:grid-cols-12', gridGapClass)}
      >
        <div className={cn(dashboardCardClass, 'flex min-h-[380px] flex-col xl:col-span-7')}>
          <PerformanceChart
            data={chartData}
            stats={portfolioPerformanceStats}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        </div>
        <div className={cn(dashboardCardClass, 'flex min-h-[380px] flex-col xl:col-span-5')}>
          <AllocationDonut data={allocation} totalValue={portfolioOverview.currentValue} />
        </div>
      </section>

      {/* 4. Active Investments */}
      <section aria-label="Active investments">
        <div className={cn(dashboardCardClass, 'overflow-hidden p-0 sm:p-0')}>
          <ActiveInvestmentsTable
            investments={portfolioActiveInvestments}
            loading={investmentsLoading}
            error={investmentsError}
            onRetry={reloadInvestments}
            capitalWithdrawalByInvestment={capitalWithdrawalByInvestment}
            onWithdrawalRequested={reloadCapitalWithdrawalState}
          />
        </div>
      </section>

      {/* 5, 6, 7. Timeline · Profit Distribution · Risk */}
      <section
        aria-label="Portfolio analytics"
        className={cn('grid grid-cols-1 lg:grid-cols-3', gridGapClass)}
      >
        <PortfolioInvestmentTimeline events={timelineEvents} />
        <div className={cn(dashboardCardClass, 'flex h-full min-h-[280px] flex-col')}>
          <h2 className={dashboardSectionTitleClass}>Profit Distribution</h2>
          <div className="mt-3 min-h-0 flex-1">
            <MonthlyReturnsChart data={monthlyReturns} />
          </div>
        </div>
        <PortfolioRiskExposure buckets={planCategoryBuckets} overallLabel={overallAllocationLabel} />
      </section>

      {/* Completed investments (retained feature) */}
      <section aria-label="Completed investments">
        <div className={cn(dashboardCardClass, 'overflow-hidden p-0 sm:p-0')}>
          <div className="border-b border-border px-5 py-3.5">
            <h2 className={dashboardSectionTitleClass}>Completed Investments</h2>
          </div>
          <ScrollTable>
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-3 py-3">Invested</th>
                  <th className="px-3 py-3">Final Value</th>
                  <th className="px-3 py-3">Profit</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
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
                    <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                      No completed investments yet.
                    </td>
                  </tr>
                ) : (
                  portfolioCompletedInvestments.map((inv) => {
                    const Icon = planIcons[inv.plan] ?? Layers
                    return (
                      <tr key={inv.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{inv.displayId}</p>
                              <p className="text-[11px] text-muted-foreground">{inv.plan} · {inv.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-muted-foreground">{inv.invested}</td>
                        <td className="px-3 py-3.5 font-medium text-foreground">{inv.finalValue}</td>
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
          <div className="border-t border-border px-5 py-3">
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
            >
              View All Completed <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Distribution + Recent Activity + Best Performer */}
      <section
        aria-label="Portfolio activity"
        className={cn('grid grid-cols-1 lg:grid-cols-3', gridGapClass)}
      >
        <div className={cn(dashboardCardClass, 'lg:col-span-1')}>
          <DistributionMap />
        </div>
        <div className="lg:col-span-1">
          <PortfolioRecentActivity />
        </div>
        <div className={cn(dashboardCardClass, 'flex h-full min-h-[280px] flex-col lg:col-span-1')}>
          <h2 className={dashboardSectionTitleClass}>Best Performing Asset</h2>
          {portfolioActiveInvestments.length === 0 ? (
            <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
              No active investments yet.{' '}
              <Link href="/invest" className="ml-1 font-medium text-primary hover:underline">
                Start investing
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 flex-col rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                  <Crown className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{bestPerformingAsset.name}</p>
                  <p className="text-[12px] text-muted-foreground">Top ROI among active plans</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-emerald-600">{bestPerformingAsset.roi}</p>
              <div className="mt-auto flex justify-between border-t border-purple-100 pt-3 text-[12px]">
                <div>
                  <p className="text-muted-foreground">Invested</p>
                  <p className="font-medium text-foreground">{bestPerformingAsset.invested}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Current</p>
                  <p className="font-medium text-foreground">{bestPerformingAsset.currentValue}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
