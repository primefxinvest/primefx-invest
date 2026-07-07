'use client'

import { m } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import MarketAssetLogo from '@/components/market-insights/MarketAssetLogo'
import MarketSparkline from '@/components/market-insights/MarketSparkline'
import type { EnrichedMarketItem } from '@/lib/market/asset-metadata'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

type MarketMoverCardProps = {
  market: EnrichedMarketItem
  variant: 'gainer' | 'loser'
  index?: number
}

export default function MarketMoverCard({ market, variant, index = 0 }: MarketMoverCardProps) {
  const reduced = useReducedMotion()
  const up = variant === 'gainer'

  return (
    <m.div
      initial={reduced ? false : { opacity: 0, x: up ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={reduced ? undefined : { y: -3, scale: 1.02 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-3.5 backdrop-blur-xl',
        up
          ? 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-white/80 shadow-lg shadow-emerald-500/10'
          : 'border-red-200/70 bg-gradient-to-br from-red-50/90 to-white/80 shadow-lg shadow-red-500/10'
      )}
      style={{ willChange: 'transform' }}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl',
          up ? 'bg-emerald-400/25' : 'bg-red-400/25'
        )}
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <MarketAssetLogo symbol={market.symbol} name={market.name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-foreground">{market.symbol}</p>
            <p className="truncate text-[10px] text-muted-foreground">{market.price}</p>
          </div>
        </div>
        <m.div
          animate={reduced ? undefined : { y: up ? [0, -2, 0] : [0, 2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            up ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          )}
        >
          {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </m.div>
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-2">
        <MarketSparkline up={up} className="max-w-[5.5rem]" />
        <span
          className={cn(
            'text-sm font-bold',
            up ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {market.change}
        </span>
      </div>
    </m.div>
  )
}
