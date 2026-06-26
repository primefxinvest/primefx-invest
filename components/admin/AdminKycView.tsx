'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, Clock, Loader2, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { updateUserKycStatus } from '@/lib/admin/actions'
import type { AdminUserRow } from '@/lib/admin/types'
import { formatDate } from '@/lib/data/format'

export function AdminKycView({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.full_name?.toLowerCase().includes(term) ?? false)
    )
  }, [search, users])

  const handleApprove = (userId: string) => {
    startTransition(async () => {
      try {
        await updateUserKycStatus(userId, 'Verified')
        toast.success('KYC approved')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to approve KYC')
      }
    })
  }

  const handleReject = (userId: string) => {
    const reason = window.prompt('Rejection reason code (required):')
    if (!reason?.trim()) {
      toast.error('KYC rejections must include a documented reason code.')
      return
    }

    startTransition(async () => {
      try {
        await updateUserKycStatus(userId, 'Rejected', reason)
        toast.success('KYC rejected')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reject KYC')
      }
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="KYC Verification"
        description="Manage Know Your Customer verification"
      />

      <div className="flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search KYC requests..."
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Level</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No KYC submissions found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-background">
                  <td className="px-6 py-4 font-medium">{user.full_name || '—'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 capitalize text-sm">{user.kyc_level ?? 'basic'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {user.kyc_status === 'Verified' && (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      )}
                      {user.kyc_status === 'Rejected' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {user.kyc_status === 'Pending' && (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                      {user.kyc_status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4">
                    {user.kyc_status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleApprove(user.id)}
                          className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleReject(user.id)}
                          className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:opacity-90 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
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
