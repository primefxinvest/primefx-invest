'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import { StatusCardGrid, statusCardAdminSurfaceClass } from '@/components/shared/status-cards'
import { formatCurrency } from '@/lib/data/format'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import {
  adminBulkAssignDisplayRank,
  adminBulkUpdateInvestmentStatus,
  adminLogInvestmentExported,
  adminSendInvestmentNotification,
} from '@/lib/admin/investment-actions'
import {
  exportInvestmentsCsv,
  exportInvestmentsExcel,
  printInvestmentsPdf,
} from '@/lib/admin/investment-export'
import type {
  AdminDisplayRank,
  AdminInvestmentActivityRow,
  AdminInvestmentAnalytics,
  AdminInvestmentRow,
  AdminInvestmentStats,
} from '@/lib/admin/investment-types'
import { isAdminMutationFailure } from '@/lib/admin/mutation-result'
import { cn } from '@/lib/utils'

type FilterKey =
  | 'all'
  | 'starter'
  | 'growth'
  | 'prime'
  | 'elite'
  | 'active'
  | 'completed'
  | 'locked'
  | 'withdrawable'
  | 'newest'
  | 'oldest'
  | 'highest_profit'
  | 'highest_investment'

const FILTER_OPTIONS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'starter', label: 'Starter' },
  { id: 'growth', label: 'Growth' },
  { id: 'prime', label: 'Prime' },
  { id: 'elite', label: 'Elite' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'locked', label: 'Locked' },
  { id: 'withdrawable', label: 'Withdrawable' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'highest_profit', label: 'Highest Profit' },
  { id: 'highest_investment', label: 'Highest Investment' },
]

