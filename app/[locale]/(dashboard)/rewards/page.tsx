'use client'

import { CheckCircle, Trophy } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { AchievementCard } from '@/components/rewards/AchievementCard'
import { RewardsSummaryKpis } from '@/components/rewards/RewardsSummaryKpis'
import { MetricCardsSkeleton, PlanCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { fetchRewardAchievements, fetchRewardsData, fetchRewardTiers } from '@/lib/data/queries'
import { cn } from '@/lib/utils'

const tierBenefits = [
  { tier: 'Bronze', points: '0-500', benefits: ['Basic support', 'Community access'] },
  {
    tier: 'Silver',
    points: '501-1500',
    benefits: ['Priority support', 'Exclusive webinars', '5% trading discount'],
  },
  {
    tier: 'Gold',
    points: '1501-3000',
    benefits: ['24/7 support', 'Private advisor', '10% trading discount', 'Early feature access'],
  },
  {
    tier: 'Platinum',
    points: '3000+',
    benefits: ['Dedicated advisor', '15% trading discount', 'Custom strategies', 'VIP events'],
  },
]

function tierShortName(fullTier: string) {
  return fullTier.replace(' Level', '')
}

export default function RewardsPage() {
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
  const { data: tierRows = [] } = useAsyncData(() => fetchRewardTiers(), [])

  const tierBenefitsFromDb =
    tierRows.length > 0
      ? tierRows.map((row) => ({
          tier: row.tier,
          points: row.points,
          benefits: row.benefits,
        }))
      : tierBenefits

  const totalPoints = rewards?.totalPoints ?? 0
  const tierProgress = rewards?.progress ?? 0
  const earnedAchievements = achievements.filter((a) => a.earned)
  const inProgressAchievements = achievements.filter((a) => !a.earned)
  const earnedCount = earnedAchievements.length
  const currentTierShort = tierShortName(rewards?.currentTier ?? 'Bronze Level')
  const loading = rewardsLoading || achievementsLoading
  const error = rewardsError ?? achievementsError

  const handleRetry = () => {
    reloadRewards()
    reloadAchievements()
  }

  return (
    <div className={pageStackClass}>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Rewards & Achievements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn points and unlock achievements by completing actions on the platform.
        </p>
      </header>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={handleRetry}
        skeleton={
          <div className={pageStackClass}>
            <MetricCardsSkeleton count={4} />
            <PlanCardsSkeleton count={3} />
          </div>
        }
      >
        <section aria-label="Rewards summary" className={sectionStackClass}>
          <SectionHeading>Your rewards</SectionHeading>
          <RewardsSummaryKpis
            totalPoints={totalPoints}
            earnedCount={earnedCount}
            totalAchievements={achievements.length}
            inProgressCount={inProgressAchievements.length}
            currentTierShort={currentTierShort}
            currentTierFull={rewards?.currentTier ?? 'Bronze Level'}
            tierProgress={tierProgress}
            nextLevel={rewards?.nextLevel ?? 'Next: Silver Level'}
            pointsLabel={rewards?.points ?? '0 / 500 XP'}
          />
        </section>

        <section aria-label="Achievements" className={sectionStackClass}>
          <SectionHeading>Achievements</SectionHeading>
          {achievements.length === 0 ? (
            <div className={cardSurfaceClass}>
              <p className="text-sm text-muted-foreground">No achievements available yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {earnedAchievements.length > 0 ? (
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Earned ({earnedAchievements.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {earnedAchievements.map((reward) => (
                      <AchievementCard key={reward.id} reward={reward} />
                    ))}
                  </div>
                </div>
              ) : null}
              {inProgressAchievements.length > 0 ? (
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    In progress ({inProgressAchievements.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {inProgressAchievements.map((reward) => (
                      <AchievementCard key={reward.id} reward={reward} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section aria-label="Tier benefits" className={sectionStackClass}>
          <SectionHeading>Tier benefits</SectionHeading>
          <div className={cardSurfaceClass}>
            <div className="space-y-3">
              {tierBenefitsFromDb.map((tier) => {
                const isCurrent = tier.tier === currentTierShort
                return (
                  <div
                    key={tier.tier}
                    className={cn(
                      'rounded-xl border p-4 transition-colors',
                      isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border bg-background'
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{tier.tier}</p>
                        <p className="text-xs text-muted-foreground">{tier.points} points</p>
                      </div>
                      {isCurrent ? (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                      {tier.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <Trophy className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </AsyncState>
    </div>
  )
}
