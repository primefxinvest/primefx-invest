'use client'

import dynamic from 'next/dynamic'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Gift, Wallet } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { AsyncState } from '@/components/shared/data-state'
import { AchievementCard } from '@/components/rewards/AchievementCard'
import {
  RewardsHeroSection,
  RewardsKpiRow,
  type RewardsHeroData,
  type RewardsKpiData,
} from '@/components/rewards/RewardsKpiRow'
import { RewardsPageHeader } from '@/components/rewards/shared/RewardsPageHeader'
import { RewardsTabNav } from '@/components/rewards/shared/RewardsTabNav'
import { RewardsSidebarSummary } from '@/components/rewards/RewardsInsightsAndFaq'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import {
  fetchRecentTransactions,
  fetchReferralData,
  fetchRewardAchievements,
  fetchRewardsData,
  fetchWalletData,
} from '@/lib/data/queries'
import { fetchReferralProgramOverviewAction } from '@/lib/referral/actions'
import { REFERRAL_DISPLAY_INVESTMENT_COMMISSION } from '@/lib/referral/display-config'
import { mapTierToRankKey } from '@/lib/rewards/display-config'
import { parseRewardsTab, type RewardsTabKey } from '@/lib/rewards/navigation'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { pageStackClass, gridGapClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

const RewardsRankJourney = dynamic(
  () => import('@/components/rewards/RewardsRankJourney').then((m) => m.RewardsRankJourney),
  { loading: () => null }
)
const RewardsRecentAchievements = dynamic(
  () =>
    import('@/components/rewards/RewardsRecentAchievements').then((m) => m.RewardsRecentAchievements),
  { loading: () => null }
)
const RewardsAvailableGrid = dynamic(
  () => import('@/components/rewards/RewardsAvailableGrid').then((m) => m.RewardsAvailableGrid),
  { loading: () => null }
)
const RewardsRankRewardsGrid = dynamic(
  () => import('@/components/rewards/RewardsRankRewardsGrid').then((m) => m.RewardsRankRewardsGrid),
  { loading: () => null }
)
const RewardsMilestonesSection = dynamic(
  () => import('@/components/rewards/RewardsMilestonesSection').then((m) => m.RewardsMilestonesSection),
  { loading: () => null }
)
const RewardsHistoryTable = dynamic(
  () => import('@/components/rewards/RewardsHistoryTable').then((m) => m.RewardsHistoryTable),
  { loading: () => null }
)
const RewardsAiInsights = dynamic(
  () => import('@/components/rewards/RewardsInsightsAndFaq').then((m) => m.RewardsAiInsights),
  { ssr: false }
)
const RewardsFaq = dynamic(
  () => import('@/components/rewards/RewardsInsightsAndFaq').then((m) => m.RewardsFaq),
  { ssr: false }
)

function SectionSkeleton() {
  return (
    <div className={pageStackClass}>
      <MetricCardsSkeleton count={4} />
    </div>
  )
}

function InvestmentCommissionCard() {
  return (
    <section
      className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] p-6 text-white shadow-lg"
      aria-label="Investment commission"
    >
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-200">
            Investment Commission
          </p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">
            {REFERRAL_DISPLAY_INVESTMENT_COMMISSION}{' '}
            <span className="text-lg font-semibold text-violet-200 sm:text-xl">One-time</span>
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-violet-100">
            Earn when a referred investor makes their qualifying first investment or deposit. Paid
            once per referred member and tracked transparently in the wallet.
          </p>
          <Link
            href="/referral"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white hover:opacity-95"
          >
            Learn More
          </Link>
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 lg:h-24 lg:w-24">
          <Wallet className="h-10 w-10 text-amber-300" aria-hidden />
        </div>
      </div>
    </section>
  )
}

