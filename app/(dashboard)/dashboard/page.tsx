'use client'

import { useState } from 'react'
import {
  Users,
  TrendingUp,
  Award,
  Globe,
  Lock,
  AlertCircle,
  ChevronRight,
  Zap,
  Download,
  Upload,
  Send,
  BookOpen,
  MessageSquare,
  Trophy,
  Share2,
} from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
import { PortfolioChart, AssetAllocationChart } from '@/components/shared/Charts'
import {
  portfolioData,
  chartData,
  assetAllocation,
  investmentPlans,
  recentTransactions,
  marketOverview,
  rewardsData,
  referralData,
  learningProgress,
  securityStatus,
} from '@/lib/mock-data'

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState('This Year')

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, John! 👋</h1>
          <p className="mt-1 text-muted-foreground">Here's your investment overview for today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">May 10, 2024</p>
          <p className="font-semibold text-foreground">Elite Investor</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="h-6 w-6" />}
          label="Total Invested"
          value={portfolioData.totalInvested}
          trend={portfolioData.trends[0].percentage}
          trendColor="green"
        />
        <MetricCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Current Value"
          value={portfolioData.currentValue}
          trend={portfolioData.trends[1].percentage}
          trendColor="green"
        />
        <MetricCard
          icon={<Award className="h-6 w-6" />}
          label="Total Profit"
          value={portfolioData.totalProfit}
          trend={portfolioData.trends[2].percentage}
          trendColor="green"
        />
        <MetricCard
          icon={<Globe className="h-6 w-6" />}
          label="ROI (Overall)"
          value={portfolioData.roiPercentage}
          trend={portfolioData.trends[3].percentage}
          trendColor="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portfolio Performance */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Portfolio Performance</h2>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground outline-none"
            >
              <option>This Year</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          <PortfolioChart data={chartData} />
        </div>

        {/* Asset Allocation */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Asset Allocation</h2>
          <AssetAllocationChart data={assetAllocation} />
          <div className="mt-6 space-y-3">
            {assetAllocation.map((asset) => (
              <div key={asset.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: asset.color }} />
                  <span className="text-muted-foreground">{asset.name}</span>
                </div>
                <span className="font-semibold text-foreground">{asset.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: TrendingUp, label: 'Invest Now', color: 'bg-blue-500' },
            { icon: Download, label: 'Deposit', color: 'bg-emerald-500' },
            { icon: Upload, label: 'Withdraw', color: 'bg-orange-500' },
            { icon: Send, label: 'Transfer', color: 'bg-purple-500' },
            { icon: Zap, label: 'PrimeAI', color: 'bg-indigo-500' },
            { icon: BookOpen, label: 'Academy', color: 'bg-emerald-600' },
          ].map((action, idx) => (
            <button
              key={idx}
              className="flex flex-col items-center gap-2 rounded-lg p-4 hover:bg-secondary transition-colors"
            >
              <div className={`${action.color} rounded-lg p-3 text-white`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Investment Plans */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Top Investment Plans</h2>
          </div>
          <button className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-blue-700">
            View All Plans <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {investmentPlans.map((plan) => (
            <div key={plan.id} className={`rounded-lg border p-6 ${plan.popular ? 'border-primary bg-blue-50 dark:bg-blue-950' : 'border-border'}`}>
              {plan.badge && <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white mb-3">{plan.badge}</span>}
              <h3 className="font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-primary">{plan.weeklyRoi}</p>
              <p className="text-xs text-muted-foreground">Weekly Return</p>
              <button className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                Invest Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - Three Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
            <button className="text-sm font-semibold text-primary hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-secondary p-2">
                    <MessageSquare className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.amount.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{tx.amount}</p>
                  <p className="text-xs text-muted-foreground">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Rewards */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-foreground">Rewards Progress</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{rewardsData.currentTier}</p>
            <p className="text-xs text-muted-foreground mt-1">{rewardsData.points}</p>
            <div className="mt-4 h-2 w-full rounded-full bg-secondary">
              <div className="h-2 w-1/2 rounded-full bg-orange-500" />
            </div>
          </div>

          {/* Referrals */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-foreground">Referral Earnings</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{referralData.totalEarnings}</p>
            <p className="text-xs text-muted-foreground mt-1">{referralData.totalReferrals} Total Referrals</p>
            <button className="mt-4 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
              View Details
            </button>
          </div>

          {/* Learning Progress */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-foreground">Learning Progress</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{learningProgress.completed}%</p>
            <p className="text-xs text-muted-foreground mt-1">{learningProgress.coursesCompleted} Courses Completed</p>
            <div className="mt-4 h-2 w-full rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${learningProgress.completed}%` }} />
            </div>
          </div>

          {/* Security */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-foreground">Security Status</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-500">{securityStatus.status}</p>
            <p className="text-xs text-muted-foreground mt-1">{securityStatus.score}/100</p>
            <div className="mt-4 h-2 w-full rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${securityStatus.score}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
