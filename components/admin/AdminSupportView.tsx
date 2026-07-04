'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import type { AdminSupportTicketRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved'

function statusBadgeClass(status: string) {
  const value = status.toLowerCase().replace(/-/g, '_')
  if (value === 'open') return 'bg-red-50 text-red-700'
  if (value === 'in_progress') return 'bg-blue-50 text-blue-700'
  if (value === 'resolved' || value === 'closed') return 'bg-emerald-50 text-emerald-700'
  return 'bg-gray-100 text-gray-700'
}

function priorityBadgeClass(priority: string) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'text-red-600'
    case 'medium':
      return 'text-amber-600'
    case 'low':
      return 'text-emerald-600'
    default:
      return 'text-gray-600'
  }
}

export function AdminSupportView({ tickets }: { tickets: AdminSupportTicketRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const status = ticket.status.toLowerCase().replace(/-/g, '_')
      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter ||
        (statusFilter === 'resolved' && (status === 'resolved' || status === 'closed'))
      if (!matchesStatus) return false
      if (!term) return true
      return (
        ticket.shortId.toLowerCase().includes(term) ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.userEmail.toLowerCase().includes(term) ||
        (ticket.userName?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [search, statusFilter, tickets])

  const openCount = tickets.filter((t) => t.status.toLowerCase() === 'open').length
  const inProgressCount = tickets.filter((t) =>
    ['in_progress', 'in-progress'].includes(t.status.toLowerCase())
  ).length

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Support Tickets"
        description="Review user requests and reply as Support Team (Super Admin and Support Admin)"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{openCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">In progress</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total tickets</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{tickets.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket ID, subject, or user..."
            className="flex-1 bg-transparent outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'open', 'in_progress', 'resolved'] as StatusFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold capitalize',
                statusFilter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {value.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <AdminTableCard>
        <table className="w-full min-w-[880px]">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Ticket</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Priority</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Replies</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Updated</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No support tickets match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-muted-foreground">{ticket.shortId}</p>
                    <p className="mt-1 font-medium text-foreground">{ticket.subject}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{ticket.userName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                        statusBadgeClass(ticket.status)
                      )}
                    >
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('text-sm font-semibold capitalize', priorityBadgeClass(ticket.priority))}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ticket.replyCount}
                    {ticket.lastReplyBy ? (
                      <span className="block text-xs text-muted-foreground">
                        Last: {ticket.lastReplyBy === 'admin' ? 'Support' : 'User'}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDateTime(ticket.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Reply
                    </Link>
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
