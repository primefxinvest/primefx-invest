'use client'

import {
  Award,
  CheckCircle,
  Crown,
  Gem,
  Lock,
  Medal,
  Shield,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Link } from '@/i18n/navigation'
import { AchievementCard } from '@/components/rewards/AchievementCard'
import { MetricCardsSkeleton, PlanCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import { cardSurfaceClass, dashboardCardClass } from '@/lib/layout/surfaces'
import { pageStackClass, gridGapClass, sectionStackClass } from '@/lib/layout/spacing'
import {
  fetchRewardAchievements,
  fetchRewardCatalogItems,
  fetchRewardsData,
  fetchRewardTiers,
} from '@/lib/data/queries'
import type { RewardAchievement } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const BADGE_TIERS = [
  { key: 'bronze', label: 'Bronze Badge', icon: Medal, color: 'from-amber-100 to-orange-100 text-amber-700' },
  { key: 'silver', label: 'Silver Badge', icon: Shield, color: 'from-slate-100 to-gray-200 text-slate-700' },
  { key: 'gold', label: 'Gold Badge', icon: Award, color: 'from-yellow-100 to-amber-100 text-amber-600' },
  { key: 'platinum', label: 'Platinum Badge', icon: Star, color: 'from-blue-100 to-indigo-100 text-blue-700' },
  { key: 'diamond', label: 'Diamond Badge', icon: Gem, color: 'from-violet-100 to-purple-200 text-violet-700' },
  { key: 'elite', label: 'Elite Investor Badge', icon: Crown, color: 'from-amber-100 via-yellow-100 to-orange-200 text-amber-800' },
] as const

function tierShortName(fullTier: string) {
  return fullTier.replace(' Level', '')
}

function resolveBadgeUnlock(
  badgeKey: string,
  currentTier: string,
  earnedAchievements: RewardAchievement[]
) {
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite']
  const currentIndex = tierOrder.indexOf(currentTier.toLowerCase())
  const badgeIndex = tierOrder.indexOf(badgeKey)
  if (badgeIndex <= currentIndex && currentIndex >= 0) return 'unlocked'
  const related = earnedAchievements.find((a) =>
    a.name.toLowerCase().includes(badgeKey)
  )
  if (related?.earned) return 'unlocked'
  if (badgeIndex === currentIndex + 1) return 'in_progress'
  return 'locked'
}

export function RewardsPageView() {
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
  const { data: catalog = [] } = useAsyncData(() => fetchRewardCatalogItems(), [])

  const loading = rewardsLoading || achievementsLoading
  const error = rewardsError ?? achievementsError
  const earnedAchievements = achievements.filter((a) => a.earned)
  const inProgressAchievements = achievements.filter((a) => !a.earned)
  const currentTierShort = tierShortName(rewards?.currentTier ?? 'Bronze Level')
  const tierProgress = rewards?.progress ?? 0

  const handleRetry = () => {
    reloadRewards()
    reloadAchievements()
  }

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Rewards & Achievements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn badges, unlock VIP benefits, and track your investor milestones.
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
        {/* 1. Current Rank */}
        <section aria-label="Current rank" className={sectionStackClass}>
          <SectionHeading>Current rank</SectionHeading>
          <div
            className={cn(
              dashboardCardClass,
              'flex flex-col gap-4 bg-gradient-to-br from-primary/5 via-card to-violet-50/30 sm:flex-row sm:items-center sm:justify-between'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Crown className="h-7 w-7 text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your rank
                </p>
                <p className="text-2xl font-bold text-foreground">{currentTierShort}</p>
                <p className="text-sm text-muted-foreground">{rewards?.currentTier}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
              <p className="text-xs text-muted-foreground">Total XP</p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {(rewards?.totalPoints ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Reward Progress */}
        <section aria-label="Reward progress" className={sectionStackClass}>
          <SectionHeading>Reward progress</SectionHeading>
          <div className={cardSurfaceClass}>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Path to next tier</span>
              <span className="font-bold tabular-nums text-primary">{tierProgress}%</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={tierProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-600 transition-all duration-500"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{rewards?.points}</p>
            <p className="mt-1 text-xs font-semibold text-primary">{rewards?.nextLevel}</p>
          </div>
        </section>

        {/* 3. Upcoming Rewards + 4. Achievement Badges */}
        <section aria-label="Badges and upcoming rewards" className={sectionStackClass}>
          <SectionHeading>Upcoming rewards & badges</SectionHeading>
          <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6', gridGapClass)}>
            {BADGE_TIERS.map((badge) => {
              const Icon = badge.icon
              const status = resolveBadgeUnlock(
                badge.key,
                currentTierShort,
                earnedAchievements
              )
              return (
                <div
                  key={badge.key}
                  className={cn(
                    'flex flex-col items-center rounded-xl border p-4 text-center shadow-sm transition-shadow',
                    status === 'unlocked'
                      ? 'border-primary/30 bg-primary/5'
                      : status === 'in_progress'
                        ? 'border-violet-200 bg-violet-50/50'
                        : 'border-border bg-muted/30 opacity-80'
                  )}
                >
                  <div
                    className={cn(
                      'mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
                      badge.color
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                  <span
                    className={cn(
                      'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                      status === 'unlocked'
                        ? 'bg-emerald-100 text-emerald-700'
                        : status === 'in_progress'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {status === 'unlocked' ? (
                      <>
                        <CheckCircle className="h-3 w-3" /> Unlocked
                      </>
                    ) : status === 'in_progress' ? (
                      `${tierProgress}%`
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> Locked
                      </>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* 5. Achievement Badges grid */}
        <section aria-label="Achievements" className={sectionStackClass}>
          <SectionHeading>Achievement badges</SectionHeading>
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
                  <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', gridGapClass)}>
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
                  <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', gridGapClass)}>
                    {inProgressAchievements.map((reward) => (
                      <AchievementCard key={reward.id} reward={reward} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        {/* 6. Referral Milestones */}
        <section aria-label="Referral milestones" className={sectionStackClass}>
          <SectionHeading>Referral milestones</SectionHeading>
          <div className={cn('grid grid-cols-1 sm:grid-cols-2', gridGapClass)}>
            {inProgressAchievements
              .filter((a) => a.description.toLowerCase().includes('referral'))
              .slice(0, 4)
              .map((milestone) => (
                <div key={milestone.id} className={cardSurfaceClass}>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{milestone.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{milestone.description}</p>
                      {milestone.progressMax != null && milestone.progress != null ? (
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold tabular-nums">
                              {Math.round(
                                (milestone.progress / milestone.progressMax) * 100
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.min(100, (milestone.progress / milestone.progressMax) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            {inProgressAchievements.filter((a) =>
              a.description.toLowerCase().includes('referral')
            ).length === 0 ? (
              <div className={cn(cardSurfaceClass, 'sm:col-span-2')}>
                <p className="text-sm text-muted-foreground">
                  Referral milestones appear as you grow your network. Visit the{' '}
                  <Link href="/referral" className="font-semibold text-primary hover:underline">
                    Referral Center
                  </Link>{' '}
                  to track progress.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* 7. VIP Status Benefits */}
        <section aria-label="VIP benefits" className={sectionStackClass}>
          <SectionHeading>VIP status benefits</SectionHeading>
          <div className={cn('grid grid-cols-1 md:grid-cols-2', gridGapClass)}>
            {(tierRows.length > 0
              ? tierRows
              : [
                  { tier: 'Bronze', points: '0-500', benefits: ['Basic support', 'Community access'] },
                  {
                    tier: 'Silver',
                    points: '501-1500',
                    benefits: ['Priority support', 'Exclusive webinars'],
                  },
                  {
                    tier: 'Gold',
                    points: '1501-3000',
                    benefits: ['24/7 support', 'Private advisor', 'Early feature access'],
                  },
                  {
                    tier: 'Platinum',
                    points: '3000+',
                    benefits: ['Dedicated advisor', 'VIP events', 'Custom strategies'],
                  },
                ]
            ).map((tier) => {
              const isCurrent = tier.tier === currentTierShort
              return (
                <div
                  key={tier.tier}
                  className={cn(
                    cardSurfaceClass,
                    isCurrent && 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
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
                  <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <Zap className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* 8. Lifetime Achievements + Leaderboard */}
        <section aria-label="Lifetime achievements" className={sectionStackClass}>
          <SectionHeading>Lifetime achievements</SectionHeading>
          <div className={cn('grid grid-cols-1 lg:grid-cols-3', gridGapClass)}>
            <div className={cn(cardSurfaceClass, 'lg:col-span-2')}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{earnedAchievements.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Badges earned</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {(rewards?.totalPoints ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Lifetime XP</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{inProgressAchievements.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">In progress</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{catalog.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Rewards available</p>
                </div>
              </div>
            </div>

            <div className={cardSurfaceClass}>
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
                <h3 className="font-semibold text-foreground">Leaderboard position</h3>
              </div>
              <p className="text-3xl font-bold text-primary">
                Top {Math.max(5, 100 - tierProgress)}%
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Based on your {currentTierShort} tier and {rewards?.totalPoints ?? 0} lifetime XP
                among PrimeFx investors.
              </p>
              <p className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                Keep earning XP to climb the global rewards leaderboard.
              </p>
            </div>
          </div>
        </section>
      </AsyncState>
    </div>
  )
}
