'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import type { AdminWithdrawalQueueRow } from '@/lib/admin/queries'
import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'

export function AdminWithdrawalsView({ rows }: { rows: AdminWithdrawalQueueRow[] }) {
  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Withdrawal Queue"
        description={`Wallet and investment capital requests with ${WITHDRAWAL_NOTICE_DAYS}-day notice.`}
      />

      <AdminTableCard>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Requested</th>
              <th className="px-4 py-3 text-left font-semibold">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No withdrawal requests in queue.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="hover:bg-background/60">
                  <td className="px-4 py-3 capitalize">{row.kind}</td>
                  <td className="px-4 py-3">{row.user_email}</td>
                  <td className="px-4 py-3">${row.amount_usd.toFixed(2)}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.requested_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.available_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  )
}