function RewardsPageContent() {
  const searchParams = useSearchParams()
  const activeTab = useMemo(() => parseRewardsTab(searchParams.get('tab')), [searchParams])

  const { data: rewards, loading: rewardsLoading, error: rewardsError, reload: reloadRewards } =
    useAsyncData(() => fetchRewardsData(), [], undefined, {
      cacheKey: CACHE_KEYS.rewardsData,
      cacheTtlMs: 30_000,
    })

  const {
    data: achievements = [],
    loading: achievementsLoading,
    error: achievementsError,
    reload: reloadAchievements,
  } = useAsyncData(() => fetchRewardAchievements(), [])

  const { data: referral } = useAsyncData(() => fetchReferralData(), [], undefined, {
    cacheKey: 'rewards-page-referral',
    cacheTtlMs: 30_000,
  })

  const { data: wallet } = useAsyncData(() => fetchWalletData(), [], undefined, {
    cacheKey: CACHE_KEYS.walletData,
    cacheTtlMs: 30_000,
  })

  const { data: transactions = [] } = useAsyncData(() => fetchRecentTransactions(20), [])

  const { data: referralOverview } = useAsyncData(
    async () => {
      try {
        return await fetchReferralProgramOverviewAction()
      } catch {
        return null
      }
    },
    [],
    null
  )

  const loading = rewardsLoading || achievementsLoading
  const error = rewardsError ?? achievementsError
  const earned = achievements.filter((a) => a.earned)
  const inProgress = achievements.filter((a) => !a.earned)

  const rankName =
    referralOverview?.overview.rank.current ??
    rewards?.currentTier ??
    'PrimeFx Bronze'
  const nextRankName =
    referralOverview?.overview.rank.next ?? rewards?.nextTier ?? 'PrimeFx Silver'
  const rankProgress =
    referralOverview?.overview.rank.progressPercent ?? rewards?.progress ?? 0
  const currentRankKey = mapTierToRankKey(rankName)

  const totalEarned = referral?.totalEarnings ?? '$0.00'
  const availableRewards = wallet?.bonusBalance ?? '$0.00'
  const pendingRewards = wallet?.pendingBalance ?? '$0.00'

  const kpiData: RewardsKpiData = {
    totalEarned,
    available: availableRewards,
    pending: pendingRewards,
    completedAchievements: earned.length,
    totalAchievements: achievements.length,
    trend: referralOverview?.overview.trends.week,
  }

  const heroData: RewardsHeroData = {
    rankName,
    nextRankName,
    progressPercent: rankProgress,
    overallProgress: Math.min(100, Math.round((earned.length / Math.max(achievements.length, 1)) * 100)),
    totalEarned,
    available: availableRewards,
    pending: pendingRewards,
    completedCount: earned.length,
    estimatedWeeksToNext:
      rankProgress > 0 && rankProgress < 100
        ? Math.max(1, Math.ceil((100 - rankProgress) / 10))
        : undefined,
  }

  const handleRetry = () => {
    reloadRewards()
    reloadAchievements()
  }

  const overviewMain = (
    <div className="min-w-0 space-y-6">
      <RewardsHeroSection data={heroData} />
      <RewardsRankJourney currentRankKey={currentRankKey} progressPercent={rankProgress} />
      <RewardsRecentAchievements achievements={achievements} />
      <RewardsAvailableGrid currentRankKey={currentRankKey} />
      <InvestmentCommissionCard />
      <RewardsAiInsights
        achievements={achievements}
        rewards={rewards!}
        referralCount={referral?.totalReferrals ?? 0}
        rankProgress={rankProgress}
      />
      <RewardsFaq />
    </div>
  )

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <RewardsPageHeader
        icon={<Gift className="h-5 w-5" aria-hidden />}
        title="Rewards"
        subtitle="Complete achievements, unlock exclusive rewards, and enjoy premium benefits."
      />

      <RewardsTabNav activeTab={activeTab} />

      <AsyncState
        loading={loading}
        error={error}
        onRetry={handleRetry}
        skeleton={<SectionSkeleton />}
      >
        {rewards ? (
          <>
            <RewardsKpiRow data={kpiData} />

            {activeTab === 'overview' ? (
              <div className={cn('grid grid-cols-1 items-start xl:grid-cols-[minmax(0,1fr)_300px]', gridGapClass)}>
                {overviewMain}
                <RewardsSidebarSummary
                  totalEarned={totalEarned}
                  rankBonus="+$0.00"
                  referralCommission={totalEarned}
                  achievementRewards={`+${earned.reduce((s, a) => s + a.points, 0)} pts`}
                  bonusRewards={availableRewards}
                />
              </div>
            ) : null}

            {activeTab === 'achievements' ? (
              <div className="space-y-8">
                {earned.length > 0 ? (
                  <section aria-label="Earned achievements">
                    <h2 className="mb-4 text-base font-semibold text-foreground">
                      Earned ({earned.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {earned.map((item) => (
                        <AchievementCard key={item.id} reward={item} />
                      ))}
                    </div>
                  </section>
                ) : null}
                {inProgress.length > 0 ? (
                  <section aria-label="In progress achievements">
                    <h2 className="mb-4 text-base font-semibold text-foreground">
                      In Progress ({inProgress.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {inProgress.map((item) => (
                        <AchievementCard key={item.id} reward={item} />
                      ))}
                    </div>
                  </section>
                ) : null}
                {achievements.length === 0 ? (
                  <div className={dashboardCardClass}>
                    <p className="text-sm text-muted-foreground">No achievements available yet.</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'milestones' ? (
              <RewardsMilestonesSection referralCount={referral?.totalReferrals ?? 0} />
            ) : null}

            {activeTab === 'rank-rewards' ? (
              <RewardsRankRewardsGrid currentRankKey={currentRankKey} />
            ) : null}

            {activeTab === 'history' ? (
              <RewardsHistoryTable achievements={achievements} transactions={transactions} />
            ) : null}
          </>
        ) : null}
      </AsyncState>
    </div>
  )
}

export function RewardsPageView() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <RewardsPageContent />
    </Suspense>
  )
}
