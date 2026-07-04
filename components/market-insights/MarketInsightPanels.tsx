'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRight, Minus, Star, TrendingDown, TrendingUp } from 'lucide-react'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'
import type { MarketItem } from '@/lib/data/types'

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === 'bullish') {
    return <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
  }
  if (sentiment === 'bearish') {
    return <TrendingDown className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
  }
  return <Minus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
}

interface MarketInsightArticle {
  id: string
  title: string
  summary: string
  tag: string
  sentiment: string
}

interface MarketWatchlistProps {
  markets: MarketItem[]
}

export function MarketWatchlist({ markets }: MarketWatchlistProps) {
  const watchlist = markets.slice(0, 4)

  return (
    <div className={cn(dashboardCardClass, 'flex h-full flex-col')}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={dashboardSectionTitleClass}>Watchlist</h2>
        <Star className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      </div>

      {watchlist.length === 0 ? (
        <p className="mt-4 flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
          Add assets from market overview to track them here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {watchlist.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-[10px] font-bold">
                  {item.icon}
                </span>
                <span className="text-xs font-semibold text-foreground">{item.symbol}</span>
              </div>
              <span
                className={cn(
                  'text-xs font-bold',
                  item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {item.change}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface AiMarketInsightsProps {
  insights: MarketInsightArticle[]
  askPrimeAiLabel: string
}

export function AiMarketInsights({ insights, askPrimeAiLabel }: AiMarketInsightsProps) {
  const featured = insights.slice(0, 3)

  return (
    <div className={cn(dashboardCardClass, 'flex h-full flex-col')}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={dashboardSectionTitleClass}>AI Market Insights</h2>
        <Link
          href="/primeai?q=Give%20me%20today%27s%20market%20outlook"
          className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
        >
          {askPrimeAiLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {featured.length === 0 ? (
        <p className="mt-4 flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
          AI insights will appear when market analysis is available.
        </p>
      ) : (
        <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {featured.map((insight, index) => (
            <li
              key={insight.id}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      {insight.tag}
                    </span>
                    {index === 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                    {insight.title}
                  </p>
                </div>
                <SentimentIcon sentiment={insight.sentiment} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
