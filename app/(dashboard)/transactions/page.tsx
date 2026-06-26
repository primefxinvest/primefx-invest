'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Filter,
  Search,
  Gift,
  Send,
  Upload,
} from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { PageHeaderSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletTransactions } from '@/lib/data/queries'
import { CustomSelect } from '@/components/ui/custom-select'

const typeIcons: Record<string, typeof Download> = {
  Deposit: Download,
  Withdraw: Upload,
  Withdrawal: Upload,
  Transfer: Send,
  Bonus: Gift,
  Profit: ArrowDownLeft,
}

function isIncoming(type: string) {
  const value = type.toLowerCase()
  return value.includes('deposit') || value.includes('profit') || value.includes('bonus')
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const { data: transactions = [], loading, error, reload } = useAsyncData(
    () => fetchWalletTransactions(),
    []
  )

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === 'All' || tx.type === typeFilter
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        tx.description?.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query) ||
        tx.referenceId?.toLowerCase().includes(query)
      return matchesType && matchesSearch
    })
  }, [transactions, search, typeFilter])

  const types = useMemo(() => {
    const unique = new Set(transactions.map((tx) => tx.type))
    return ['All', ...Array.from(unique)]
  }, [transactions])

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
            View and manage all your investment transactions.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-secondary"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <CustomSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={types.map((type) => ({
                value: type,
                label: type === 'All' ? 'All Types' : type,
              }))}
              placeholder="Filter type"
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
          search || typeFilter !== 'All'
            ? 'Try adjusting your search or filters.'
            : 'Transactions will appear here after your first deposit or investment.'
        }
        skeleton={<TableSkeleton rows={6} cols={5} />}
      >
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-secondary">
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
                  const incoming = isIncoming(transaction.type)
                  const Icon =
                    typeIcons[transaction.type] ?? (incoming ? ArrowDownLeft : ArrowUpRight)
                  const iconColor = incoming ? 'text-emerald-500' : 'text-red-500'

                  return (
                    <tr key={transaction.id} className="transition-colors hover:bg-secondary">
                      <td className="px-4 py-4 sm:px-6">
                        <div
                          className={`inline-flex items-center gap-2 rounded-lg p-2 ${
                            incoming ? 'bg-emerald-100' : 'bg-red-100'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${iconColor}`} />
                          <span
                            className={`text-sm font-semibold ${
                              incoming ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {transaction.description ?? transaction.type}
                          </p>
                          {transaction.referenceId && (
                            <p className="text-xs text-muted-foreground">{transaction.referenceId}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-foreground sm:px-6">
                        {transaction.amount}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <div>
                          <p className="text-sm text-foreground">{transaction.date}</p>
                          {transaction.time && (
                            <p className="text-xs text-muted-foreground">{transaction.time}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            transaction.status.toLowerCase() === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
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

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      </div>
    </div>
  )
}
