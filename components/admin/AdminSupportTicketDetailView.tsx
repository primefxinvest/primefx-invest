'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  adminReplySupportTicket,
  adminUpdateSupportTicketStatus,
} from '@/lib/admin/actions'
import type { AdminSupportTicketDetail } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export function AdminSupportTicketDetailView({
  ticket,
  backHref = '/admin/support',
}: {
  ticket: AdminSupportTicketDetail
  backHref?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState(ticket.status.replace(/-/g, '_'))
  const [priority, setPriority] = useState(ticket.priority)

  const handleReply = () => {
    const message = reply.trim()
    if (!message) return

    startTransition(async () => {
      const result = await adminReplySupportTicket(ticket.id, message, status)
      if (!result.success) {
        toast.error(result.error ?? 'Failed to send reply')
        return
      }
      toast.success('Reply sent to user')
      setReply('')
      router.refresh()
    })
  }

  const handleStatusUpdate = () => {
    startTransition(async () => {
      const result = await adminUpdateSupportTicketStatus(ticket.id, status, priority)
      if (!result.success) {
        toast.error(result.error ?? 'Failed to update ticket')
        return
      }
      toast.success('Ticket updated')
      router.refresh()
    })
  }

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      <AdminPageHeader
        title={ticket.subject}
        description={`Ticket ${ticket.shortId} · ${ticket.userEmail}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Original request
            </p>
            {ticket.aiSummary ? (
              <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  AI Escalation Summary
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-amber-800 dark:text-amber-300">
                  {ticket.aiSummary}
                </pre>
              </div>
            ) : null}
            <div className="mt-3 rounded-lg bg-muted/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{ticket.userName ?? ticket.userEmail}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(ticket.createdAt)}</p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>
            </div>
          </div>

          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-xl border p-4',
                message.senderType === 'admin'
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{message.senderName}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{message.message}</p>
            </div>
          ))}

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Reply to user</h3>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Write your support response..."
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={pending || !reply.trim()}
              onClick={handleReply}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send reply
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Ticket details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {ticket.ticketNumber ? (
                <div>
                  <dt className="text-muted-foreground">Ticket ID</dt>
                  <dd className="font-mono font-medium">{ticket.ticketNumber}</dd>
                </div>
              ) : null}
              {ticket.category ? (
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="capitalize">{ticket.category.replace(/_/g, ' ')}</dd>
                </div>
              ) : null}
              {ticket.issueSummary ? (
                <div>
                  <dt className="text-muted-foreground">Issue summary</dt>
                  <dd>{ticket.issueSummary}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground">User</dt>
                <dd className="font-medium">{ticket.userName ?? '—'}</dd>
                <dd className="text-xs text-muted-foreground">{ticket.userEmail}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>{formatDateTime(ticket.updatedAt)}</dd>
              </div>
            </dl>
            <Link
              href={`/admin/users/${ticket.userId}`}
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              View user profile
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Update ticket</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <CustomSelect
                  value={status}
                  onValueChange={setStatus}
                  options={STATUS_OPTIONS}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
                <CustomSelect
                  value={priority}
                  onValueChange={setPriority}
                  options={PRIORITY_OPTIONS}
                />
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={handleStatusUpdate}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
              >
                Save changes
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
