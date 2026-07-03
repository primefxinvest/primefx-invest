'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { AsyncState } from '@/components/shared/data-state'
import { ChartCardSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchMarketInsightArticles, fetchMarketOverview } from '@/lib/data/queries'
import MarketOverviewWidget from '@/components/dashboard/MarketOverviewWidget'
import { InvestorPageGate } from '@/components/investor/InvestorPageGate'
import type { AppLocale } from '@/i18n/routing'

export default function MarketInsightsPage() {
  const t = useTranslations('marketInsightsPage')
  const locale = useLocale() as AppLocale

  const { data: marketOverview = [], loading, error, reload } = useAsyncData(
    () => fetchMarketOverview(),
    []
  )
  const {
    data: insights = [],
    loading: insightsLoading,
    error: insightsError,
    reload: reloadInsights,
  } = useAsyncData(() => fetchMarketInsightArticles(locale), [locale])

  return (
    <InvestorPageGate feature="market_insights" route="/market-insights">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
          </div>
          <Link
            href="/primeai?q=Give%20me%20today%27s%20market%20outlook"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t('askPrimeAi')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <AsyncState
              loading={insightsLoading}
              error={insightsError}
              onRetry={reloadInsights}
              isEmpty={!insights.length}
              emptyTitle={t('emptyTitle')}
              emptyDescription={t('emptyDescription')}
              skeleton={<ChartCardSkeleton height="h-32" />}
            >
              {insights.map((insight) => (
                <article
                  key={insight.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                        {insight.tag}
                      </span>
                      <h2 className="mt-2 text-base font-semibold text-gray-900">{insight.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{insight.summary}</p>
                    </div>
                    {insight.sentiment === 'bullish' ? (
                      <TrendingUp className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : insight.sentiment === 'bearish' ? (
                      <TrendingDown className="h-5 w-5 shrink-0 text-red-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 shrink-0 text-orange-500" />
                    )}
                  </div>
                </article>
              ))}
            </AsyncState>
          </div>

          <AsyncState
            loading={loading}
            error={error}
            onRetry={reload}
            isEmpty={!marketOverview.length}
            emptyTitle={t('noMarketData')}
            emptyDescription={t('noMarketDataDescription')}
            skeleton={<ChartCardSkeleton height="h-48" />}
            compact
          >
            <MarketOverviewWidget markets={marketOverview} />
          </AsyncState>
        </div>
      </div>
    </InvestorPageGate>
  )
}
