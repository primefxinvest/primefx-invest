'use client'

import { m } from 'framer-motion'
import { Activity, TrendingDown, TrendingUp } from 'lucide-react'
import MarketAssetLogo from '@/components/market-insights/MarketAssetLogo'
import MarketSparkline from '@/components/market-insights/MarketSparkline'
import { highlightMatch } from '@/components/market-insights/MarketSearchBar'
import type { EnrichedMarketItem } from '@/lib/market/asset-metadata'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

type MarketAssetCardProps = {
  market: EnrichedMarketItem
  query?: string
  index?: number
  onToggleFavorite?: (id: string) => void
  isFavorite?: boolean
}

export default function MarketAssetCard({
  market,
  query = '',
  index = 0,
  onToggleFavorite,
  isFavorite = false,
}: MarketAssetCardProps) {
  const reduced = useReducedMotion()
  const up = market.trend === 'up'

  return (
    <m.article
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={reduced ? undefined : { y: -4, scale: 1.01 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-shadow hover:shadow-xl',
        up ? 'hover:shadow-emerald-500/10' : 'hover:shadow-red-500/10'
      )}
      style={{ willChange: 'transform' }}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent'
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl',
          up ? 'bg-emerald-400/15' : 'bg-red-400/15'
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MarketAssetLogo symbol={market.symbol} name={market.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {highlightMatch(market.name, query)}
            </p>
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {highlightMatch(market.symbol, query)}
            </p>
          </div>
        </div>

        {onToggleFavorite ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(market.id)}
            className={cn(
              'rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
              isFavorite
                ? 'bg-amber-50 text-amber-600'
                : 'bg-muted/60 text-muted-foreground hover:text-amber-600'
            )}
            aria-label={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        ) : null}
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Current Price
          </p>
          <m.p
            key={market.price}
            initial={reduced ? false : { opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold tracking-tight text-foreground"
          >
            {market.price}
          </m.p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
            up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          )}
        >
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {market.change}
        </div>
      </div>

      <div className="relative mt-3">
        <MarketSparkline up={up} />
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl bg-muted/40 px-2.5 py-2">
          <p className="text-muted-foreground">24H High</p>
          <p className="font-semibold text-foreground">{market.high24h}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-2.5 py-2">
          <p className="text-muted-foreground">24H Low</p>
          <p className="font-semibold text-foreground">{market.low24h}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-2.5 py-2">
          <p className="text-muted-foreground">Volume</p>
          <p className="font-semibold text-foreground">{market.volume}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-2.5 py-2">
          <p className="text-muted-foreground">Market Cap</p>
          <p className="font-semibold text-foreground">{market.marketCap ?? '—'}</p>
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
            market.marketStatus === 'open'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              market.marketStatus === 'open' ? 'bg-emerald-500' : 'bg-slate-400'
            )}
          />
          {market.marketStatus === 'open' ? 'Market Open' : 'Market Closed'}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
            market.volatility === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
          )}
        >
          <Activity className="h-3 w-3" />
          {market.volatility === 'high' ? 'High Volatility' : 'Low Volatility'}
        </span>
      </div>
    </m.article>
  )
}
