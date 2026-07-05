'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Wallet } from 'lucide-react'
import { m } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import type { InvestorKpiMetrics, InvestorKpiWallet } from '@/components/shared/kpi/InvestorKpiCards'
import { trendColorFromPercentage } from '@/components/shared/kpi'
import { MOTION_VARIANTS } from '@/lib/motion/tokens'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'

type DashboardPortfolioHeroProps = {
  metrics?: InvestorKpiMetrics | null
  investmentStats?: {
    activeCount?: number
    totalWeeklyEarnings?: string
    totalProfitsEarned?: string
  } | null
  wallet?: InvestorKpiWallet | null
  loading?: boolean
}

function StatCell({
  label,
  value,
  trend,
  trendSuffix,
  emphasis = false,
}: {
  label: string
  value: string
  trend?: string
  trendSuffix?: string
  emphasis?: boolean
}) {
  const trendColor = trendColorFromPercentage(trend)
  return (
    <div className="min-w-0 flex-1 px-2 py-2 first:pl-0 last:pr-0 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <p
        className={cn(
          'font-semibold uppercase tracking-[0.06em] text-slate-400',
          emphasis ? 'text-[10px] sm:text-xs' : 'text-[9px] sm:text-[11px]'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1 truncate font-bold tabular-nums text-white sm:mt-1.5',
          emphasis ? 'text-base font-bold sm:text-lg lg:text-xl' : 'text-xs font-semibold sm:text-base'
        )}
      >
        {value}
      </p>
      {trend ? (
        <p
          className={cn(
            'mt-0.5 text-[10px] font-semibold sm:mt-1 sm:text-xs',
            trendColor === 'green' && 'text-emerald-400',
            trendColor === 'red' && 'text-red-400',
            trendColor === 'muted' && 'text-slate-400'
          )}
        >
          {trend}
          {trendSuffix ? <span className="font-normal text-slate-500"> {trendSuffix}</span> : null}
        </p>
      ) : null}
    </div>
  )
}

function DashboardPortfolioHeroInner({ metrics, investmentStats, wallet, loading }: DashboardPortfolioHeroProps) {
  const t = useTranslations('dashboard')
  const reducedMotion = useReducedMotion()

  if (loading) {
    return (
      <div
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-xl sm:p-5"
        aria-busy="true"
        aria-label={t('portfolioHero')}
      >
        <Skeleton className="h-3 w-24 bg-white/10" />
        <Skeleton className="mt-2.5 h-9 w-48 bg-white/10 sm:mt-4 sm:h-12 sm:w-56" />
        <div className="mt-4 flex gap-2 sm:mt-5 sm:gap-3">
          <Skeleton className="h-10 flex-1 bg-white/10 sm:h-11" />
          <Skeleton className="h-10 flex-1 bg-white/10 sm:h-11" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:mt-6 sm:grid-cols-4 sm:gap-4 sm:pt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 bg-white/10 sm:h-14" />
          ))}
        </div>
      </div>
    )
  }

  const HeroWrapper = reducedMotion ? 'section' : m.section

  return (
    <HeroWrapper
      aria-label={t('portfolioHero')}
      {...(!reducedMotion && {
        initial: 'initial',
        animate: 'animate',
        variants: MOTION_VARIANTS.slideUp,
      })}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 p-4 shadow-xl sm:p-5 lg:p-6"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-3xl sm:-right-16 sm:-top-16 sm:h-48 sm:w-48"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#7c3aed]/15 blur-3xl sm:-bottom-12 sm:-left-12 sm:h-40 sm:w-40"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary sm:h-9 sm:w-9 sm:rounded-xl">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 sm:text-xs">
              {t('currentBalance')}
            </p>
          </div>

          <p className="mt-2 min-w-0 truncate text-3xl font-bold tabular-nums tracking-tight text-white sm:mt-3 sm:text-[2.75rem] lg:text-5xl lg:leading-none">
            {wallet?.availableBalance ?? '$0.00'}
          </p>

          <p className="mt-1.5 text-xs leading-snug text-slate-400 sm:mt-2 sm:text-sm sm:leading-relaxed">
            {t('overviewSubtitle')}
          </p>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            href="/invest"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-[#f97316] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:min-h-11 sm:flex-none sm:rounded-xl sm:px-5 sm:text-sm"
          >
            {t('investNow')}
          </Link>
          <Link
            href="/wallet/deposit"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:min-h-11 sm:flex-none sm:rounded-xl sm:px-5 sm:text-sm"
          >
            <Wallet className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" aria-hidden />
            {t('deposit')}
          </Link>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-y-3 border-t border-white/10 pt-4 sm:mt-6 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-white/10 sm:pt-5 lg:mt-7 lg:pt-6">
        <StatCell
          label={t('totalInvested')}
          value={metrics?.totalInvested ?? '$0.00'}
          trend={metrics?.trends?.[0]?.percentage}
          trendSuffix={t('fromLastMonth')}
          emphasis
        />
        <StatCell
          label={t('activeInvestments')}
          value={String(investmentStats?.activeCount ?? 0)}
        />
        <StatCell
          label={t('weeklyEarnings')}
          value={investmentStats?.totalWeeklyEarnings ?? '$0.00'}
        />
        <StatCell
          label={t('totalProfit')}
          value={investmentStats?.totalProfitsEarned ?? metrics?.totalProfit ?? '$0.00'}
          trend={metrics?.trends?.[2]?.percentage}
          trendSuffix={t('fromLastMonth')}
        />
      </div>
    </HeroWrapper>
  )
}

export const DashboardPortfolioHero = memo(DashboardPortfolioHeroInner)
