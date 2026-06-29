'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { ChartCardSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchMarketOverview } from '@/lib/data/queries'
import MarketOverviewWidget from '@/components/dashboard/MarketOverviewWidget'
import { InvestorPageGate } from '@/components/investor/InvestorPageGate'

const insights = [
  {
    title: 'Bitcoin breaks resistance',
    summary: 'BTC/USDT cleared $67,500 with rising volume. Momentum indicators remain bullish on the daily chart.',
    tag: 'Crypto',
    sentiment: 'bullish' as const,
  },
  {
    title: 'EUR/USD consolidates',
    summary: 'Euro trades in a tight range ahead of ECB commentary. Short-term volatility expected.',
    tag: 'Forex',
    sentiment: 'neutral' as const,
  },
  {
    title: 'Gold holds safe-haven bid',
    summary: 'Precious metals remain supported as investors seek diversification amid macro uncertainty.',
    tag: 'Commodities',
    sentiment: 'bullish' as const,
  },
]

export default function MarketInsightsPage() {
  const { data: marketOverview = [], loading, error, reload } = useAsyncData(
    () => fetchMarketOverview(),
    []
  )

  return (
    <InvestorPageGate feature="market_insights" route="/market-insights">
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Insights</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time market intelligence and AI-curated opportunities.
          </p>
        </div>
        <Link
          href="/primeai?q=Give%20me%20today%27s%20market%20outlook"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Ask PrimeAI
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          {insights.map((insight) => (
            <article
              key={insight.title}
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
                ) : (
                  <TrendingDown className="h-5 w-5 shrink-0 text-orange-500" />
                )}
              </div>
            </article>
          ))}
        </div>

        <AsyncState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={!marketOverview.length}
          emptyTitle="No market data"
          emptyDescription="Run the market_assets migration in Supabase to populate live prices."
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
