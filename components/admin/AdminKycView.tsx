'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, Eye, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { updateUserKycStatus } from '@/lib/admin/actions'
import type { AdminKycQueueRow } from '@/lib/admin/types'
import { formatDate, formatDateTime } from '@/lib/data/format'
import { getIdTypeLabel } from '@/lib/kyc/upload'
import { useActionDialog } from '@/lib/hooks/useActionDialog'

export function AdminKycView({ queue }: { queue: AdminKycQueueRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const { prompt, ActionDialog } = useActionDialog()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return queue
    return queue.filter(
      (item) =>
        item.email.toLowerCase().includes(term) ||
        (item.full_name?.toLowerCase().includes(term) ?? false) ||
        item.id_number.toLowerCase().includes(term) ||
        item.country.toLowerCase().includes(term)
    )
  }, [search, queue])

  const handleApprove = (userId: string) => {
    startTransition(async () => {
      try {
        await updateUserKycStatus(userId, 'Verified')
        toast.success('KYC approved')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to approve KYC')
      }
    })
  }

  const handleReject = async (userId: string) => {
    const reason = await prompt({
      title: 'Reject KYC',
      label: 'Rejection reason code',
      required: true,
      requiredMessage: 'KYC rejections must include a documented reason code.',
      confirmLabel: 'Reject',
    })
    if (!reason) return

    startTransition(async () => {
      try {
        await updateUserKycStatus(userId, 'Rejected', reason)
        toast.success('KYC rejected')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reject KYC')
      }
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="KYC Verification"
        description="Review submitted identity documents and approve or reject verification"
      />

      <div className="flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, ID, or country..."
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Submitted</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No pending KYC submissions. Investors submit documents from their profile page.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.submission_id} className="hover:bg-background">
                  <td className="px-6 py-4">
                    <p className="font-medium">{item.full_name || '—'}</p>
                    <p className="text-sm text-muted-foreground">{item.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-medium">{getIdTypeLabel(item.id_type)}</p>
                    <p className="text-muted-foreground">{item.id_number}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{item.country}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {item.submitted_at ? formatDateTime(item.submitted_at) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Awaiting review
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleApprove(item.user_id)}
                        className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleReject(item.user_id)}
                        className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <Link
                        href={`/admin/users/${item.user_id}`}
                        className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-sm font-medium hover:bg-background"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Documents
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ActionDialog />
    </div>
  )
}
