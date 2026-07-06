'use client'

import dynamic from 'next/dynamic'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ErrorState } from '@/components/shared/data-state'
import { MetricCardsSkeleton, PageHeaderSkeleton } from '@/components/shared/skeletons'
import { pageStackClass } from '@/lib/layout/spacing'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useReferralRealtime } from '@/lib/hooks/useReferralRealtime'
import { fetchReferralProgramOverviewAction } from '@/lib/referral/actions'
import type { ReferralProgramPageData } from '@/lib/referral/overview-server'
import { parseReferralSection, type ReferralSectionKey } from '@/lib/referral/navigation'
import { cn } from '@/lib/utils'

const ReferralOverviewSection = dynamic(
  () =>
    import('@/components/referral/sections/ReferralOverviewSection').then(
      (mod) => mod.ReferralOverviewSection
    ),
  { loading: () => <SectionSkeleton /> }
)

const ReferralMyRankSection = dynamic(
  () =>
    import('@/components/referral/sections/ReferralMyRankSection').then(
      (mod) => mod.ReferralMyRankSection
    ),
  { loading: () => <SectionSkeleton /> }
)

const ReferralMyNetworkSection = dynamic(
  () =>
    import('@/components/referral/sections/ReferralMyNetworkSection').then(
      (mod) => mod.ReferralMyNetworkSection
    ),
  { loading: () => <SectionSkeleton /> }
)

const ReferralRankBenefitsSection = dynamic(
  () =>
    import('@/components/referral/sections/ReferralRankBenefitsSection').then(
      (mod) => mod.ReferralRankBenefitsSection
    ),
  { loading: () => <SectionSkeleton /> }
)

const ReferralLeaderboardSection = dynamic(
  () =>
    import('@/components/referral/sections/ReferralLeaderboardSection').then(
      (mod) => mod.ReferralLeaderboardSection
    ),
  { loading: () => <SectionSkeleton /> }
)

const ReferralPayoutsSection = dynamic(
  () =>
    import('@/components/referral/sections/ReferralPayoutsSection').then(
      (mod) => mod.ReferralPayoutsSection
    ),
  { loading: () => <SectionSkeleton /> }
)

const ReferralAchievementsBadgesPanel = dynamic(
  () =>
    import('@/components/referral/ReferralAchievementsBadgesPanel').then(
      (mod) => mod.ReferralAchievementsBadgesPanel
    ),
  { ssr: false }
)

const ReferralEarningsCalculator = dynamic(
  () =>
    import('@/components/referral/ReferralEarningsCalculator').then(
      (mod) => mod.ReferralEarningsCalculator
    ),
  { ssr: false }
)

function SectionSkeleton() {
  return (
    <div className={pageStackClass}>
      <PageHeaderSkeleton />
      <MetricCardsSkeleton count={4} />
    </div>
  )
}

function ReferralSectionContent({
  section,
  data,
}: {
  section: ReferralSectionKey
  data: ReferralProgramPageData
}) {
  const { referralData, referrals, overview } = data

  switch (section) {
    case 'rank':
      return (
        <div className="space-y-8">
          <ReferralMyRankSection overview={overview} />
          <Suspense fallback={null}>
            <ReferralAchievementsBadgesPanel badges={overview.badges} streak={overview.streak} />
          </Suspense>
        </div>
      )
    case 'network':
      return (
        <div className="space-y-8">
          <ReferralMyNetworkSection
            overview={overview}
            referrals={referrals}
            referralData={referralData}
          />
          <Suspense fallback={null}>
            <ReferralEarningsCalculator />
          </Suspense>
        </div>
      )
    case 'benefits':
      return <ReferralRankBenefitsSection overview={overview} />
    case 'leaderboard':
      return <ReferralLeaderboardSection overview={overview} />
    case 'payouts':
      return <ReferralPayoutsSection overview={overview} />
    case 'overview':
    default:
      return (
        <ReferralOverviewSection overview={overview} referralData={referralData} />
      )
  }
}

function ReferralProgramViewInner({
  initialOverview = null,
}: {
  initialOverview?: ReferralProgramPageData | null
}) {
  const searchParams = useSearchParams()
  const section = useMemo(
    () => parseReferralSection(searchParams.get('section')),
    [searchParams]
  )

  const { data, loading, error, reload } = useAsyncData(
    () => fetchReferralProgramOverviewAction(),
    [],
    initialOverview ?? undefined
  )

  useReferralRealtime(reload, Boolean(data))

  if (loading && !data) {
    return <SectionSkeleton />
  }

  if (error || !data?.overview || !data.referralData) {
    return (
      <ErrorState
        title="Unable to load referral program"
        description={error ?? 'Please try again in a moment.'}
        onRetry={reload}
      />
    )
  }

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <ReferralSectionContent section={section} data={data} />
    </div>
  )
}

export function ReferralProgramView({
  initialOverview = null,
}: {
  initialOverview?: ReferralProgramPageData | null
}) {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <ReferralProgramViewInner initialOverview={initialOverview} />
    </Suspense>
  )
}
