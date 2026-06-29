'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AdminTierPieTooltip,
  AdminVolumeTooltip,
  formatChartMonth,
} from '@/components/admin/AdminChartTooltips'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusCardGrid } from '@/components/shared/status-cards'
import {
  chartAxisStyle,
  chartGridStyle,
  chartTooltipWrapperProps,
} from '@/components/charts/ChartTooltip'
import { formatCurrency, formatDateTime } from '@/lib/data/format'
import type { AdminDashboardMetrics } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

const TIER_COLORS = ['#0052ff', '#10b981', '#f97316', '#8b5cf6', '#ec4899']
const TX_STATUS_COLORS = { pending: '#f97316', completed: '#10b981', failed: '#ef4444' }

type TxFilter = 'all' | 'pending' | 'completed'

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const styles =
    normalized === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'pending'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700'

  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', styles)}>
      {status}
    </span>
  )
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  accent?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const accentRing = {
    primary: 'hover:border-primary/40 hover:shadow-primary/10',
    success: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
    warning: 'hover:border-amber-300 hover:shadow-amber-500/10',
    danger: 'hover:border-red-300 hover:shadow-red-500/10',
  }[accent ?? 'primary']

  const content = (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card p-3 transition-all duration-200 sm:p-4 xl:p-5',
        href && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
        href && accentRing
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-1 text-lg font-bold tracking-tight text-foreground sm:mt-2 sm:text-2xl">{value}</p>
          {sub ? <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">{sub}</p> : null}
        </div>
        <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/15 sm:p-2.5">
          <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        </div>
      </div>
      {href ? (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View details <ExternalLink className="h-3 w-3" />
        </p>
      ) : null}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function QuickAction({
  href,
  label,
  description,
  badge,
  icon: Icon,
}: {
  href: string
  label: string
  description: string
  badge?: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {badge != null && badge > 0 ? (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

export function AdminDashboardView({ metrics }: { metrics: AdminDashboardMetrics }) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const [txFilter, setTxFilter] = useState<TxFilter>('all')
  const [chartMode, setChartMode] = useState<'volume' | 'tiers'>('volume')
  const [activeTierIndex, setActiveTierIndex] = useState<number | undefined>(undefined)

  const totalTierUsers =
    Object.values(metrics.tierDistribution).reduce((a, b) => a + b, 0) || 1

  const monthlyVolume = useMemo(
    () =>
      metrics.monthlyVolume.map((row) => ({
        ...row,
        label: formatChartMonth(row.month),
      })),
    [metrics.monthlyVolume]
  )

  const tierChartData = useMemo(
    () =>
      Object.entries(metrics.tierDistribution).map(([name, value], index) => ({
        name,
        value,
        color: TIER_COLORS[index % TIER_COLORS.length],
        percent: Math.round((value / totalTierUsers) * 100),
      })),
    [metrics.tierDistribution, totalTierUsers]
  )

  const txStatusData = useMemo(
    () => [
      { name: 'Pending', value: metrics.transactionBreakdown.pending, key: 'pending' },
      { name: 'Completed', value: metrics.transactionBreakdown.completed, key: 'completed' },
      { name: 'Failed', value: metrics.transactionBreakdown.failed, key: 'failed' },
    ],
    [metrics.transactionBreakdown]
  )

  const filteredTransactions = useMemo(() => {
    if (txFilter === 'all') return metrics.recentTransactions
    return metrics.recentTransactions.filter(
      (tx) => tx.status.toLowerCase() === txFilter
    )
  }, [metrics.recentTransactions, txFilter])

  const handleRefresh = () => {
    startRefresh(() => {
      router.refresh()
    })
  }

  const pendingActions =
    metrics.pendingKyc + metrics.pendingDeposits + metrics.pendingWithdrawals

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Live platform overview — monitor growth, flows, and actions"
        action={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-background disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        }
      />

      {pendingActions > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <strong>{pendingActions}</strong> item{pendingActions === 1 ? '' : 's'} need attention —
            review pending KYC, deposits, or withdrawals.
          </span>
          <Link href="/admin/transactions" className="font-semibold text-amber-900 underline">
            Open queue
          </Link>
        </div>
      ) : null}

      <StatusCardGrid columns={4}>
        <MetricCard
          label="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          sub={`${tierChartData.length} investor tiers`}
          icon={Users}
          href="/admin/users"
        />
        <MetricCard
          label="Assets Under Management"
          value={formatCurrency(metrics.totalAum)}
          sub="Sum of all wallet balances"
          icon={Wallet}
          href="/admin/wallets"
          accent="success"
        />
        <MetricCard
          label="Active Investments"
          value={metrics.activeInvestors.toLocaleString()}
          sub="Open positions"
          icon={TrendingUp}
          href="/admin/plans"
        />
        <MetricCard
          label="Net Platform Flow"
          value={formatCurrency(metrics.netFlow, { signed: true })}
          sub={`${formatCurrency(metrics.totalDeposits)} in · ${formatCurrency(metrics.totalWithdrawals)} out`}
          icon={BarChart3}
          href="/admin/analytics"
        />
      </StatusCardGrid>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-foreground">Platform insights</h3>
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              {(['volume', 'tiers'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setChartMode(mode)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                    chartMode === mode
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {mode === 'volume' ? 'Cash flow' : 'Investor tiers'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            {chartMode === 'volume' ? (
              monthlyVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyVolume}
                    margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                    barCategoryGap={monthlyVolume.length === 1 ? '35%' : '18%'}
                  >
                    <CartesianGrid {...chartGridStyle} />
                    <XAxis dataKey="label" {...chartAxisStyle} dy={8} />
                    <YAxis
                      {...chartAxisStyle}
                      width={48}
                      tickFormatter={(v) =>
                        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                    />
                    <Tooltip
                      {...chartTooltipWrapperProps}
                      cursor={{ fill: 'rgba(0, 82, 255, 0.06)', radius: 6 }}
                      content={<AdminVolumeTooltip />}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="deposits"
                      fill="#0052ff"
                      name="Deposits"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                      activeBar={{ fill: '#0041cc' }}
                    />
                    <Bar
                      dataKey="withdrawals"
                      fill="#f97316"
                      name="Withdrawals"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                      activeBar={{ fill: '#ea580c' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No completed transaction volume yet.
                </div>
              )
            ) : tierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={activeTierIndex !== undefined ? 100 : 92}
                    paddingAngle={3}
                    onMouseEnter={(_, index) => setActiveTierIndex(index)}
                    onMouseLeave={() => setActiveTierIndex(undefined)}
                  >
                    {tierChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        opacity={
                          activeTierIndex === undefined || activeTierIndex === index ? 1 : 0.45
                        }
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    {...chartTooltipWrapperProps}
                    content={<AdminTierPieTooltip />}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No investor tier data yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">Quick actions</h3>
            <div className="space-y-2">
              <QuickAction
                href="/admin/kyc"
                label="KYC queue"
                description="Review identity submissions"
                badge={metrics.pendingKyc}
                icon={Shield}
              />
              <QuickAction
                href="/admin/transactions"
                label="Transactions"
                description="Approve deposits & withdrawals"
                badge={metrics.pendingDeposits + metrics.pendingWithdrawals}
                icon={DollarSign}
              />
              <QuickAction
                href="/admin/users"
                label="User management"
                description="Accounts, tiers, 2FA"
                icon={Users}
              />
              <QuickAction
                href="/admin/analytics"
                label="Full analytics"
                description="Deep reports & charts"
                icon={BarChart3}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Transaction health</h3>
            <div className="space-y-3">
              {txStatusData.map((item) => (
                <div key={item.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-foreground">{item.name}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.value /
                            Math.max(
                              1,
                              metrics.transactionBreakdown.pending +
                                metrics.transactionBreakdown.completed +
                                metrics.transactionBreakdown.failed
                            )) *
                            100
                        )}%`,
                        backgroundColor:
                          TX_STATUS_COLORS[item.key as keyof typeof TX_STATUS_COLORS],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-foreground">Recent transactions</h3>
            <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-background p-0.5">
              {(['all', 'pending', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTxFilter(filter)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors',
                    txFilter === filter
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No {txFilter === 'all' ? '' : txFilter} transactions to show.
              </p>
            ) : (
              filteredTransactions.map((tx) => (
                <Link
                  key={tx.id}
                  href="/admin/transactions"
                  className="flex items-center justify-between gap-3 rounded-lg border border-transparent bg-background p-3 transition-all hover:border-border hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium capitalize text-foreground">{tx.type}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {tx.user_name || tx.user_email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(tx.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'font-bold',
                        tx.type.toLowerCase() === 'withdrawal'
                          ? 'text-orange-600'
                          : 'text-emerald-600'
                      )}
                    >
                      {tx.type.toLowerCase() === 'withdrawal' ? '−' : '+'}
                      {formatCurrency(tx.amount)}
                    </p>
                    {tx.status.toLowerCase() === 'completed' ? (
                      <CheckCircle2 className="ml-auto mt-1 h-4 w-4 text-emerald-500" />
                    ) : tx.status.toLowerCase() === 'pending' ? (
                      <Clock className="ml-auto mt-1 h-4 w-4 text-amber-500" />
                    ) : (
                      <XCircle className="ml-auto mt-1 h-4 w-4 text-red-500" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/admin/transactions"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all transactions <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">Flow summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <ArrowUpRight className="h-4 w-4" />
                  Deposits
                </div>
                <span className="font-bold text-emerald-800">
                  {formatCurrency(metrics.totalDeposits)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <ArrowDownRight className="h-4 w-4" />
                  Withdrawals
                </div>
                <span className="font-bold text-orange-800">
                  {formatCurrency(metrics.totalWithdrawals)}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending deposits</span>
                  <span className="font-semibold">{metrics.pendingDeposits}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending withdrawals</span>
                  <span className="font-semibold">{metrics.pendingWithdrawals}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending KYC</span>
                  <span className="font-semibold">{metrics.pendingKyc}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Admin activity
            </h3>
            <div className="space-y-2">
              {metrics.recentAuditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admin actions logged yet.</p>
              ) : (
                metrics.recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg bg-background px-3 py-2.5 text-sm"
                  >
                    <p className="font-medium capitalize text-foreground">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.module.replace(/_/g, ' ')} · {log.admin_email ?? 'Admin'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/admin/compliance"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Compliance & audit <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
