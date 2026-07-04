'use client'

import {
  Gift,
  Star,
  Zap,
  Award,
  Unlock,
  CheckCircle,
  Trophy,
} from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { StatusCardGrid } from '@/components/shared/status-cards'
import { MetricCardsSkeleton, PlanCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { fetchRewardAchievements, fetchRewardsData, fetchRewardTiers } from '@/lib/data/queries'
import type { RewardAchievement } from '@/lib/data/types'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const achievementIcons: Record<string, LucideIcon> = {
  '1': Star,
  '2': Award,
  '3': Zap,
  '4': Gift,
  '5': Star,
  '6': Unlock,
}

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
    useAsyncData(() => fetchRewardsData(), [])
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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Rewards & Achievements</h1>
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
            <MetricCardsSkeleton count={3} />
            <PlanCardsSkeleton count={3} />
          </div>
        }
      >
        <section aria-label="Rewards summary" className={sectionStackClass}>
          <SectionHeading>Your rewards</SectionHeading>
          <StatusCardGrid columns={3}>
            <div className={cn(cardSurfaceClass, 'md:col-span-1')}>
              <p className="text-sm font-medium text-muted-foreground">Total Points</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-primary sm:text-4xl">
                {totalPoints.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{rewards?.points ?? '0 / 500 XP'}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tier progress</span>
                  <span className="font-semibold tabular-nums text-foreground">{tierProgress}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-label="Tier progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={tierProgress}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {rewards?.nextLevel ?? 'Next: Silver Level'}
                </p>
              </div>
            </div>
            <div className={cardSurfaceClass}>
              <p className="text-sm font-medium text-muted-foreground">Achievements Earned</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-600 sm:text-4xl">
                {earnedCount}
                <span className="text-lg font-semibold text-muted-foreground">
                  {' '}
                  / {achievements.length}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {inProgressAchievements.length} in progress
              </p>
            </div>
            <div className={cardSurfaceClass}>
              <p className="text-sm font-medium text-muted-foreground">Current Tier</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600 sm:text-3xl">{currentTierShort}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{rewards?.currentTier ?? 'Bronze Level'}</p>
            </div>
          </StatusCardGrid>
        </section>

        <section aria-label="Achievements" className={sectionStackClass}>
          <SectionHeading>Achievements</SectionHeading>
          <div className={cardSurfaceClass}>
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No achievements available yet.</p>
            ) : (
              <div className={pageStackClass}>
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
          </div>
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
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {tier.benefits.join(' · ')}
                    </p>
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

function AchievementCard({ reward }: { reward: RewardAchievement }) {
  const Icon = achievementIcons[reward.id] ?? Star
  const progressPercent =
    reward.progressMax != null && reward.progress != null && reward.progressMax > 0
      ? Math.min(100, (reward.progress / reward.progressMax) * 100)
      : 0

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        reward.earned ? 'border-primary/40 bg-blue-50/80' : 'border-border bg-background'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            reward.earned ? 'bg-primary/20' : 'bg-secondary'
          )}
        >
          <Icon className={cn('h-5 w-5', reward.earned ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        {reward.earned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            <CheckCircle className="h-3 w-3" />
            Earned
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 font-semibold text-foreground">{reward.name}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reward.description}</p>

      {reward.earned ? (
        <div className="mt-3 space-y-1">
          {reward.earnedDate ? (
            <p className="text-xs text-muted-foreground">Earned on {reward.earnedDate}</p>
          ) : null}
          <span className="inline-block rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
            +{reward.points} points
          </span>
        </div>
      ) : (
        <div className="mt-3">
          {reward.progressMax != null && reward.progress != null ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-xs font-semibold tabular-nums text-foreground">
                  {reward.progressMax >= 1000
                    ? `${reward.progress.toLocaleString()}/${reward.progressMax.toLocaleString()}`
                    : `${reward.progress}/${reward.progressMax}`}
                </p>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-label={`${reward.name} progress`}
                aria-valuemin={0}
                aria-valuemax={reward.progressMax ?? 100}
                aria-valuenow={reward.progress ?? 0}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : null}
          <p className="mt-2 text-xs font-semibold text-primary">+{reward.points} points when completed</p>
        </div>
      )}
    </div>
  )
}
