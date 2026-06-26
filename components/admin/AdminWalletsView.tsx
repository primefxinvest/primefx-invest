'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { AdminWalletRow } from '@/lib/admin/types'
import { formatCurrency, formatDateTime } from '@/lib/data/format'

export function AdminWalletsView({ wallets }: { wallets: AdminWalletRow[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return wallets
    return wallets.filter(
      (w) =>
        w.user_email.toLowerCase().includes(term) ||
        (w.user_name?.toLowerCase().includes(term) ?? false)
    )
  }, [search, wallets])

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Wallet Management" description="Monitor and manage user wallets" />

      <div className="flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wallets..."
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Available</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Pending</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Bonus</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No wallets found.
                </td>
              </tr>
            ) : (
              filtered.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-background">
                  <td className="px-6 py-4 font-medium">{wallet.user_name || wallet.user_email}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">
                    {formatCurrency(wallet.available_balance)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-orange-500">
                    {formatCurrency(wallet.pending_balance)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-primary">
                    {formatCurrency(wallet.bonus_balance)}
                  </td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(wallet.total_balance)}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDateTime(wallet.updated_at)}
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
