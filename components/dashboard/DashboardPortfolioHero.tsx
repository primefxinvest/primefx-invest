'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowUpRight, TrendingUp, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { InvestorKpiMetrics, InvestorKpiWallet } from '@/components/shared/kpi/InvestorKpiCards'
import { trendColorFromPercentage } from '@/components/shared/kpi'
import { cn } from '@/lib/utils'

type DashboardPortfolioHeroProps = {
  metrics?: InvestorKpiMetrics | null
  wallet?: InvestorKpiWallet | null
  loading?: boolean
}

function StatCell({
  label,
  value,
  trend,
  trendSuffix,
}: {
  label: string
  value: string
  trend?: string
  trendSuffix?: string
}) {
  const trendColor = trendColorFromPercentage(trend)
  return (
    <div className="min-w-0 flex-1 px-3 py-3 first:pl-0 last:pr-0 sm:px-4 sm:py-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-bold text-white sm:text-lg">{value}</p>
      {trend ? (
        <p
          className={cn(
            'mt-0.5 text-xs font-semibold',
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

function DashboardPortfolioHeroInner({ metrics, wallet, loading }: DashboardPortfolioHeroProps) {
  const t = useTranslations('dashboard')

  if (loading) {
    return (
      <div
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl sm:p-6"
        aria-busy="true"
        aria-label={t('portfolioHero')}
      >
        <Skeleton className="h-4 w-32 bg-white/10" />
        <Skeleton className="mt-3 h-10 w-48 bg-white/10" />
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
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

  const valueTrend = metrics?.trends?.[1]?.percentage

  return (
    <section
      aria-label={t('portfolioHero')}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 p-5 shadow-xl sm:p-6 lg:p-7"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#7c3aed]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <TrendingUp className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('portfolioHeroLabel')}
            </p>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.5rem]">
            {metrics?.currentValue ?? '$0.00'}
          </p>

          {valueTrend ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              {valueTrend} {t('fromLastMonth')}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">{t('overviewSubtitle')}</p>
          )}
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

      <div className="relative mt-6 grid grid-cols-2 divide-white/10 border-t border-white/10 pt-5 sm:grid-cols-4 sm:divide-x">
        <StatCell
          label={t('currentBalance')}
          value={wallet?.availableBalance ?? '$0.00'}
        />
        <StatCell
          label={t('totalInvested')}
          value={metrics?.totalInvested ?? '$0.00'}
          trend={metrics?.trends?.[0]?.percentage}
          trendSuffix={t('fromLastMonth')}
        />
        <StatCell
          label={t('totalProfit')}
          value={metrics?.totalProfit ?? '$0.00'}
          trend={metrics?.trends?.[2]?.percentage}
          trendSuffix={t('fromLastMonth')}
        />
        <StatCell
          label={t('roiOverall')}
          value={metrics?.roiPercentage ?? '0%'}
          trend={metrics?.trends?.[3]?.percentage}
          trendSuffix={t('roiFromLastMonth')}
        />
      </div>
    </section>
  )
}

export const DashboardPortfolioHero = memo(DashboardPortfolioHeroInner)
