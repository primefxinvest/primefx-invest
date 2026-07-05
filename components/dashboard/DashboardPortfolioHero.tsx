'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { InvestorKpiMetrics, InvestorKpiWallet } from '@/components/shared/kpi/InvestorKpiCards'
import { trendColorFromPercentage } from '@/components/shared/kpi'
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
    <div className="min-w-0 flex-1 px-3 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <p
        className={cn(
          'font-semibold uppercase tracking-[0.06em] text-slate-400',
          emphasis ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px]'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 truncate font-bold tabular-nums text-white',
          emphasis ? 'text-lg sm:text-xl' : 'text-sm font-semibold sm:text-base'
        )}
      >
        {value}
      </p>
      {trend ? (
        <p
          className={cn(
            'mt-1 text-[11px] font-semibold sm:text-xs',
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

  if (loading) {
    return (
      <div
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl sm:p-6"
        aria-busy="true"
        aria-label={t('portfolioHero')}
      >
        <Skeleton className="h-3.5 w-28 bg-white/10" />
        <Skeleton className="mt-4 h-12 w-56 bg-white/10 sm:h-14 sm:w-64" />
        <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 bg-white/10" />
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-11 flex-1 bg-white/10" />
          <Skeleton className="h-11 flex-1 bg-white/10" />
        </div>
      </div>
    )
  }

  return (
    <section
      aria-label={t('portfolioHero')}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 p-5 shadow-xl sm:p-6 lg:p-8"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#7c3aed]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 sm:text-xs">
              {t('currentBalance')}
            </p>
          </div>

          <p className="mt-4 min-w-0 truncate text-4xl font-bold tabular-nums tracking-tight text-white sm:text-[2.75rem] lg:text-5xl lg:leading-none">
            {wallet?.availableBalance ?? '$0.00'}
          </p>

          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{t('overviewSubtitle')}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            href="/invest"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {t('investNow')}
          </Link>
          <Link
            href="/wallet/deposit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <Wallet className="mr-2 h-4 w-4" aria-hidden />
            {t('deposit')}
          </Link>
        </div>
      </div>

      <div className="relative mt-7 grid grid-cols-2 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-white/10">
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
    </section>
  )
}

export const DashboardPortfolioHero = memo(DashboardPortfolioHeroInner)
