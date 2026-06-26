'use client'

import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Analytics Center</h2>
        <p className="text-muted-foreground mt-1">Detailed platform analytics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: '$2.5M', change: '+24.5%', icon: DollarSign },
          { label: 'New Users', value: '5,240', change: '+12.3%', icon: Users },
          { label: 'Conversion Rate', value: '3.8%', change: '+0.5%', icon: TrendingUp },
          { label: 'Active Investments', value: '15,420', change: '+8.7%', icon: Activity },
        ].map((metric, idx) => {
          const Icon = metric.icon
          return (
            <div key={idx} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                  <p className="text-accent text-sm mt-2">{metric.change}</p>
                </div>
                <Icon className="h-8 w-8 text-primary opacity-20" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">User Acquisition</h3>
          <div className="space-y-4">
            {[
              { source: 'Organic', users: 3240, percent: 45 },
              { source: 'Paid Ads', users: 2100, percent: 29 },
              { source: 'Referral', users: 1420, percent: 20 },
              { source: 'Other', users: 480, percent: 6 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground">{item.source}</span>
                  <span className="text-muted-foreground text-sm">{item.users.toLocaleString()} ({item.percent}%)</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${item.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Plan Distribution</h3>
          <div className="space-y-4">
            {[
              { name: 'Starter', users: 12450, percent: 50 },
              { name: 'Growth', users: 7320, percent: 29 },
              { name: 'Prime', users: 3640, percent: 15 },
              { name: 'Elite', users: 1440, percent: 6 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground">{item.name} Plan</span>
                  <span className="text-muted-foreground text-sm">{item.users.toLocaleString()} ({item.percent}%)</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${item.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
