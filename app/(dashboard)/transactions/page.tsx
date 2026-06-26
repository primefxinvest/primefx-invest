'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Gift,
  Search,
  Send,
  TrendingUp,
  Upload,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { PageHeaderSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletTransactions } from '@/lib/data/queries'
import type { TransactionItem } from '@/lib/data/types'
import { CustomSelect } from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'

const typeIcons: Record<string, typeof Download> = {
  Deposit: Download,
  Withdrawal: Upload,
  Transfer: Send,
  Bonus: Gift,
  Profit: ArrowDownLeft,
  Investment: TrendingUp,
}

const STATUS_OPTIONS = ['All', 'Pending', 'Completed', 'Failed', 'Cancelled'] as const

function statusStyles(status: string) {
  const value = status.toLowerCase()
  if (value === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (value === 'failed' || value === 'rejected' || value === 'cancelled') {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-amber-100 text-amber-700'
}

function StatusIcon({ status }: { status: string }) {
  const value = status.toLowerCase()
  if (value === 'completed') return <CheckCircle2 className="h-3.5 w-3.5" />
  if (value === 'failed' || value === 'rejected' || value === 'cancelled') {
    return <XCircle className="h-3.5 w-3.5" />
  }
  return <Clock className="h-3.5 w-3.5" />
}

function exportTransactionsCsv(rows: TransactionItem[]) {
  const header = ['Type', 'Description', 'Amount', 'Status', 'Date', 'Time', 'Reference']
  const lines = rows.map((tx) =>
    [
      tx.type,
      tx.description ?? '',
      tx.amount,
      tx.status,
      tx.date,
      tx.time ?? '',
      tx.referenceId ?? '',
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  )

  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `primefx-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('All')

  const { data: transactions = [], loading, error, reload } = useAsyncData(
    () => fetchWalletTransactions(),
    []
  )

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === 'All' || tx.type === typeFilter
      const matchesStatus =
        statusFilter === 'All' || tx.status.toLowerCase() === statusFilter.toLowerCase()
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        tx.description?.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query) ||
        tx.referenceId?.toLowerCase().includes(query) ||
        tx.status.toLowerCase().includes(query)
      return matchesType && matchesStatus && matchesSearch
    })
  }, [transactions, search, typeFilter, statusFilter])

  const types = useMemo(() => {
    const unique = new Set(transactions.map((tx) => tx.type))
    return ['All', ...Array.from(unique)]
  }, [transactions])

  const summary = useMemo(() => {
    const completed = transactions.filter((tx) => tx.status.toLowerCase() === 'completed')
    const pending = transactions.filter((tx) => tx.status.toLowerCase() === 'pending')
    const credits = completed.filter((tx) => tx.isCredit).reduce((sum, tx) => sum + tx.amountValue, 0)
    const debits = completed
      .filter((tx) => !tx.isCredit)
      .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0)

    return {
      total: transactions.length,
      pending: pending.length,
      completed: completed.length,
      credits,
      debits,
    }
  }, [transactions])

  const copyReference = async (referenceId: string) => {
    try {
      await navigator.clipboard.writeText(referenceId)
      toast.success('Reference copied')
    } catch {
      toast.error('Failed to copy reference')
    }
  }

  if (loading && !transactions.length) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeaderSkeleton />
        <TableSkeleton rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-muted-foreground">
            View deposits, withdrawals, investments, and track every wallet movement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!filtered.length) {
              toast.error('No transactions to export')
              return
            }
            exportTransactionsCsv(filtered)
            toast.success('Transactions exported')
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total', value: summary.total.toString() },
          { label: 'Pending', value: summary.pending.toString(), tone: 'amber' },
          { label: 'Completed', value: summary.completed.toString(), tone: 'emerald' },
          {
            label: 'Net flow',
            value: `$${(summary.credits - summary.debits).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p
              className={cn(
                'mt-2 text-xl font-bold text-foreground',
                card.tone === 'amber' && 'text-amber-700',
                card.tone === 'emerald' && 'text-emerald-700'
              )}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description, reference, or type..."
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <CustomSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={types.map((type) => ({
                value: type,
                label: type === 'All' ? 'All Types' : type,
              }))}
              placeholder="Type"
              className="min-w-[9rem]"
            />
            <CustomSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as (typeof STATUS_OPTIONS)[number])}
              options={STATUS_OPTIONS.map((status) => ({
                value: status,
                label: status === 'All' ? 'All Statuses' : status,
              }))}
              placeholder="Status"
              className="min-w-[9rem]"
            />
          </div>
        </div>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={filtered.length === 0}
        emptyTitle="No transactions found"
        emptyDescription={
          search || typeFilter !== 'All' || statusFilter !== 'All'
            ? 'Try adjusting your search or filters.'
            : 'Transactions will appear here after your first deposit or investment.'
        }
        skeleton={<TableSkeleton rows={6} cols={5} />}
      >
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-secondary/80">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground sm:px-6">
                    Type
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground sm:px-6">
                    Description
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-muted-foreground sm:px-6">
                    Amount
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground sm:px-6">
                    Date
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground sm:px-6">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((transaction) => {
                  const Icon =
                    typeIcons[transaction.type] ??
                    (transaction.isCredit ? ArrowDownLeft : ArrowUpRight)

                  return (
                    <tr key={transaction.id} className="transition-colors hover:bg-secondary/50">
                      <td className="px-4 py-4 sm:px-6">
                        <div
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5',
                            transaction.isCredit ? 'bg-emerald-100' : 'bg-red-100'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              transaction.isCredit ? 'text-emerald-600' : 'text-red-600'
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              transaction.isCredit ? 'text-emerald-700' : 'text-red-700'
                            )}
                          >
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <p className="text-sm font-semibold text-foreground">
                          {transaction.description ?? transaction.type}
                        </p>
                        {transaction.referenceId ? (
                          <button
                            type="button"
                            onClick={() => copyReference(transaction.referenceId!)}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                          >
                            <Copy className="h-3 w-3" />
                            {transaction.referenceId}
                          </button>
                        ) : null}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-4 text-right text-sm font-bold sm:px-6',
                          transaction.isCredit ? 'text-emerald-600' : 'text-red-600'
                        )}
                      >
                        {transaction.amount}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <p className="text-sm text-foreground">{transaction.date}</p>
                        {transaction.time ? (
                          <p className="text-xs text-muted-foreground">{transaction.time}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                            statusStyles(transaction.status)
                          )}
                        >
                          <StatusIcon status={transaction.status} />
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </AsyncState>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      </div>
    </div>
  )
}
