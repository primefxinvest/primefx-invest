'use client'

import { memo } from 'react'
import { Check, FileText, Percent, TrendingUp, Users, Wallet } from 'lucide-react'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import { ReferralCompactKpi, ReferralCompactKpiGrid } from '@/components/referral/overview/ReferralCompactKpis'
import { ReferralRankProgressBanner } from '@/components/referral/overview/ReferralRankProgressBanner'
import { ReferralInviteEarnSection } from '@/components/referral/overview/ReferralInviteEarnSection'
import { sectionStackClass } from '@/lib/layout/spacing'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import type { ReferralData } from '@/lib/data/types'
import { cn } from '@/lib/utils'

type ReferralOverviewSectionProps = {
  overview: ReferralProgramOverview
  referralData: ReferralData
}

function ReferralOverviewSectionInner({ overview, referralData }: ReferralOverviewSectionProps) {
  const qualifiedReferrals = overview.activeInvestors
  const conversionRate = overview.funnel.conversionRate
  const availableEarnings = overview.lifetimeEarnings

  return (
    <div className={cn('min-w-0', sectionStackClass)}>
      <ReferralPageHeader
        icon={<FileText className="h-5 w-5 text-orange-600" aria-hidden />}
        title="Referral & Earn Overview"
        subtitle="Share your link, track performance, and grow your referral earnings."
      />

      <ReferralCompactKpiGrid>
        <ReferralCompactKpi
          label="Total Referrals"
          value={String(overview.totalReferrals)}
          subtext={`${overview.trends.newInvestors ?? '+0'} this week`}
          subtextClassName="text-emerald-600"
          icon={<Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-blue-50 text-primary"
        />
        <ReferralCompactKpi
          label="Total Earnings"
          value={formatCurrency(overview.lifetimeEarnings)}
          subtext={`↑ ${overview.trends.lifetime ?? '0%'} vs last 7 days`}
          subtextClassName="text-emerald-600"
          icon={<Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-violet-50 text-violet-600"
        />
        <ReferralCompactKpi
          label="Available Earnings"
          value={formatCurrency(availableEarnings)}
          subtext="Ready to withdraw"
          subtextClassName="text-emerald-600"
          icon={<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <ReferralCompactKpi
          label="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          subtext={`${overview.funnel.signups} signups`}
          icon={<Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-orange-50 text-orange-600"
        />
        <ReferralCompactKpi
          label="Qualified Referrals"
          value={String(qualifiedReferrals)}
          subtext={
            overview.totalReferrals > 0
              ? `${Math.round((qualifiedReferrals / overview.totalReferrals) * 100)}% success rate`
              : 'No referrals yet'
          }
          subtextClassName="text-emerald-600"
          icon={<Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />
      </ReferralCompactKpiGrid>

      <ReferralRankProgressBanner
        currentRank={overview.rank.current}
        nextRank={overview.rank.next}
        progressPercent={overview.rank.progressPercent}
      />

      <ReferralInviteEarnSection referralData={referralData} />
    </div>
  )
}

export const ReferralOverviewSection = memo(ReferralOverviewSectionInner)
