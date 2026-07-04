'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { AsyncState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { ChartCardSkeleton } from '@/components/shared/skeletons'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchMarketInsightArticles, fetchMarketOverview } from '@/lib/data/queries'
import MarketOverviewWidget from '@/components/dashboard/MarketOverviewWidget'
import { InvestorPageGate } from '@/components/investor/InvestorPageGate'
import type { AppLocale } from '@/i18n/routing'

function SentimentIcon({ sentiment }: { sentiment: string }) {
  const label =
    sentiment === 'bullish' ? 'Bullish' : sentiment === 'bearish' ? 'Bearish' : 'Neutral'

  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {sentiment === 'bullish' ? (
        <TrendingUp className="h-5 w-5 text-emerald-500" aria-hidden="true" />
      ) : sentiment === 'bearish' ? (
        <TrendingDown className="h-5 w-5 text-red-500" aria-hidden="true" />
      ) : (
        <Minus className="h-5 w-5 text-gray-400" aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </span>
  )
}

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
      <div className={pageStackClass}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
          </div>
          <Link
            href="/primeai?q=Give%20me%20today%27s%20market%20outlook"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t('askPrimeAi')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section aria-label="Market overview" className={sectionStackClass}>
          <SectionHeading>Live market summary</SectionHeading>
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
            <MarketOverviewWidget markets={marketOverview} showViewAllLink={false} />
          </AsyncState>
        </section>

        <section aria-label="Market analysis" className={sectionStackClass}>
          <SectionHeading>Latest analysis</SectionHeading>
          <AsyncState
            loading={insightsLoading}
            error={insightsError}
            onRetry={reloadInsights}
            isEmpty={!insights.length}
            emptyTitle={t('emptyTitle')}
            emptyDescription={t('emptyDescription')}
            skeleton={
              <div className="space-y-4">
                <ChartCardSkeleton height="h-32" />
                <ChartCardSkeleton height="h-32" />
              </div>
            }
          >
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <article
                  key={insight.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                          {insight.tag}
                        </span>
                        {index === 0 ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0052ff]">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
                        {insight.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{insight.summary}</p>
                    </div>
                    <SentimentIcon sentiment={insight.sentiment} />
                  </div>
                </article>
              ))}
            </div>
          </AsyncState>
        </section>
      </div>
    </InvestorPageGate>
  )
}
