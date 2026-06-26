'use client'

import { BarChart3, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AdminDashboard() {
  const metrics = [
    { label: 'Total Users', value: '24,850', change: '+12.5%', icon: Users },
    { label: 'AUM', value: '$250M+', change: '+8.3%', icon: DollarSign },
    { label: 'Active Investments', value: '15,420', change: '+5.2%', icon: TrendingUp },
    { label: 'Daily Revenue', value: '$125K', change: '+3.1%', icon: BarChart3 },
  ]

  const recentActivities = [
    { type: 'signup', user: 'John Doe', time: '5 min ago', status: 'completed' },
    { type: 'investment', user: 'Jane Smith', amount: '$5,000', time: '15 min ago', status: 'completed' },
    { type: 'withdrawal', user: 'Mike Johnson', amount: '$2,500', time: '32 min ago', status: 'pending' },
    { type: 'kyc', user: 'Sarah Williams', time: '1 hour ago', status: 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Platform overview and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground capitalize">{activity.type} - {activity.user}</p>
                  {'amount' in activity && <p className="text-sm text-muted-foreground">{activity.amount}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
                <div>
                  {activity.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending KYC</p>
              <p className="text-2xl font-bold text-foreground">342</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-foreground">28</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">System Health</p>
              <div className="mt-2 w-full bg-background rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: '99%' }}></div>
              </div>
              <p className="text-xs text-accent mt-1">99% uptime</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold text-foreground">8,430</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Database Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Query Performance</span>
              <span className="text-accent">98ms avg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Connection Pool</span>
              <span className="text-accent">42/50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Replication Lag</span>
              <span className="text-accent">&lt;1ms</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">API Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Response Time</span>
              <span className="text-accent">245ms avg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Error Rate</span>
              <span className="text-accent">0.02%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Requests/sec</span>
              <span className="text-accent">1,250</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
