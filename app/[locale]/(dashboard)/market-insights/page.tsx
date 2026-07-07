'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { m } from 'framer-motion'
import { AsyncState } from '@/components/shared/data-state'
import { ChartCardSkeleton } from '@/components/shared/skeletons'
import { pageStackClass, gridGapClass, sectionStackClass } from '@/lib/layout/spacing'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchMarketInsightArticles, fetchMarketOverview } from '@/lib/data/queries'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import MarketAssetCard from '@/components/market-insights/MarketAssetCard'
import MarketMoverCard from '@/components/market-insights/MarketMoverCard'
import MarketSearchBar from '@/components/market-insights/MarketSearchBar'
import MarketStatusBar from '@/components/market-insights/MarketStatusBar'
import MarketTrendingSection, {
  type TrendingTab,
} from '@/components/market-insights/MarketTrendingSection'
import MarketAiAnalysisPanel from '@/components/market-insights/MarketAiAnalysisPanel'
import MarketWatchlistPanel from '@/components/market-insights/MarketWatchlistPanel'
import MarketSentimentIndex from '@/components/market-insights/MarketSentimentIndex'
import MarketEmptyState from '@/components/market-insights/MarketEmptyState'
import {
  computeAiAnalysis,
  enrichMarketItems,
  filterMarkets,
  type MarketFilter,
} from '@/lib/market/asset-metadata'
import { useMarketWatchlist } from '@/lib/market/watchlist'
import { computeMarketSentiment } from '@/lib/market/categories'
import type { AppLocale } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { dashboardCardClass } from '@/lib/layout/surfaces'

export default function MarketInsightsPage() {
  const t = useTranslations('marketInsightsPage')
  const locale = useLocale() as AppLocale
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MarketFilter>('all')
  const [trendingTab, setTrendingTab] = useState<TrendingTab>('trending')
  const { favorites, toggle, isFavorite, ready: watchlistReady } = useMarketWatchlist()

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

  const enriched = useMemo(() => enrichMarketItems(marketOverview), [marketOverview])
  const filtered = useMemo(
    () => filterMarkets(enriched, query, filter, favorites),
    [enriched, query, filter, favorites]
  )

  const topGainers = useMemo(
    () =>
      [...enriched]
        .sort((a, b) => b.changePercent - a.changePercent)
        .filter((m) => m.trend === 'up')
        .slice(0, 4),
    [enriched]
  )
  const topLosers = useMemo(
    () =>
      [...enriched]
        .sort((a, b) => a.changePercent - b.changePercent)
        .filter((m) => m.trend === 'down')
        .slice(0, 4),
    [enriched]
  )
  const sentiment = useMemo(() => computeMarketSentiment(marketOverview), [marketOverview])
  const aiAnalysis = useMemo(() => computeAiAnalysis(enriched), [enriched])

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <m.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 via-blue-50/40 to-white/80 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-xl sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Financial Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t('description')}
            </p>
          </div>
          <Link
            href="/primeai?q=Give%20me%20today%27s%20market%20outlook"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]"
          >
            {t('askPrimeAi')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </m.header>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={false}
        skeleton={
          <div className="space-y-4">
            <ChartCardSkeleton height="h-14" />
            <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3', gridGapClass)}>
              <ChartCardSkeleton height="h-72" />
              <ChartCardSkeleton height="h-72" />
              <ChartCardSkeleton height="h-72" />
            </div>
          </div>
        }
        compact
      >
        {enriched.length > 0 ? <MarketStatusBar markets={enriched} /> : null}

        <MarketSearchBar
          query={query}
          filter={filter}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
          resultCount={filtered.length}
        />

        <section aria-label="Market overview" className={sectionStackClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-tight text-foreground">Market Overview</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} assets</span>
          </div>

          {filtered.length === 0 ? (
            <MarketEmptyState
              title={query || filter === 'favorites' ? 'No matching assets' : t('noMarketData')}
              description={
                filter === 'favorites'
                  ? 'Add assets to your watchlist using the star icon on any market card.'
                  : query
                    ? 'Try a different ticker, pair, or commodity name.'
                    : t('noMarketDataDescription')
              }
            />
          ) : (
            <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3', gridGapClass)}>
              {filtered.map((market, index) => (
                <MarketAssetCard
                  key={market.id}
                  market={market}
                  query={query}
                  index={index}
                  onToggleFavorite={watchlistReady ? toggle : undefined}
                  isFavorite={isFavorite(market.id)}
                />
              ))}
            </div>
          )}
        </section>

        <MarketTrendingSection
          markets={enriched}
          activeTab={trendingTab}
          onTabChange={setTrendingTab}
        />

        <section
          aria-label="Top movers"
          className={cn('grid grid-cols-1 gap-6 xl:grid-cols-2', gridGapClass)}
        >
          <div className="space-y-4">
            <h2 className="text-base font-bold tracking-tight text-emerald-700">Top Gainers</h2>
            {topGainers.length === 0 ? (
              <MarketEmptyState title="No gainers" description="No assets are up right now." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topGainers.map((market, index) => (
                  <MarketMoverCard key={market.id} market={market} variant="gainer" index={index} />
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-base font-bold tracking-tight text-red-700">Top Losers</h2>
            {topLosers.length === 0 ? (
              <MarketEmptyState title="No losers" description="No assets are down right now." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topLosers.map((market, index) => (
                  <MarketMoverCard key={market.id} market={market} variant="loser" index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          aria-label="Intelligence panels"
          className={cn('grid grid-cols-1 lg:grid-cols-3', gridGapClass)}
        >
          <MarketAiAnalysisPanel analysis={aiAnalysis} askPrimeAiLabel={t('askPrimeAi')} />
          <MarketWatchlistPanel
            markets={enriched}
            favorites={favorites}
            onToggle={toggle}
          />
          <MarketSentimentIndex
            score={sentiment.score}
            label={sentiment.label}
            bullish={sentiment.bullish}
            bearish={sentiment.bearish}
          />
        </section>
      </AsyncState>

      <section aria-label="Market analysis" className={sectionStackClass}>
        <h2 className="text-base font-bold tracking-tight text-foreground">Latest Analysis</h2>
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
              <m.article
                key={insight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -2 }}
                className={cn(dashboardCardClass, 'border-white/70 bg-white/75 backdrop-blur-xl')}
              >
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
              </m.article>
            ))}
          </div>
        </AsyncState>
      </section>
    </div>
  )
}
