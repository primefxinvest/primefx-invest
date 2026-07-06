'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Ticket, Zap } from 'lucide-react'
import type { AdminAssistanceSessionRow, AdminSupportTicketRow } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

type AdminSupportHubProps = {
  tickets: AdminSupportTicketRow[]
  sessions: AdminAssistanceSessionRow[]
}

export function AdminSupportHub({ tickets, sessions }: AdminSupportHubProps) {
  const openTickets = tickets.filter((t) => t.status.toLowerCase() === 'open').length
  const escalated = sessions.filter((s) => s.status === 'escalated').length
  const activeChats = sessions.filter((s) => s.status === 'active').length
  const needsReply = tickets.filter(
    (t) =>
      ['open', 'in_progress', 'in-progress'].includes(t.status.toLowerCase()) &&
      t.lastReplyBy !== 'admin'
  ).length

  const cards = [
    {
      label: 'Open tickets',
      value: openTickets,
      href: '/admin/support/tickets?filter=open',
      icon: Ticket,
      tone: 'text-red-600',
    },
    {
      label: 'Needs reply',
      value: needsReply,
      href: '/admin/support/tickets?filter=pending',
      icon: Zap,
      tone: 'text-amber-600',
    },
    {
      label: 'Active AI chats',
      value: activeChats,
      href: '/admin/support/messages?filter=active',
      icon: MessageSquare,
      tone: 'text-blue-600',
    },
    {
      label: 'Escalated',
      value: escalated,
      href: '/admin/support/messages?filter=escalated',
      icon: MessageSquare,
      tone: 'text-violet-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage tickets, live AI conversations, and escalations from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{card.label}</p>
              <p className={cn('mt-1 text-3xl font-bold', card.tone)}>{card.value}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Link
          href="/admin/support/tickets"
          className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30"
        >
          <h2 className="font-semibold text-foreground">Ticket inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review escalated cases, AI summaries, and reply to investors.
          </p>
        </Link>
        <Link
          href="/admin/support/messages"
          className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30"
        >
          <h2 className="font-semibold text-foreground">Live conversations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor PrimeFx Assistance chats and escalations in real time.
          </p>
        </Link>
      </div>
    </div>
  )
}
