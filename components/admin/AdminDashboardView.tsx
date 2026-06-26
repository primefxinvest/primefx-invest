'use client'

import { BarChart3, CheckCircle2, Clock, DollarSign, TrendingUp, Users } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { formatCurrency, formatDateTime } from '@/lib/data/format'
import type { AdminDashboardMetrics } from '@/lib/admin/types'

export function AdminDashboardView({ metrics }: { metrics: AdminDashboardMetrics }) {
  const cards = [
    { label: 'Total Users', value: metrics.totalUsers.toLocaleString(), icon: Users },
    { label: 'AUM', value: formatCurrency(metrics.totalAum), icon: DollarSign },
    { label: 'Active Investments', value: metrics.activeInvestors.toLocaleString(), icon: TrendingUp },
    {
      label: 'Net Flow',
      value: formatCurrency(metrics.totalDeposits - metrics.totalWithdrawals, { signed: false }),
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard" description="Platform overview and analytics" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
                </div>
                <Icon className="h-8 w-8 text-primary opacity-20" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-foreground">Recent Transactions</h3>
          <div className="space-y-3">
            {metrics.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              metrics.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg bg-background p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize text-foreground">
                      {tx.type} — {tx.user_name || tx.user_email}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(tx.amount)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</p>
                  </div>
                  <div>
                    {tx.status.toLowerCase() === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Quick Stats</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending KYC</p>
              <p className="text-2xl font-bold text-foreground">{metrics.pendingKyc}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-foreground">{metrics.pendingWithdrawals}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Deposits</p>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(metrics.totalDeposits)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawals</p>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(metrics.totalWithdrawals)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Recent Admin Actions</h3>
        <div className="space-y-3">
          {metrics.recentAuditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin actions logged yet.</p>
          ) : (
            metrics.recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg bg-background p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.module} · {log.admin_email ?? 'Admin'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
