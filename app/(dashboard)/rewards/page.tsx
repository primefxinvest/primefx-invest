'use client'

import { Gift, Star, Zap, Award, Unlock, CheckCircle } from 'lucide-react'

export default function RewardsPage() {
  const rewards = [
    {
      id: '1',
      name: 'Early Bird Investor',
      description: 'Make your first investment',
      points: 100,
      earned: true,
      icon: Star,
      earnedDate: '2024-03-10',
    },
    {
      id: '2',
      name: 'Portfolio Builder',
      description: 'Invest in 5+ different securities',
      points: 250,
      earned: true,
      icon: Award,
      earnedDate: '2024-04-15',
    },
    {
      id: '3',
      name: 'Community Champion',
      description: 'Post 10 discussions in community',
      points: 150,
      earned: false,
      progress: 7,
      progressMax: 10,
      icon: Zap,
    },
    {
      id: '4',
      name: 'Referral Master',
      description: 'Refer 3 investors to PrimeAI',
      points: 500,
      earned: true,
      icon: Gift,
      earnedDate: '2024-05-20',
    },
    {
      id: '5',
      name: 'Market Analyst',
      description: 'Complete all academy courses',
      points: 300,
      earned: false,
      progress: 3,
      progressMax: 5,
      icon: Star,
    },
    {
      id: '6',
      name: 'Millionaire Investor',
      description: 'Reach $1,000,000 portfolio value',
      points: 1000,
      earned: false,
      progress: 350000,
      progressMax: 1000000,
      icon: Unlock,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rewards & Achievements</h1>
        <p className="mt-1 text-muted-foreground">Earn points and unlock achievements by completing actions.</p>
      </div>

      {/* Points Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Points</p>
          <p className="mt-2 text-4xl font-bold text-primary">1,250</p>
          <p className="mt-2 text-xs text-muted-foreground">Accumulated from achievements</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Achievements Earned</p>
          <p className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-400">3 of 6</p>
          <p className="mt-2 text-xs text-muted-foreground">Keep going to unlock more!</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Current Tier</p>
          <p className="mt-2 text-4xl font-bold text-blue-600 dark:text-blue-400">Silver</p>
          <p className="mt-2 text-xs text-muted-foreground">Gold tier at 2000 points</p>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Achievements</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const Icon = reward.icon
            return (
              <div
                key={reward.id}
                className={`rounded-lg border p-4 transition-all ${
                  reward.earned
                    ? 'border-primary bg-blue-50 dark:bg-blue-950'
                    : 'border-border hover:border-primary'
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
                    <p className="text-xs text-muted-foreground">Earned on {reward.earnedDate}</p>
                    <span className="inline-block rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
                      +{reward.points} points
                    </span>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Progress</p>
                      <p className="text-xs font-semibold text-foreground">
                        {reward.progress}/{reward.progressMax}
                      </p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${(reward.progress / reward.progressMax) * 100}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-primary font-semibold">+{reward.points} points when completed</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Tier Benefits</h2>
        <div className="space-y-3">
          {[
            { tier: 'Bronze', points: '0-500', benefits: ['Basic support', 'Community access'] },
            { tier: 'Silver', points: '501-1500', benefits: ['Priority support', 'Exclusive webinars', '5% trading discount'] },
            { tier: 'Gold', points: '1501-3000', benefits: ['24/7 support', 'Private advisor', '10% trading discount', 'Early feature access'] },
            { tier: 'Platinum', points: '3000+', benefits: ['Dedicated advisor', '15% trading discount', 'Custom strategies', 'VIP events'] },
          ].map((tier, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-foreground">{tier.tier}</p>
                  <p className="text-xs text-muted-foreground">{tier.points} points</p>
                </div>
                {tier.tier === 'Silver' && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Benefits: {tier.benefits.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem Points */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Redeem Points</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Trading Credit', cost: 500, icon: '💳' },
            { name: 'Premium Course', cost: 750, icon: '📚' },
            { name: 'Month of Premium', cost: 1000, icon: '✨' },
            { name: 'Exclusive Report', cost: 300, icon: '📊' },
          ].map((item, idx) => (
            <button
              key={idx}
              className="rounded-lg border border-border bg-background p-4 text-center hover:bg-secondary transition-colors"
            >
              <p className="text-2xl">{item.icon}</p>
              <p className="mt-2 font-semibold text-foreground">{item.name}</p>
              <p className="mt-1 text-sm text-primary font-semibold">{item.cost} points</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
