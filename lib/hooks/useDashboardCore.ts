'use client'

import { useCallback, useMemo } from 'react'
import { buildPortfolioChartData, type PortfolioChartPeriod } from '@/lib/data/portfolio-performance'
import { fetchDashboardCoreData } from '@/lib/data/queries'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import { useAsyncData } from '@/lib/hooks/useAsyncData'

const CACHE_OPTS = { cacheTtlMs: 30_000 } as const

export function useDashboardCore(chartPeriod: PortfolioChartPeriod = 'This Year') {
  const { data, loading, error, reload } = useAsyncData(() => fetchDashboardCoreData(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: CACHE_KEYS.dashboardCore,
  })

  const chartData = useMemo(() => {
    if (!data) return []
    return buildPortfolioChartData({
      transactions: data.transactions,
      investments: data.investments,
      currentValue: data.portfolioCurrentValue,
      period: chartPeriod,
    })
  }, [data, chartPeriod])

  const reloadCore = useCallback((opts?: { silent?: boolean }) => {
    void reload(opts)
  }, [reload])

  return {
    metrics: data?.metrics,
    investmentStats: data?.investmentStats,
    wallet: data?.wallet,
    allocation: data?.allocation,
    chartData,
    loading,
    error,
    reload: reloadCore,
  }
}
