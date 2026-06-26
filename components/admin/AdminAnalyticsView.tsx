'use client'

import { DollarSign, TrendingUp, Users } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { formatCurrency } from '@/lib/data/format'

interface AnalyticsData {
  totalUsers: number
  totalInvestments: number
  planDistribution: Array<{ name: string; investors: number; weeklyRoi: number }>
  tierDistribution: Record<string, number>
  countryDistribution: Record<string, number>
  completedDeposits: number
  completedWithdrawals: number
  netRevenue: number
}

export function AdminAnalyticsView({ data }: { data: AnalyticsData }) {
  const totalTierUsers = Object.values(data.tierDistribution).reduce((a, b) => a + b, 0) || 1
  const totalPlanInvestors =
    data.planDistribution.reduce((sum, p) => sum + p.investors, 0) || 1

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Analytics Center" description="Detailed platform analytics and insights" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Total Users', value: data.totalUsers.toLocaleString(), icon: Users },
          { label: 'Net Revenue', value: formatCurrency(data.netRevenue), icon: DollarSign },
          { label: 'Investments', value: data.totalInvestments.toLocaleString(), icon: TrendingUp },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                </div>
                <Icon className="h-8 w-8 text-primary opacity-20" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold">Investor Tier Distribution</h3>
          <div className="space-y-4">
            {Object.entries(data.tierDistribution).map(([tier, count]) => {
              const percent = Math.round((count / totalTierUsers) * 100)
              return (
                <div key={tier}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{tier}</span>
                    <span className="text-muted-foreground">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-background">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold">Plan Distribution</h3>
          <div className="space-y-4">
            {data.planDistribution.map((plan) => {
              const percent = Math.round((plan.investors / totalPlanInvestors) * 100)
              return (
                <div key={plan.name}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{plan.name}</span>
                    <span className="text-muted-foreground">
                      {plan.investors.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-background">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-bold">Geographic Distribution</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(data.countryDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([country, count]) => (
              <div key={country} className="rounded-lg bg-background p-3 text-sm">
                <p className="font-medium">{country}</p>
                <p className="text-muted-foreground">{count} users</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
