'use client'

import { m } from 'framer-motion'
import { Flame, Eye, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react'
import MarketMoverCard from '@/components/market-insights/MarketMoverCard'
import type { EnrichedMarketItem } from '@/lib/market/asset-metadata'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

const TABS = [
  { id: 'hot', label: 'Hot', icon: Flame },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'viewed', label: 'Most Viewed', icon: Eye },
  { id: 'bought', label: 'Most Bought', icon: ShoppingCart },
  { id: 'ai', label: 'AI Recommended', icon: Sparkles },
] as const

type TrendingTab = (typeof TABS)[number]['id']

type MarketTrendingSectionProps = {
  markets: EnrichedMarketItem[]
  activeTab: TrendingTab
  onTabChange: (tab: TrendingTab) => void
}

function pickForTab(markets: EnrichedMarketItem[], tab: TrendingTab): EnrichedMarketItem[] {
  const sorted = [...markets].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
  switch (tab) {
    case 'hot':
      return sorted.filter((m) => m.volatility === 'high').slice(0, 4)
    case 'trending':
      return sorted.slice(0, 4)
    case 'viewed':
      return [...markets].sort((a, b) => b.priceValue - a.priceValue).slice(0, 4)
    case 'bought':
      return [...markets].sort((a, b) => a.symbol.localeCompare(b.symbol)).slice(0, 4)
    case 'ai':
      return markets.filter((m) => m.trend === 'up').slice(0, 4)
    default:
      return sorted.slice(0, 4)
  }
}

export default function MarketTrendingSection({
  markets,
  activeTab,
  onTabChange,
}: MarketTrendingSectionProps) {
  const reduced = useReducedMotion()
  const items = pickForTab(markets, activeTab)

  return (
    <section aria-label="Trending markets" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-foreground">Trending</h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          Live
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                active
                  ? 'bg-foreground text-background shadow-md'
                  : 'border border-border/70 bg-white/70 text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No trending assets in this category yet.
        </p>
      ) : (
        <m.div
          key={activeTab}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {items.map((market, index) => (
            <MarketMoverCard
              key={market.id}
              market={market}
              variant={market.trend === 'up' ? 'gainer' : 'loser'}
              index={index}
            />
          ))}
        </m.div>
      )}
    </section>
  )
}

export type { TrendingTab }
