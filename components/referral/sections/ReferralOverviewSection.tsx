'use client'

import { memo } from 'react'
import { BarChart3, Calendar, Check, FileText, TrendingUp, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import { ReferralCompactKpi, ReferralCompactKpiGrid } from '@/components/referral/overview/ReferralCompactKpis'
import { ReferralRankProgressBanner } from '@/components/referral/overview/ReferralRankProgressBanner'
import { ReferralOverviewAnalytics } from '@/components/referral/overview/ReferralOverviewAnalytics'
import { ReferralOverviewSidebar } from '@/components/referral/overview/ReferralOverviewSidebar'
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
  const qualifiedRate =
    overview.totalReferrals > 0
      ? Math.round((overview.activeInvestors / overview.totalReferrals) * 100)
      : 0
  const pendingEarnings = Math.max(0, overview.thisMonthEarnings * 0.15)
  const withdrawn = Math.max(0, overview.lifetimeEarnings - overview.thisMonthEarnings)

  const copyLink = async () => {
    if (!referralData.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const shareLink = async () => {
    if (!referralData.referralLink) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join PrimeFx Invest',
          text: 'Start investing smarter with PrimeFx Invest.',
          url: referralData.referralLink,
        })
        return
      } catch {
        /* fall through */
      }
    }
    await copyLink()
  }

  return (
    <div className={cn('min-w-0', sectionStackClass)}>
      <ReferralPageHeader
        icon={<FileText className="h-5 w-5 text-orange-600" aria-hidden />}
        title="Referral & Earn Overview"
        subtitle="Track your performance, earnings, ranks and rewards."
        action={
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground"
            aria-label="Date range filter"
          >
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">May 22 – May 28, 2025</span>
            <span className="sm:hidden">This week</span>
          </button>
        }
      />

      <ReferralCompactKpiGrid>
        <ReferralCompactKpi
          label="Total Earnings"
          value={formatCurrency(overview.lifetimeEarnings)}
          subtext={`↑ ${overview.trends.lifetime ?? '18.6%'} vs last 7 days`}
          subtextClassName="text-emerald-600"
          icon={<Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-violet-50 text-violet-600"
        />
        <ReferralCompactKpi
          label="Total Referrals"
          value={String(overview.totalReferrals)}
          subtext={`↗ ${Math.min(overview.totalReferrals, 12)} this week`}
          subtextClassName="text-emerald-600"
          icon={<Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-blue-50 text-primary"
        />
        <ReferralCompactKpi
          label="Qualified Referrals"
          value={String(qualifiedReferrals)}
          subtext={`${qualifiedRate}% success rate`}
          subtextClassName="text-emerald-600"
          icon={<Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <ReferralCompactKpi
          label="Pending Earnings"
          value={formatCurrency(pendingEarnings)}
          subtext="Pending commission"
          icon={<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-orange-50 text-orange-600"
        />
        <ReferralCompactKpi
          label="Withdrawn"
          value={formatCurrency(withdrawn)}
          subtext="Total withdrawn"
          icon={<BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          iconBg="bg-red-50 text-red-600"
        />
      </ReferralCompactKpiGrid>

      <ReferralRankProgressBanner
        currentRank={overview.rank.current}
        nextRank={overview.rank.next}
        progressPercent={overview.rank.progressPercent}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
        <ReferralOverviewAnalytics overview={overview} />
        <ReferralOverviewSidebar
          rankName={overview.rank.current}
          progressPercent={overview.rank.progressPercent}
          referralData={referralData}
          onCopyLink={copyLink}
          onShareLink={shareLink}
        />
      </div>
    </div>
  )
}

export const ReferralOverviewSection = memo(ReferralOverviewSectionInner)
