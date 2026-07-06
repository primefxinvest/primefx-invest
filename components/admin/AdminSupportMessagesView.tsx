'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MessageSquare, Search, User } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import type { AdminAssistanceSessionRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'
import { cn } from '@/lib/utils'

type SessionFilter = 'all' | 'active' | 'escalated' | 'resolved'

function statusClass(status: string) {
  if (status === 'active') return 'bg-blue-50 text-blue-700'
  if (status === 'escalated') return 'bg-amber-50 text-amber-800'
  if (status === 'resolved') return 'bg-emerald-50 text-emerald-700'
  return 'bg-gray-100 text-gray-700'
}

function CustomerCell({ session }: { session: AdminAssistanceSessionRow }) {
  const initials = (session.userName ?? session.userEmail).charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
        {session.userAvatarUrl ? (
          <Image
            src={session.userAvatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
            {initials}
          </span>
        )}
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
      </div>
      <div>
        <p className="text-sm font-medium">{session.userName ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{session.userEmail}</p>
      </div>
    </div>
  )
}

export function AdminSupportMessagesView({
  sessions,
  infrastructureWarning,
}: {
  sessions: AdminAssistanceSessionRow[]
  infrastructureWarning?: string | null
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<SessionFilter>('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return sessions.filter((session) => {
      if (filter !== 'all' && session.status !== filter) return false
      if (!term) return true
      return (
        session.userEmail.toLowerCase().includes(term) ||
        (session.userName?.toLowerCase().includes(term) ?? false) ||
        (session.lastMessage?.toLowerCase().includes(term) ?? false) ||
        (session.ticketNumber?.toLowerCase().includes(term) ?? false) ||
        (session.assignedAgentName?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [filter, search, sessions])

  const needsAttention = sessions.filter(
    (s) =>
      s.status === 'escalated' ||
      (s.lastMessageRole === 'user' && s.status !== 'resolved')
  ).length

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Live Conversations"
        description="PrimeFx Assistance sessions, escalations, and real-time investor messages"
      />

      {infrastructureWarning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {infrastructureWarning}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-sm font-medium text-foreground">
          {sessions.filter((s) => s.status === 'active').length} active
        </span>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">{needsAttention} need attention</span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'escalated', 'resolved'] as SessionFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold capitalize',
                filter === value
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
        <table className="w-full min-w-[1000px]">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Last message</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ticket</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Updated</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No conversations match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((session) => (
                <tr key={session.id} className="hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <CustomerCell session={session} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                          statusClass(session.status)
                        )}
                      >
                        {session.status}
                      </span>
                      {session.unreadCount > 0 && session.lastMessageRole === 'user' ? (
                        <span className="text-[10px] font-semibold text-amber-600">
                          {session.unreadCount} unread
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {session.assignedAgentName ?? '—'}
                  </td>
                  <td className="max-w-[220px] px-4 py-4">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {session.lastMessage ?? '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {session.messageCount} messages
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    {session.ticketNumber ? (
                      <Link
                        href={`/admin/support/tickets/${session.ticketId}`}
                        className="text-primary hover:underline"
                      >
                        {session.ticketNumber}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {formatDateTime(session.updatedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/admin/support/messages/${session.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Reply
                      </Link>
                      <Link
                        href={`/admin/users/${session.userId}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <User className="h-3 w-3" />
                        Profile
                      </Link>
                    </div>
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
