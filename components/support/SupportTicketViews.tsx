'use client'

import { Clock, Loader2, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { CLOSED_STATUSES } from '@/components/support/constants'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchSupportTicketDetail } from '@/lib/data/queries'
import { replyToSupportTicket } from '@/lib/support/actions'
import { cn } from '@/lib/utils'

export function SupportTicketThreadModal({
  ticketId,
  onClose,
  onSent,
}: {
  ticketId: string
  onClose: () => void
  onSent: () => void
}) {
  const t = useTranslations('support')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const { data: ticket, loading, error, reload } = useAsyncData(
    () => fetchSupportTicketDetail(ticketId),
    [ticketId]
  )

  const closed = ticket ? CLOSED_STATUSES.has(ticket.status.toLowerCase()) : false

  const handleSendReply = async () => {
    if (!reply.trim() || closed) return
    setSending(true)
    const result = await replyToSupportTicket(ticketId, reply)
    setSending(false)

    if (!result.ok) {
      toast.error(t('replyFailed'), { description: result.error })
      return
    }

    toast.success(t('replySent'))
    setReply('')
    reload()
    onSent()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{t('ticketThreadTitle')}</h3>
            {ticket ? (
              <p className="truncate text-sm text-muted-foreground">{ticket.subject}</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AsyncState
            loading={loading}
            error={error}
            onRetry={reload}
            skeleton={
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            }
          >
            {ticket ? (
              <div className="space-y-3">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'rounded-lg border p-4',
                      message.senderType === 'admin'
                        ? 'border-[#0052ff]/20 bg-blue-50/50'
                        : 'border-border bg-muted/30'
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {message.senderType === 'admin' ? t('supportTeam') : message.senderName}
                      </p>
                      <p className="text-xs text-muted-foreground">{message.createdAt}</p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{message.message}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </AsyncState>
        </div>

        <div className="border-t border-border px-5 py-4">
          {closed ? (
            <p className="text-sm text-muted-foreground">{t('ticketClosed')}</p>
          ) : (
            <>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={3}
                placeholder={t('replyPlaceholder')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[#0052ff]/40 focus:ring-2 focus:ring-[#0052ff]/10"
              />
              <button
                type="button"
                disabled={sending || !reply.trim()}
                onClick={handleSendReply}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('sendingReply')}
                  </>
                ) : (
                  t('sendReply')
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function SupportTicketCard({
  ticket,
  onOpen,
}: {
  ticket: {
    id: string
    ticketId: string
    subject: string
    description: string
    status: string
    priority: string
    created: string
    updated: string
    replyCount?: number
  }
  onOpen: (ticketId: string) => void
}) {
  const t = useTranslations('support')

  const statusColor = (() => {
    switch (ticket.status.toLowerCase().replace(/_/g, '-')) {
      case 'open':
        return 'bg-red-50 text-red-700 ring-red-100'
      case 'in-progress':
        return 'bg-blue-50 text-[#0052ff] ring-blue-100'
      case 'resolved':
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      default:
        return 'bg-muted text-muted-foreground ring-border'
    }
  })()

  const priorityAccent = (() => {
    switch (ticket.priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-amber-400'
      default:
        return 'border-l-emerald-500'
    }
  })()

  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        'border-l-4',
        priorityAccent
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">#{ticket.id}</p>
              <h3 className="mt-0.5 text-sm font-bold text-foreground sm:text-base">{ticket.subject}</h3>
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset sm:text-xs',
                statusColor
              )}
            >
              {ticket.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
            {ticket.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t('created', { date: ticket.created })}
            </span>
            {(ticket.replyCount ?? 0) > 0 ? (
              <span>{t('repliesCount', { count: ticket.replyCount ?? 0 })}</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpen(ticket.ticketId)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[#0052ff]/30 hover:text-[#0052ff] sm:text-sm"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {t('viewConversation')}
        </button>
      </div>
    </article>
  )
}
