'use client'

import { Link } from '@/i18n/navigation'
import { m } from 'framer-motion'
import { ArrowRight, Bot, Minus, Shield, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

type AiAnalysis = {
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  risk: string
  opportunity: number
  summary: string
}

type MarketAiAnalysisPanelProps = {
  analysis: AiAnalysis
  askPrimeAiLabel: string
}

function SentimentBadge({ sentiment }: { sentiment: AiAnalysis['sentiment'] }) {
  if (sentiment === 'bullish') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <TrendingUp className="h-3.5 w-3.5" /> Bullish
      </span>
    )
  }
  if (sentiment === 'bearish') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
        <TrendingDown className="h-3.5 w-3.5" /> Bearish
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
      <Minus className="h-3.5 w-3.5" /> Neutral
    </span>
  )
}

export default function MarketAiAnalysisPanel({
  analysis,
  askPrimeAiLabel,
}: MarketAiAnalysisPanelProps) {
  const reduced = useReducedMotion()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/80 via-white/80 to-blue-50/70 p-5 shadow-xl shadow-purple-500/10 backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-purple-600 text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-foreground">PrimeAI Market Analysis</h2>
              <p className="text-[11px] text-muted-foreground">Institutional-grade intelligence</p>
            </div>
          </div>
        </div>
        <Link
          href="/primeai?q=Give%20me%20today%27s%20market%20outlook"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
        >
          {askPrimeAiLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="relative mt-5 flex items-center gap-4">
        <m.div
          className="relative flex h-16 w-16 items-center justify-center"
          animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <m.div
            className="absolute inset-0 rounded-full border-2 border-purple-300/50"
            animate={reduced ? undefined : { scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0052ff] to-purple-600 shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </m.div>
        <div className="min-w-0 flex-1">
          <SentimentBadge sentiment={analysis.sentiment} />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        {[
          { label: 'Confidence', value: `${analysis.confidence}%`, icon: Target, tone: 'text-[#0052ff]' },
          { label: 'Risk Level', value: analysis.risk, icon: Shield, tone: 'text-orange-600' },
          { label: 'Opportunity', value: `${analysis.opportunity}/100`, icon: TrendingUp, tone: 'text-emerald-600' },
          { label: 'Signal', value: analysis.sentiment, icon: Sparkles, tone: 'text-purple-600' },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn('h-3.5 w-3.5', metric.tone)} />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </p>
              </div>
              <p className="mt-1 text-sm font-bold capitalize text-foreground">{metric.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
