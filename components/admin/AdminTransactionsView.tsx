'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusCardGrid, statusCardAdminSurfaceClass } from '@/components/shared/status-cards'
import { updateTransactionStatus } from '@/lib/admin/actions'
import type { AdminTransactionRow } from '@/lib/admin/types'
import { formatCurrency, formatDateTime } from '@/lib/data/format'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'pending' | 'completed' | 'failed'

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const styles =
    normalized === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'pending'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700'

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:px-2.5 sm:text-xs', styles)}>
      {status}
    </span>
  )
}

function StatusIcon({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  if (normalized === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (normalized === 'pending') return <Clock className="h-4 w-4 text-amber-500" />
  return <XCircle className="h-4 w-4 text-red-500" />
}

export function AdminTransactionsView({ transactions }: { transactions: AdminTransactionRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [pending, startTransition] = useTransition()

  const types = useMemo(
    () => [...new Set(transactions.map((tx) => tx.type.toLowerCase()))].sort(),
    [transactions]
  )

  const stats = useMemo(() => {
    const pendingCount = transactions.filter((tx) => tx.status.toLowerCase() === 'pending').length
    const completedCount = transactions.filter((tx) => tx.status.toLowerCase() === 'completed').length
    const failedCount = transactions.filter((tx) =>
      ['failed', 'rejected'].includes(tx.status.toLowerCase())
    ).length
    const depositVolume = transactions
      .filter((tx) => ['deposit', 'bonus', 'profit'].includes(tx.type.toLowerCase()))
      .reduce((sum, tx) => sum + tx.amount, 0)
    const withdrawalVolume = transactions
      .filter((tx) => tx.type.toLowerCase() === 'withdrawal')
      .reduce((sum, tx) => sum + tx.amount, 0)

    return {
      total: transactions.length,
      pending: pendingCount,
      completed: completedCount,
      failed: failedCount,
      depositVolume,
      withdrawalVolume,
    }
  }, [transactions])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return transactions.filter((tx) => {
      const status = tx.status.toLowerCase()

      if (statusFilter === 'pending' && status !== 'pending') return false
      if (statusFilter === 'completed' && status !== 'completed') return false
      if (statusFilter === 'failed' && !['failed', 'rejected'].includes(status)) return false
      if (typeFilter !== 'all' && tx.type.toLowerCase() !== typeFilter) return false

      if (!term) return true

      return (
        tx.user_email.toLowerCase().includes(term) ||
        (tx.user_name?.toLowerCase().includes(term) ?? false) ||
        tx.type.toLowerCase().includes(term) ||
        (tx.reference_id?.toLowerCase().includes(term) ?? false) ||
        tx.id.toLowerCase().includes(term)
      )
    })
  }, [search, statusFilter, typeFilter, transactions])

  const handleStatus = (tx: AdminTransactionRow, status: 'Completed' | 'Rejected') => {
    startTransition(async () => {
      try {
        await updateTransactionStatus(tx.id, status)
        const type = tx.type.toLowerCase()
        if (status === 'Completed') {
          if (type === 'deposit' || type === 'bonus' || type === 'profit') {
            toast.success('Transaction approved — wallet balance updated')
          } else {
            toast.success('Transaction approved')
          }
        } else if (type === 'withdrawal') {
          toast.success('Transaction rejected — funds returned to wallet')
        } else {
          toast.success('Transaction rejected')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update transaction')
      }
    })
  }

  const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'failed', label: 'Failed', count: stats.failed },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Transaction Management"
        description="Review, approve, and monitor platform transactions"
      />

      <StatusCardGrid columns={4}>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Total</p>
          <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{stats.total}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">All transactions</p>
        </div>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Pending</p>
          <p className="mt-1 text-lg font-bold text-amber-600 sm:mt-2 sm:text-2xl">{stats.pending}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">Awaiting review</p>
        </div>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Completed</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 sm:mt-2 sm:text-2xl">{stats.completed}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">Successfully processed</p>
        </div>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Failed</p>
          <p className="mt-1 text-lg font-bold text-red-600 sm:mt-2 sm:text-2xl">{stats.failed}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">Rejected or failed</p>
        </div>
      </StatusCardGrid>

      <StatusCardGrid columns={2} className="xl:grid-cols-2">
        <div className={cn(statusCardAdminSurfaceClass, 'flex items-center justify-between gap-3')}>
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <ArrowDownLeft className="h-4 w-4 shrink-0" />
            <span className="text-[11px] sm:text-sm">Inflow volume</span>
          </div>
          <span className="text-sm font-bold text-emerald-700 sm:text-base">
            {formatCurrency(stats.depositVolume)}
          </span>
        </div>
        <div className={cn(statusCardAdminSurfaceClass, 'flex items-center justify-between gap-3')}>
          <div className="flex items-center gap-2 text-sm text-orange-800">
            <ArrowUpRight className="h-4 w-4 shrink-0" />
            <span className="text-[11px] sm:text-sm">Outflow volume</span>
          </div>
          <span className="text-sm font-bold text-orange-700 sm:text-base">
            {formatCurrency(stats.withdrawalVolume)}
          </span>
        </div>
      </StatusCardGrid>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:max-w-md sm:px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, type, or reference…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
          >
            <option value="all">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatusFilter(filter.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
              statusFilter === filter.key
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            {filter.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px]',
                statusFilter === filter.key ? 'bg-white/20' : 'bg-background'
              )}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className={cn(statusCardAdminSurfaceClass, 'py-10 text-center text-sm text-muted-foreground')}>
            No transactions found.
          </div>
        ) : (
          filtered.map((tx) => (
            <article key={tx.id} className={statusCardAdminSurfaceClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold capitalize text-foreground">{tx.type}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {tx.user_name || tx.user_email}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {tx.reference_id || tx.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-base font-bold',
                      tx.type.toLowerCase() === 'withdrawal' ? 'text-orange-600' : 'text-emerald-600'
                    )}
                  >
                    {formatCurrency(tx.amount)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <StatusIcon status={tx.status} />
                  </div>
                </div>
              </div>

              {tx.status.toLowerCase() === 'pending' ? (
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleStatus(tx, 'Completed')}
                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleStatus(tx, 'Rejected')}
                    className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-6">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-6">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-6">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-6">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-6">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-6">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-background/80">
                    <td className="px-4 py-4 font-mono text-xs lg:px-6">
                      {tx.reference_id || tx.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <p className="font-medium">{tx.user_name || tx.user_email}</p>
                      {tx.user_name ? (
                        <p className="text-xs text-muted-foreground">{tx.user_email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 capitalize text-muted-foreground lg:px-6">{tx.type}</td>
                    <td className="px-4 py-4 font-semibold lg:px-6">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={tx.status} />
                        <StatusBadge status={tx.status} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground lg:px-6">
                      {formatDateTime(tx.created_at)}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      {tx.status.toLowerCase() === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleStatus(tx, 'Completed')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleStatus(tx, 'Rejected')}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : pending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
