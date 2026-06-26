'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, Clock, Loader2, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { updateTransactionStatus } from '@/lib/admin/actions'
import type { AdminTransactionRow } from '@/lib/admin/types'
import { formatCurrency, formatDateTime } from '@/lib/data/format'

export function AdminTransactionsView({ transactions }: { transactions: AdminTransactionRow[] }) {
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return transactions
    return transactions.filter(
      (tx) =>
        tx.user_email.toLowerCase().includes(term) ||
        tx.type.toLowerCase().includes(term) ||
        (tx.reference_id?.toLowerCase().includes(term) ?? false)
    )
  }, [search, transactions])

  const handleStatus = (id: string, status: 'Completed' | 'Rejected') => {
    startTransition(async () => {
      try {
        await updateTransactionStatus(id, status)
        toast.success(`Transaction ${status.toLowerCase()}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update transaction')
      }
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Transaction Management"
        description="Monitor and manage all transactions"
      />

      <div className="flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Reference</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-background">
                  <td className="px-6 py-4 font-mono text-xs">{tx.reference_id || tx.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">{tx.user_name || tx.user_email}</td>
                  <td className="px-6 py-4 capitalize text-muted-foreground">{tx.type}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {tx.status.toLowerCase() === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      )}
                      {tx.status.toLowerCase() === 'pending' && (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                      {tx.status.toLowerCase() === 'failed' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {tx.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDateTime(tx.created_at)}</td>
                  <td className="px-6 py-4">
                    {tx.status.toLowerCase() === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleStatus(tx.id, 'Completed')}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleStatus(tx.id, 'Rejected')}
                          className="rounded bg-red-500 px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : pending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
