'use client'

import { m } from 'framer-motion'
import { Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

interface MarketSentimentIndexProps {
  score: number
  label: string
  bullish: number
  bearish: number
}

export default function MarketSentimentIndex({
  score,
  label,
  bullish,
  bearish,
}: MarketSentimentIndexProps) {
  const reduced = useReducedMotion()
  const rotation = -90 + (score / 100) * 180

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">Market Sentiment</h2>
          <p className="text-[11px] text-muted-foreground">Fear &amp; greed pulse</p>
        </div>
        <Gauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <div className="relative h-28 w-48 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-28 w-48 rounded-t-full bg-gradient-to-r from-red-200 via-amber-100 to-emerald-200" />
          <m.div
            className="absolute bottom-0 left-1/2 h-24 w-1 origin-bottom rounded-full bg-foreground/80"
            style={{ x: '-50%' }}
            animate={{ rotate: rotation }}
            transition={{ duration: reduced ? 0 : 0.8, ease: [0.32, 0.72, 0, 1] }}
          />
          <div className="absolute inset-x-5 bottom-0 mx-auto h-20 w-[9.5rem] rounded-t-full bg-white/90 backdrop-blur-sm" />
        </div>
        <m.p
          key={score}
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-2 text-3xl font-bold text-foreground"
        >
          {score}
        </m.p>
        <p className={cn('text-sm font-semibold', score >= 60 ? 'text-emerald-600' : score <= 40 ? 'text-red-600' : 'text-primary')}>
          {label}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
        <div className="rounded-xl bg-emerald-50/80 px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Bullish</p>
          <p className="text-xl font-bold text-emerald-600">{bullish}</p>
        </div>
        <div className="rounded-xl bg-red-50/80 px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">Bearish</p>
          <p className="text-xl font-bold text-red-600">{bearish}</p>
        </div>
      </div>
    </div>
  )
}
