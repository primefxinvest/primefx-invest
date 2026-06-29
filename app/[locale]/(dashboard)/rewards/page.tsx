'use client'

import {
  Gift,
  Star,
  Zap,
  Award,
  Unlock,
  CheckCircle,
  CreditCard,
  BookOpen,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton, PlanCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchRewardAchievements, fetchRewardsData } from '@/lib/data/queries'
import type { RewardAchievement } from '@/lib/data/types'
import type { LucideIcon } from 'lucide-react'

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

  const totalPoints = rewards?.totalPoints ?? 0
  const earnedCount = achievements.filter((a) => a.earned).length
  const currentTierShort = tierShortName(rewards?.currentTier ?? 'Bronze Level')
  const loading = rewardsLoading || achievementsLoading
  const error = rewardsError ?? achievementsError

  const handleRetry = () => {
    reloadRewards()
    reloadAchievements()
  }

  const handleRedeem = (name: string, cost: number) => {
    if (totalPoints < cost) {
      toast.error('Not enough points', {
        description: `You need ${cost - totalPoints} more points to redeem ${name}.`,
      })
      return
    }
    toast.success('Reward redeemed', {
      description: `${name} has been added to your account.`,
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Rewards & Achievements</h1>
        <p className="mt-1 text-muted-foreground">
          Earn points and unlock achievements by completing actions.
        </p>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={handleRetry}
        skeleton={
          <div className="space-y-8">
            <MetricCardsSkeleton count={3} />
            <PlanCardsSkeleton count={3} />
          </div>
        }
      >

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Points</p>
          <p className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            {totalPoints.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{rewards?.points ?? '0 / 500 XP'}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Achievements Earned</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 sm:text-4xl">
            {earnedCount} of {achievements.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Keep going to unlock more!</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Current Tier</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 sm:text-4xl">{currentTierShort}</p>
          <p className="mt-2 text-xs text-muted-foreground">{rewards?.nextLevel ?? 'Next: Silver Level'}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Achievements</h2>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No achievements available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((reward) => (
              <AchievementCard key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Tier Benefits</h2>
        <div className="space-y-3">
          {tierBenefits.map((tier) => (
            <div key={tier.tier} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{tier.tier}</p>
                  <p className="text-xs text-muted-foreground">{tier.points} points</p>
                </div>
                {tier.tier === currentTierShort && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Benefits: {tier.benefits.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Redeem Points</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Trading Credit', cost: 500, icon: CreditCard },
            { name: 'Premium Course', cost: 750, icon: BookOpen },
            { name: 'Month of Premium', cost: 1000, icon: Sparkles },
            { name: 'Exclusive Report', cost: 300, icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleRedeem(item.name, item.cost)}
                className="rounded-lg border border-border bg-background p-4 text-center transition-colors hover:bg-secondary"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-2 font-semibold text-foreground">{item.name}</p>
                <p className="mt-1 text-sm font-semibold text-primary">{item.cost} points</p>
              </button>
            )
          })}
        </div>
      </div>
      </AsyncState>
    </div>
  )
}

function AchievementCard({ reward }: { reward: RewardAchievement }) {
  const Icon = achievementIcons[reward.id] ?? Star

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        reward.earned ? 'border-primary bg-blue-50' : 'border-border hover:border-primary'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`rounded-lg p-2 ${reward.earned ? 'bg-primary/20' : 'bg-secondary'}`}>
          <Icon className={`h-5 w-5 ${reward.earned ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        {reward.earned && <CheckCircle className="h-5 w-5 text-primary" />}
      </div>

      <h3 className="mt-3 font-semibold text-foreground">{reward.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{reward.description}</p>

      {reward.earned ? (
        <div className="mt-3 space-y-1">
          {reward.earnedDate && (
            <p className="text-xs text-muted-foreground">Earned on {reward.earnedDate}</p>
          )}
          <span className="inline-block rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
            +{reward.points} points
          </span>
        </div>
      ) : (
        <div className="mt-3">
          {reward.progressMax != null && reward.progress != null && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-xs font-semibold text-foreground">
                  {reward.progressMax >= 1000
                    ? `${reward.progress.toLocaleString()}/${reward.progressMax.toLocaleString()}`
                    : `${reward.progress}/${reward.progressMax}`}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{
                    width: `${(reward.progress / reward.progressMax) * 100}%`,
                  }}
                />
              </div>
            </>
          )}
          <p className="mt-2 text-xs font-semibold text-primary">
            +{reward.points} points when completed
          </p>
        </div>
      )}
    </div>
  )
}
