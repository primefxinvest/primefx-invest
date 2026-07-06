'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import type { AdminSupportTicketRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'open' | 'pending' | 'assigned' | 'resolved' | 'closed'

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

function matchesFilter(ticket: AdminSupportTicketRow, filter: StatusFilter) {
  const status = ticket.status.toLowerCase().replace(/-/g, '_')
  if (filter === 'all') return true
  if (filter === 'open') return status === 'open'
  if (filter === 'pending')
    return status === 'open' && ticket.lastReplyBy !== 'admin'
  if (filter === 'assigned') return status === 'in_progress'
  if (filter === 'resolved') return status === 'resolved'
  if (filter === 'closed') return status === 'closed'
  return true
}

export function AdminSupportView({ tickets }: { tickets: AdminSupportTicketRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      if (!matchesFilter(ticket, statusFilter)) return false
      if (!term) return true
      return (
        ticket.shortId.toLowerCase().includes(term) ||
        (ticket.ticketNumber?.toLowerCase().includes(term) ?? false) ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.userEmail.toLowerCase().includes(term) ||
        (ticket.userName?.toLowerCase().includes(term) ?? false) ||
        (ticket.category?.toLowerCase().includes(term) ?? false) ||
        (ticket.issueSummary?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [search, statusFilter, tickets])

  const filters: StatusFilter[] = ['all', 'open', 'pending', 'assigned', 'resolved', 'closed']

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Support Tickets"
        description="Ticket inbox with AI escalation summaries and conversation context"
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket ID, customer, category..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((value) => (
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
              {value}
            </button>
          ))}
        </div>
      </div>

      <AdminTableCard>
        <table className="w-full min-w-[1024px]">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Ticket</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Last message</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No support tickets match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <p className="font-mono text-xs font-medium text-primary">
                      {ticket.ticketNumber ?? ticket.shortId}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm font-medium">{ticket.subject}</p>
                    {ticket.aiSummaryPreview ? (
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                        AI: {ticket.aiSummaryPreview}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium">{ticket.userName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-muted-foreground">
                    {ticket.category?.replace(/_/g, ' ') ?? '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                        statusBadgeClass(ticket.status)
                      )}
                    >
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn('text-sm font-semibold capitalize', priorityBadgeClass(ticket.priority))}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-4 py-4">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {ticket.lastMessage ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {formatDateTime(ticket.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/support/tickets/${ticket.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open
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
