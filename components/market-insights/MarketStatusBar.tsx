'use client'

import { m } from 'framer-motion'
import { Activity, Globe2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnrichedMarketItem } from '@/lib/market/asset-metadata'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

type MarketStatusBarProps = {
  markets: EnrichedMarketItem[]
}

export default function MarketStatusBar({ markets }: MarketStatusBarProps) {
  const reduced = useReducedMotion()
  const openCount = markets.filter((m) => m.marketStatus === 'open').length
  const highVol = markets.filter((m) => m.volatility === 'high').length
  const globalStatus = openCount >= markets.length / 2 ? 'open' : 'closed'

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md"
    >
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
        <Globe2 className="h-4 w-4 text-primary" />
        Global Markets
      </span>

      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
          globalStatus === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
        )}
      >
        <m.span
          className={cn(
            'h-2 w-2 rounded-full',
            globalStatus === 'open' ? 'bg-emerald-500' : 'bg-slate-400'
          )}
          animate={reduced || globalStatus !== 'open' ? undefined : { opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {globalStatus === 'open' ? 'Markets Open' : 'Markets Closed'}
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
        <Activity className="h-3 w-3" />
        {highVol > 0 ? 'High Volatility' : 'Low Volatility'}
      </span>

      <span className="ml-auto text-[11px] text-muted-foreground">
        Tracking {markets.length} assets · {openCount} live
      </span>
    </m.div>
  )
}
