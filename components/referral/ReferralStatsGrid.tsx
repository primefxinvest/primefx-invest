'use client'

import { Crown, TrendingUp, Users, Wallet } from 'lucide-react'
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'

type ReferralStatsGridProps = {
  overview: ReferralProgramOverview
}

export function ReferralStatsGrid({ overview }: ReferralStatsGridProps) {
  return (
    <section aria-label="Referral key metrics">
      <KpiGrid count={4} aria-label="Referral performance">
        <KpiCard
          label="Lifetime Earnings"
          value={formatCurrency(overview.lifetimeEarnings)}
          trend={overview.trends.lifetime}
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="This Month"
          value={formatCurrency(overview.thisMonthEarnings)}
          trend={overview.trends.month}
          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Total Referrals"
          value={String(overview.totalReferrals)}
          trend={overview.trends.newInvestors}
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-blue-50 text-[#0052ff]"
        />
        <KpiCard
          label="Active Members"
          value={String(overview.activeInvestors)}
          icon={<Crown className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-orange-50 text-orange-500"
        />
      </KpiGrid>
    </section>
  )
}
