'use client'

import { m } from 'framer-motion'
import { Star } from 'lucide-react'
import MarketAssetLogo from '@/components/market-insights/MarketAssetLogo'
import MarketSparkline from '@/components/market-insights/MarketSparkline'
import type { EnrichedMarketItem } from '@/lib/market/asset-metadata'
import { cn } from '@/lib/utils'

type MarketWatchlistPanelProps = {
  markets: EnrichedMarketItem[]
  favorites: Set<string>
  onToggle: (id: string) => void
}

export default function MarketWatchlistPanel({
  markets,
  favorites,
  onToggle,
}: MarketWatchlistPanelProps) {
  const watchlist = markets.filter((item) => favorites.has(item.id))

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">Watchlist</h2>
          <p className="text-[11px] text-muted-foreground">Your favorite assets</p>
        </div>
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      </div>

      {watchlist.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
          <Star className="h-8 w-8 text-amber-300" />
          <p className="mt-3 text-sm font-semibold text-foreground">No favorites yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap the star on any asset card to add it to your watchlist.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {watchlist.map((item, index) => {
            const up = item.trend === 'up'
            return (
              <m.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white/80 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <MarketAssetLogo symbol={item.symbol} name={item.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{item.symbol}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{item.price}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <MarketSparkline up={up} className="w-12" animated={false} />
                  <span
                    className={cn(
                      'min-w-[3rem] text-right text-xs font-bold',
                      up ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {item.change}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className="text-amber-500"
                    aria-label={`Remove ${item.symbol} from watchlist`}
                  >
                    ★
                  </button>
                </div>
              </m.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
