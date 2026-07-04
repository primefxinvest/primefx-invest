'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { AsyncState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { ChartCardSkeleton } from '@/components/shared/skeletons'
import { pageStackClass, gridGapClass, sectionStackClass } from '@/lib/layout/spacing'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchMarketInsightArticles, fetchMarketOverview } from '@/lib/data/queries'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import MarketOverviewWidget from '@/components/dashboard/MarketOverviewWidget'
import { InvestorPageGate } from '@/components/investor/InvestorPageGate'
import MarketAssetList from '@/components/market-insights/MarketAssetList'
import MarketSentimentIndex from '@/components/market-insights/MarketSentimentIndex'
import { AiMarketInsights, MarketWatchlist } from '@/components/market-insights/MarketInsightPanels'
import {
  computeMarketSentiment,
  filterByCategory,
  sortByChange,
} from '@/lib/market/categories'
import type { AppLocale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export default function MarketInsightsPage() {
  const t = useTranslations('marketInsightsPage')
  const locale = useLocale() as AppLocale

  const { data: marketOverview = [], loading, error, reload } = useAsyncData(
    () => fetchMarketOverview(),
    [],
    undefined,
    { cacheKey: CACHE_KEYS.marketOverview, cacheTtlMs: 30_000 }
  )
  const {
    data: insights = [],
    loading: insightsLoading,
    error: insightsError,
    reload: reloadInsights,
  } = useAsyncData(() => fetchMarketInsightArticles(locale), [locale])

  const trending = useMemo(() => sortByChange(marketOverview, 'desc').slice(0, 5), [marketOverview])
  const topGainers = useMemo(
    () => marketOverview.filter((m) => m.trend === 'up').slice(0, 4),
    [marketOverview]
  )
  const topLosers = useMemo(
    () =>
      [...marketOverview]
        .filter((m) => m.trend === 'down')
        .sort((a, b) => {
          const parse = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, '')) || 0
          return parse(a.change) - parse(b.change)
        })
        .slice(0, 4),
    [marketOverview]
  )
  const forexMarkets = useMemo(() => filterByCategory(marketOverview, 'forex'), [marketOverview])
  const cryptoMarkets = useMemo(() => filterByCategory(marketOverview, 'crypto'), [marketOverview])
  const commodityMarkets = useMemo(
    () => filterByCategory(marketOverview, 'commodities'),
    [marketOverview]
  )
  const sentiment = useMemo(() => computeMarketSentiment(marketOverview), [marketOverview])

  return (
    <InvestorPageGate feature="market_insights" route="/market-insights">
      <div className={cn('min-w-0', pageStackClass)}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t('title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <Link
            href="/primeai?q=Give%20me%20today%27s%20market%20outlook"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-95"
          >
            {t('askPrimeAi')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        {/* 1. Market Overview */}
        <section aria-label="Market overview" className={sectionStackClass}>
          <SectionHeading>Market Overview</SectionHeading>
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

        {/* Mobile swipeable market strips */}
        <section
          aria-label="Market movers"
          className={cn('-mx-4 sm:mx-0 lg:hidden', sectionStackClass)}
        >
          <SectionHeading className="px-4 sm:px-0">Trending &amp; Movers</SectionHeading>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:px-0">
            <div className="w-[85vw] shrink-0 snap-center sm:w-72">
              <MarketAssetList title="Trending Assets" markets={trending} compact />
            </div>
            <div className="w-[85vw] shrink-0 snap-center sm:w-72">
              <MarketAssetList title="Top Gainers" markets={topGainers} compact />
            </div>
            <div className="w-[85vw] shrink-0 snap-center sm:w-72">
              <MarketAssetList title="Top Losers" markets={topLosers} compact />
            </div>
          </div>
        </section>

        {/* Desktop multi-column layout */}
        <section
          aria-label="Market intelligence"
          className={cn('hidden lg:grid lg:grid-cols-12', gridGapClass)}
        >
          <div className="lg:col-span-4">
            <MarketAssetList title="Trending Assets" markets={trending} />
          </div>
          <div className="lg:col-span-4">
            <MarketAssetList title="Top Gainers" markets={topGainers} />
          </div>
          <div className="lg:col-span-4">
            <MarketAssetList title="Top Losers" markets={topLosers} />
          </div>
        </section>

        {/* Asset class panels */}
        <section
          aria-label="Asset classes"
          className={cn('grid grid-cols-1 md:grid-cols-3', gridGapClass)}
        >
          <MarketAssetList
            title="Forex Market"
            markets={forexMarkets}
            emptyMessage="No forex pairs available"
          />
          <MarketAssetList
            title="Crypto Market"
            markets={cryptoMarkets}
            emptyMessage="No crypto assets available"
          />
          <MarketAssetList
            title="Commodities"
            markets={commodityMarkets}
            emptyMessage="No commodities available"
          />
        </section>

        {/* AI Insights + Watchlist + Sentiment */}
        <section
          aria-label="Intelligence panels"
          className={cn('grid grid-cols-1 lg:grid-cols-3', gridGapClass)}
        >
          <AsyncState
            loading={insightsLoading}
            error={insightsError}
            onRetry={reloadInsights}
            isEmpty={false}
            skeleton={<ChartCardSkeleton height="h-64" />}
            compact
          >
            <AiMarketInsights insights={insights} askPrimeAiLabel={t('askPrimeAi')} />
          </AsyncState>
          <MarketWatchlist markets={marketOverview} />
          <MarketSentimentIndex
            score={sentiment.score}
            label={sentiment.label}
            bullish={sentiment.bullish}
            bearish={sentiment.bearish}
          />
        </section>

        {/* Full analysis articles */}
        <section aria-label="Market analysis" className={sectionStackClass}>
          <SectionHeading>Latest Analysis</SectionHeading>
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
            <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-2', gridGapClass)}>
              {insights.map((insight, index) => (
                <article key={insight.id} className={dashboardCardClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {insight.tag}
                    </span>
                    {index === 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
                    {insight.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {insight.summary}
                  </p>
                </article>
              ))}
            </div>
          </AsyncState>
        </section>
      </div>
    </InvestorPageGate>
  )
}
