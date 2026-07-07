'use client'

import { m } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketFilter } from '@/lib/market/asset-metadata'

const FILTERS: { id: MarketFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'indices', label: 'Indices' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'favorites', label: 'Favorites' },
]

type MarketSearchBarProps = {
  query: string
  filter: MarketFilter
  onQueryChange: (value: string) => void
  onFilterChange: (value: MarketFilter) => void
  resultCount: number
}

export default function MarketSearchBar({
  query,
  filter,
  onQueryChange,
  onFilterChange,
  resultCount,
}: MarketSearchBarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search ticker, coin, forex pair, or commodity…"
          className="w-full rounded-2xl border border-border/70 bg-white/70 py-3.5 pl-11 pr-4 text-sm shadow-sm backdrop-blur-md transition-shadow placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          aria-label="Search markets"
        />
        {query ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-primary">
            {resultCount} found
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        {FILTERS.map((item) => {
          const active = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'border border-border/70 bg-white/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary/15 px-0.5 text-primary">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}
