'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDateTime } from '@/lib/data/format'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  role: string
  content: string
  createdAt: string
}

type SessionDetail = {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  status: string
  category: string | null
  ticketNumber: string | null
  ticketId: string | null
}

export function AdminSupportSessionDetailView({
  session,
  messages,
}: {
  session: SessionDetail
  messages: Message[]
}) {
  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/admin/support/messages"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to live conversations
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {session.userName ?? session.userEmail}
          </h1>
          <p className="text-sm text-muted-foreground">{session.userEmail}</p>
          <p className="mt-2 text-xs capitalize text-muted-foreground">
            Status: {session.status}
            {session.category ? ` · ${session.category.replace(/_/g, ' ')}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session.ticketId ? (
            <Link
              href={`/admin/support/tickets/${session.ticketId}`}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-primary hover:bg-muted/50"
            >
              Ticket {session.ticketNumber}
            </Link>
          ) : null}
          <Link
            href={`/admin/users/${session.userId}`}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50"
          >
            Customer profile
          </Link>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages in this session.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-lg border p-3',
                message.role === 'user'
                  ? 'border-border bg-muted/30'
                  : message.role === 'assistant'
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-amber-200 bg-amber-50/50'
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold capitalize text-foreground">
                  {message.role === 'assistant' ? 'PrimeFx Assistance' : message.role}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDateTime(message.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
