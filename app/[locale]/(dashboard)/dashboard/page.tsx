'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Calendar } from 'lucide-react'
import { InvestorKpiCards } from '@/components/shared/kpi'
import { PortfolioChart, AssetAllocationChart } from '@/components/shared/Charts.lazy'
import {
  DashboardMarketSection,
  DashboardPlansCarousel,
  DashboardQuickActions,
  DashboardRecentTransactions,
  DashboardSecondarySectionsDeferred,
} from '@/components/dashboard/Dashboard.lazy'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState } from '@/components/shared/data-state'
import { ChartCardSkeleton, MetricCardsSkeleton } from '@/components/shared/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useDashboardCore } from '@/lib/hooks/useDashboardCore'
import { useUserWalletRealtime } from '@/lib/hooks/useTransactionsRealtime'
import type { PortfolioChartPeriod } from '@/lib/data/portfolio-performance'
import { formatDate } from '@/lib/data/format'
import { pageStackClass, pageHeaderGapClass, gridGapClass } from '@/lib/layout/spacing'
import { dashboardCardClass, dashboardMutedTextClass } from '@/lib/layout/surfaces'
import { CHART_HEIGHT_AREA, CHART_HEIGHT_DONUT, CHART_SKELETON_AREA_CLASS } from '@/lib/layout/charts'
import { cn } from '@/lib/utils'

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

  const { metrics, wallet, allocation, chartData, loading, error, reload } = useDashboardCore(
    selectedPeriod as PortfolioChartPeriod
  )

  const onWalletUpdate = useCallback(() => {
    void reload()
  }, [reload])

  useUserWalletRealtime({
    userId: user.id,
    enabled: Boolean(user.id),
    onUpdate: onWalletUpdate,
  })

  const [todayLabel, setTodayLabel] = useState<string | null>(null)

  useEffect(() => {
    setTodayLabel(formatDate(new Date().toISOString()))
  }, [])

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <header
        className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between', pageHeaderGapClass)}
      >
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t('welcome', { name: user.name.split(' ')[0] })}
          </h1>
          <p className={cn('mt-1', dashboardMutedTextClass)}>{t('overviewSubtitle')}</p>
        </div>
        <div
          className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm"
          aria-label={todayLabel ?? undefined}
        >
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <time
            className="text-sm font-medium text-foreground"
            dateTime={todayLabel ? new Date().toISOString().slice(0, 10) : undefined}
            suppressHydrationWarning
          >
            {todayLabel ?? '—'}
          </time>
        </div>
      </header>

      <section aria-labelledby="dashboard-kpi-heading">
        <h2 id="dashboard-kpi-heading" className="sr-only">
          {t('overviewSubtitle')}
        </h2>
        <AsyncState
          loading={loading}
          error={error}
          onRetry={reload}
          skeleton={<MetricCardsSkeleton count={5} />}
        >
          <InvestorKpiCards variant="dashboard" metrics={metrics} wallet={wallet} />
        </AsyncState>
      </section>

      <section
        aria-labelledby="dashboard-charts-heading"
        className={cn('grid grid-cols-1 lg:grid-cols-3', gridGapClass)}
      >
        <h2 id="dashboard-charts-heading" className="sr-only">
          {t('portfolioPerformance')}
        </h2>

        <div className={cn(dashboardCardClass, 'min-w-0 lg:col-span-2')}>
          <DashboardSectionHeader
            title={t('portfolioPerformance')}
            action={
              <CustomSelect
                value={selectedPeriod}
                onValueChange={(value) => setSelectedPeriod(value as keyof typeof PERIOD_KEYS)}
                size="sm"
                className="min-w-0 w-auto"
                triggerClassName="border-0 bg-transparent px-1 shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 text-muted-foreground font-medium"
                options={periodOptions}
                placeholder={t('period')}
              />
            }
            className="mb-0"
          />
          <div className="mt-4 min-w-0 overflow-hidden">
            <AsyncState
              loading={loading}
              error={error}
              onRetry={reload}
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
        </div>

        <div className={cn(dashboardCardClass, 'min-w-0')}>
          <DashboardSectionHeader
            title={t('assetAllocation')}
            action={
              <Link
                href="/portfolio"
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                {t('viewAll')}
              </Link>
            }
            className="mb-0"
          />
          <div className="mt-4 min-w-0">
            <AsyncState
              loading={loading}
              error={error}
              onRetry={reload}
              isEmpty={!allocation?.length}
              emptyTitle={t('noAllocationTitle')}
              emptyDescription={t('noAllocationDesc')}
              emptyAction={
                <Link href="/invest" className="text-sm font-semibold text-primary hover:underline">
                  {t('startInvesting')}
                </Link>
              }
              skeleton={
                <div className="space-y-4">
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
                <ul className="mt-4 space-y-2" aria-label={t('assetAllocation')}>
                  {allocation?.map((asset) => (
                    <li key={asset.name} className="flex items-center justify-between text-xs">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: asset.color }}
                          aria-hidden
                        />
                        <span className="truncate text-muted-foreground">{asset.name}</span>
                      </div>
                      <span className="shrink-0 font-semibold text-foreground">{asset.value}%</span>
                    </li>
                  ))}
                </ul>
              </>
            </AsyncState>
          </div>
        </div>
      </section>

      <DashboardQuickActions />

      <section
        aria-labelledby="dashboard-activity-heading"
        className={cn('grid grid-cols-1 items-start xl:grid-cols-3', gridGapClass)}
      >
        <h2 id="dashboard-activity-heading" className="sr-only">
          {t('recentTransactions')}
        </h2>

        <div className="min-w-0 space-y-6 xl:col-span-2">
          <DashboardPlansCarousel />
          <DashboardRecentTransactions />
        </div>

        <div className="min-w-0 self-start">
          <DashboardMarketSection />
        </div>
      </section>

      <section aria-labelledby="dashboard-rewards-heading">
        <h2 id="dashboard-rewards-heading" className="sr-only">
          {t('rewardsProgress')}
        </h2>
        <DashboardSecondarySectionsDeferred />
      </section>
    </div>
  )
}