const CHART_COLORS = ['#0052ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

function matchesTier(row: AdminInvestmentRow, tier: string) {
  const plan = row.plan_name.toLowerCase()
  const investor = (row.investor_tier ?? '').toLowerCase()
  return plan.includes(tier) || investor.includes(tier)
}

function isLocked(row: AdminInvestmentRow) {
  if (!row.capital_withdrawal_unlock_at) return false
  return new Date(row.capital_withdrawal_unlock_at).getTime() > Date.now()
}

function isWithdrawable(row: AdminInvestmentRow) {
  if (!row.capital_withdrawal_unlock_at) return true
  return new Date(row.capital_withdrawal_unlock_at).getTime() <= Date.now()
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

interface AdminInvestmentsViewProps {
  investments: AdminInvestmentRow[]
  stats: AdminInvestmentStats
  analytics: AdminInvestmentAnalytics
  activity: AdminInvestmentActivityRow[]
  ranks: AdminDisplayRank[]
}

export function AdminInvestmentsView({
  investments,
  stats,
  analytics,
  activity,
  ranks,
}: AdminInvestmentsViewProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = investments.filter((row) => {
      if (!q) return true
      return (
        row.user_name?.toLowerCase().includes(q) ||
        row.user_email.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        (row.reference_id ?? '').toLowerCase().includes(q) ||
        row.plan_name.toLowerCase().includes(q)
      )
    })

    if (filter === 'starter') rows = rows.filter((r) => matchesTier(r, 'starter'))
    if (filter === 'growth') rows = rows.filter((r) => matchesTier(r, 'growth'))
    if (filter === 'prime') rows = rows.filter((r) => matchesTier(r, 'prime'))
    if (filter === 'elite') rows = rows.filter((r) => matchesTier(r, 'elite'))
    if (filter === 'active') rows = rows.filter((r) => r.status.toLowerCase() === 'active')
    if (filter === 'completed') rows = rows.filter((r) => r.status.toLowerCase() !== 'active')
    if (filter === 'locked') rows = rows.filter(isLocked)
    if (filter === 'withdrawable') rows = rows.filter(isWithdrawable)

    if (filter === 'newest' || filter === 'all')
      rows = [...rows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    if (filter === 'oldest')
      rows = [...rows].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    if (filter === 'highest_profit')
      rows = [...rows].sort((a, b) => b.accumulated_profit - a.accumulated_profit)
    if (filter === 'highest_investment')
      rows = [...rows].sort((a, b) => b.amount - a.amount)

    return rows
  }, [investments, query, filter])

  const selectedRows = filtered.filter((r) => selected.has(r.id))
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((r) => r.id)))
  }

  const runExport = async (kind: 'csv' | 'excel' | 'pdf') => {
    const rows = selectedRows.length ? selectedRows : filtered
    if (kind === 'csv') exportInvestmentsCsv(rows)
    if (kind === 'excel') exportInvestmentsExcel(rows)
    if (kind === 'pdf') printInvestmentsPdf(rows)
    startTransition(async () => {
      await adminLogInvestmentExported(kind, rows.length)
    })
    toast.success(`Exported ${rows.length} investments`)
  }

  const runBulkStatus = (status: string) => {
    const ids = selectedRows.map((r) => r.id)
    if (!ids.length) return toast.error('Select investments first')
    startTransition(async () => {
      const result = await adminBulkUpdateInvestmentStatus(ids, status)
      if (isAdminMutationFailure(result)) toast.error(result.error)
      else {
        toast.success(`Updated ${ids.length} investments`)
        setSelected(new Set())
      }
    })
  }

  const runBulkRank = (rankId: string) => {
    const userIds = [...new Set(selectedRows.map((r) => r.user_id))]
    if (!userIds.length) return toast.error('Select investments first')
    startTransition(async () => {
      const result = await adminBulkAssignDisplayRank(userIds, rankId || null)
      if (isAdminMutationFailure(result)) toast.error(result.error)
      else {
        toast.success(`Updated rank for ${userIds.length} users`)
        setSelected(new Set())
      }
    })
  }

  const runBulkNotify = () => {
    const userIds = [...new Set(selectedRows.map((r) => r.user_id))]
    if (!userIds.length) return toast.error('Select investments first')
    const message = window.prompt('Notification message for selected users:')
    if (!message?.trim()) return
    startTransition(async () => {
      const result = await adminSendInvestmentNotification(userIds, message.trim())
      if (isAdminMutationFailure(result)) toast.error(result.error)
      else toast.success('Notification logged and queued')
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Investment Management"
        description="Monitor all investor positions, profits, ranks, and exports."
        action={
          <Link
            href="/admin/investments/ranks"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted/50"
          >
            Rank Management
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <StatusCardGrid className="grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {[
          { label: 'Active Investments', value: String(stats.totalActive), icon: TrendingUp },
          { label: 'Total Invested', value: formatCurrency(stats.totalInvestedCapital), icon: TrendingUp },
          { label: 'Outstanding Profit', value: formatCurrency(stats.totalOutstandingProfit), icon: TrendingUp },
          { label: "Today's Profit", value: formatCurrency(stats.todayProfit), icon: TrendingUp },
          { label: 'Avg ROI', value: `${stats.averageRoi.toFixed(1)}%`, icon: TrendingUp },
        ].map((card) => (
          <div key={card.label} className={statusCardAdminSurfaceClass}>
            <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </StatusCardGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground">Investment Growth</h3>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.investmentGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#0052ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground">Plan Distribution</h3>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.planDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {analytics.planDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-sm lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, investment ID, plan…"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => runExport('csv')} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button type="button" onClick={() => runExport('excel')} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>
          <button type="button" onClick={() => runExport('pdf')} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold">
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
              filter === opt.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <span className="text-xs font-semibold text-primary">{selected.size} selected</span>
          <button type="button" disabled={pending} onClick={() => runBulkStatus('Active')} className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">Bulk Activate</button>
          <button type="button" disabled={pending} onClick={() => runBulkStatus('Suspended')} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">Bulk Suspend</button>
          <select disabled={pending} onChange={(e) => runBulkRank(e.target.value)} defaultValue="" className="rounded-md border px-2 py-1 text-xs">
            <option value="" disabled>Bulk Change Rank</option>
            {ranks.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button type="button" disabled={pending} onClick={runBulkNotify} className="rounded-md border px-2.5 py-1 text-xs font-semibold">Bulk Notify</button>
        </div>
      ) : null}

      <AdminTableCard>
        <table className="min-w-[1200px] w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-3 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
              <th className="px-3 py-3 font-semibold">Investment ID</th>
              <th className="px-3 py-3 font-semibold">User</th>
              <th className="px-3 py-3 font-semibold">Plan</th>
              <th className="px-3 py-3 font-semibold">Invested</th>
              <th className="px-3 py-3 font-semibold">Current</th>
              <th className="px-3 py-3 font-semibold">Profit</th>
              <th className="px-3 py-3 font-semibold">Weekly %</th>
              <th className="px-3 py-3 font-semibold">Daily</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Start</th>
              <th className="px-3 py-3 font-semibold">Next Profit</th>
              <th className="px-3 py-3 font-semibold">Unlock</th>
              <th className="px-3 py-3 font-semibold">ROI</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const roi = row.amount > 0 ? ((row.current_value - row.amount) / row.amount) * 100 : 0
              return (
                <tr key={row.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => {
                        const next = new Set(selected)
                        if (next.has(row.id)) next.delete(row.id)
                        else next.add(row.id)
                        setSelected(next)
                      }}
                    />
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px]">{row.reference_id ?? row.id.slice(0, 8)}</td>
                  <td className="px-3 py-3">
                    <Link href={`/admin/users/${row.user_id}`} className="flex items-center gap-2 hover:text-primary">
                      <img src={row.user_avatar ?? getDefaultAvatarUrl(row.user_email)} alt="" className="h-7 w-7 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{row.user_name ?? '—'}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{row.user_email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.plan_name}</td>
                  <td className="px-3 py-3 font-semibold">{formatCurrency(row.amount)}</td>
                  <td className="px-3 py-3">{formatCurrency(row.current_value)}</td>
                  <td className="px-3 py-3 text-emerald-600 font-semibold">{formatCurrency(row.accumulated_profit)}</td>
                  <td className="px-3 py-3">{row.roi_percentage.toFixed(2)}%</td>
                  <td className="px-3 py-3">{formatCurrency(row.daily_profit)}</td>
                  <td className="px-3 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', row.status.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">{formatDate(row.start_date)}</td>
                  <td className="px-3 py-3">{formatDate(row.next_payout_at)}</td>
                  <td className="px-3 py-3">{formatDate(row.capital_withdrawal_unlock_at)}</td>
                  <td className="px-3 py-3 font-semibold">{roi.toFixed(1)}%</td>
                  <td className="px-3 py-3">
                    <Link href={`/admin/investments/${row.id}`} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold hover:bg-muted">
                      <Eye className="h-3 w-3" /> View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </AdminTableCard>

      <section className="rounded-xl border border-border bg-card/80 p-4">
        <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
        <ul className="mt-3 space-y-2">
          {activity.length === 0 ? (
            <li className="text-xs text-muted-foreground">No investment management activity yet.</li>
          ) : (
            activity.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                <div>
                  <span className="font-semibold text-foreground">{item.action.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground"> · {item.admin_email ?? 'Admin'}</span>
                </div>
                <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
