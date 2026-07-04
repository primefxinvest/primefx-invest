'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Award, DollarSign, Percent, TrendingUp, Wallet } from 'lucide-react'
import { KpiCard, KpiGrid, trendColorFromPercentage } from '@/components/shared/kpi'

export type InvestorKpiMetrics = {
  currentValue?: string
  totalInvested?: string
  totalProfit?: string
  roiPercentage?: string
  trends?: Array<{ percentage?: string } | undefined>
}

export type InvestorKpiWallet = {
  availableBalance?: string
}

type InvestorKpiCardsProps = {
  variant: 'dashboard' | 'wallet'
  metrics?: InvestorKpiMetrics | null
  wallet?: InvestorKpiWallet | null
  className?: string
}

export const InvestorKpiCards = memo(function InvestorKpiCards({
  variant,
  metrics,
  wallet,
  className,
}: InvestorKpiCardsProps) {
  const t = useTranslations('dashboard')
  const includeRoi = variant === 'dashboard'

  return (
    <KpiGrid count={includeRoi ? 5 : 4} aria-label={t('overviewSubtitle')} className={className}>
      <KpiCard
        href="/wallet"
        label={t('currentBalance')}
        value={wallet?.availableBalance ?? '$0.00'}
        icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-emerald-50 text-emerald-600"
      />
      <KpiCard
        href="/portfolio"
        label={t('currentValue')}
        value={metrics?.currentValue ?? '$0.00'}
        trend={metrics?.trends?.[1]?.percentage}
        trendSuffix={t('fromLastMonth')}
        trendColor={trendColorFromPercentage(metrics?.trends?.[1]?.percentage)}
        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-emerald-50 text-emerald-600"
      />
      <KpiCard
        label={t('totalInvested')}
        value={metrics?.totalInvested ?? '$0.00'}
        trend={metrics?.trends?.[0]?.percentage}
        trendSuffix={t('fromLastMonth')}
        trendColor={trendColorFromPercentage(metrics?.trends?.[0]?.percentage)}
        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-primary/10 text-primary"
      />
      <KpiCard
        label={t('totalProfit')}
        value={metrics?.totalProfit ?? '$0.00'}
        trend={metrics?.trends?.[2]?.percentage}
        trendSuffix={t('fromLastMonth')}
        trendColor={trendColorFromPercentage(metrics?.trends?.[2]?.percentage)}
        icon={<Award className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-purple-50 text-purple-600"
      />
      {includeRoi ? (
        <KpiCard
          label={t('roiOverall')}
          value={metrics?.roiPercentage ?? '0%'}
          trend={metrics?.trends?.[3]?.percentage}
          trendSuffix={t('roiFromLastMonth')}
          trendColor={trendColorFromPercentage(metrics?.trends?.[3]?.percentage)}
          icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-orange-50 text-orange-600"
        />
      ) : null}
    </KpiGrid>
  )
})
