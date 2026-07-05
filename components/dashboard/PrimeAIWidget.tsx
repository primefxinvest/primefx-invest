'use client'

import { memo, useCallback, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  BarChart3,
  Bell,
  Brain,
  Check,
  Lightbulb,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const FEATURE_CONFIG = [
  { key: 'recommendations', icon: Brain },
  { key: 'health', icon: BarChart3 },
  { key: 'market', icon: TrendingUp },
  { key: 'risk', icon: Shield },
  { key: 'alerts', icon: Bell },
  { key: 'suggestions', icon: Lightbulb },
] as const

const ACTION_KEYS = ['analyzePortfolio', 'bestPlan', 'marketOpportunities', 'riskScore'] as const

const ACTION_QUERIES: Record<(typeof ACTION_KEYS)[number], string> = {
  analyzePortfolio: 'Analyze my portfolio',
  bestPlan: 'What is the best investment plan for me?',
  marketOpportunities: 'What market opportunities should I consider today?',
  riskScore: 'What is my portfolio risk score?',
}

function PrimeAIWidgetInner({ className }: { className?: string }) {
  const t = useTranslations('dashboard.primeAI')
  const router = useRouter()
  const [query, setQuery] = useState('')

  const openChat = useCallback(
    (message?: string) => {
      router.push(message ? `/primeai?q=${encodeURIComponent(message)}` : '/primeai')
    },
    [router]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        openChat(query.trim())
        setQuery('')
      }
    },
    [openChat, query]
  )

  const insights = t.raw('insights') as string[]

  return (
    <section
      aria-labelledby="dashboard-primeai-heading"
      className={cn(dashboardCardClass, 'flex h-full min-w-0 flex-col', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-md shadow-[#0052ff]/20">
            <Sparkles className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="dashboard-primeai-heading" className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                {t('title')}
              </h2>
              <span className="rounded-md bg-[#0052ff]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0052ff]">
                {t('beta')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {FEATURE_CONFIG.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-2.5 py-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-[10px] font-medium leading-snug text-foreground line-clamp-2">
              {t(`features.${key}`)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {t('insightsTitle')}
        </p>
        <ul className="mt-2 space-y-1.5" aria-label={t('insightsTitle')}>
          {insights.map((insight) => (
            <li key={insight} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto shrink-0 pt-4">
      <div className="grid grid-cols-2 gap-2">
        {ACTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => openChat(ACTION_QUERIES[key])}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-border bg-background px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t(`actions.${key}`)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => openChat()}
        className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        {t('actions.askPrimeAI')}
      </button>

      <form
        onSubmit={handleSubmit}
        className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 transition-colors focus-within:border-primary/30 focus-within:bg-background"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={t('sendMessage')}
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>

      <Link
        href="/primeai"
        className="mt-2 block text-center text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        {t('openFullChat')} →
      </Link>
      </div>
    </section>
  )
}

const PrimeAIWidget = memo(PrimeAIWidgetInner)
export default PrimeAIWidget
