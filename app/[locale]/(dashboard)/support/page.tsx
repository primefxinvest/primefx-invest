'use client'

import { useState } from 'react'
import {
  HelpCircle,
  Plus,
  MessageCircle,
  Clock,
  X,
  Loader2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { TableSkeleton } from '@/components/shared/skeletons'
import { CustomSelect } from '@/components/ui/custom-select'
import { Button } from '@/components/ui/button'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import {
  fetchSupportTicketDetail,
  fetchSupportTickets,
  fetchSupportTicketStats,
} from '@/lib/data/queries'
import { replyToSupportTicket, submitSupportTicket } from '@/lib/support/actions'
import type { SupportTicketItem } from '@/lib/data/types'
import { pageStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const

const OPEN_STATUSES = new Set(['open', 'in-progress', 'in_progress'])
const CLOSED_STATUSES = new Set(['resolved', 'closed'])

function isOpenTicket(status: string) {
  return OPEN_STATUSES.has(status.toLowerCase())
}

function TicketCard({
  ticket,
  getPriorityColor,
  getStatusColor,
  onOpen,
  t,
}: {
  ticket: SupportTicketItem
  getPriorityColor: (value: string) => string
  getStatusColor: (status: string) => string
  onOpen: (ticketId: string) => void
  t: ReturnType<typeof useTranslations<'support'>>
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${getPriorityColor(ticket.priority)}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted-foreground">{ticket.id}</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{ticket.subject}</h3>
            </div>
            <span
              className={`inline-block shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}
            >
              {ticket.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t('created', { date: ticket.created })}
            </div>
            <span className="hidden sm:inline">•</span>
            <div>{t('updated', { date: ticket.updated })}</div>
            {(ticket.replyCount ?? 0) > 0 ? (
              <>
                <span className="hidden sm:inline">•</span>
                <div>{t('repliesCount', { count: ticket.replyCount ?? 0 })}</div>
              </>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onOpen(ticket.ticketId)}
        >
          <MessageCircle />
          {t('viewConversation')}
        </Button>
      </div>
    </div>
  )
}

function TicketThreadModal({
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
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
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
                        ? 'border-primary/20 bg-primary/5'
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
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder={t('replyPlaceholder')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={sending || !reply.trim()}
                onClick={handleSendReply}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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

export default function SupportPage() {
  const t = useTranslations('support')
  const [tab, setTab] = useState<'tickets' | 'faq'>('tickets')
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')

  const { data: tickets = [], loading, error, reload } = useAsyncData(
    () => fetchSupportTickets(),
    []
  )
  const { data: stats, reload: reloadStats } = useAsyncData(
    () => fetchSupportTicketStats(),
    []
  )

  const priorityOptions = [
    { value: 'low', label: t('priorityLow') },
    { value: 'medium', label: t('priorityMedium') },
    { value: 'high', label: t('priorityHigh') },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase().replace(/_/g, '-')) {
      case 'open':
        return 'bg-red-100 text-red-700'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700'
      case 'resolved':
      case 'closed':
        return 'bg-emerald-100 text-emerald-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (value: string) => {
    switch (value) {
      case 'high':
        return 'border-l-4 border-l-red-500'
      case 'medium':
        return 'border-l-4 border-l-yellow-500'
      case 'low':
        return 'border-l-4 border-l-green-500'
      default:
        return ''
    }
  }

  const openTicketItems = tickets.filter((ticket) => isOpenTicket(ticket.status))
  const closedTicketItems = tickets.filter((ticket) => CLOSED_STATUSES.has(ticket.status.toLowerCase()))

  const handleSubmitTicket = async () => {
    setSubmitting(true)
    const result = await submitSupportTicket({ subject, description, priority })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(t('ticketFailed'), { description: result.error })
      return
    }

    toast.success(t('ticketCreated'))
    setModalOpen(false)
    setSubject('')
    setDescription('')
    setPriority('medium')
    reload()
    reloadStats()
  }

  const openTicketThread = (ticketId: string) => {
    setActiveTicketId(ticketId)
  }

  return (
    <div className={pageStackClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus />
          {t('newTicket')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('openTickets')}</p>
          <p className="mt-2 text-3xl font-bold text-red-500">
            {(stats?.open ?? 0) + (stats?.inProgress ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('closedTickets')}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{stats?.resolved ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('tickets')}
          className={`px-4 py-3 font-semibold transition-colors ${
            tab === 'tickets'
              ? 'border-b-2 border-b-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabTickets')}
        </button>
        <button
          type="button"
          onClick={() => setTab('faq')}
          className={`px-4 py-3 font-semibold transition-colors ${
            tab === 'faq'
              ? 'border-b-2 border-b-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabFaq')}
        </button>
      </div>

      {tab === 'tickets' ? (
        <AsyncState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={!tickets.length}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
          skeleton={<TableSkeleton rows={3} cols={1} showHeader={false} />}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t('openTickets')}</h3>
              {openTicketItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('noOpenTickets')}
                </p>
              ) : (
                openTicketItems.map((ticket) => (
                  <TicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    onOpen={openTicketThread}
                    t={t}
                  />
                ))
              )}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t('closedTickets')}</h3>
              {closedTicketItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('noClosedTickets')}
                </p>
              ) : (
                closedTicketItems.map((ticket) => (
                  <TicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    onOpen={openTicketThread}
                    t={t}
                  />
                ))
              )}
            </div>
          </div>
        </AsyncState>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            {FAQ_KEYS.map((key) => (
              <details key={key} className="group border-b border-border pb-4 last:border-b-0">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground transition-colors hover:text-primary">
                  {t(`faq.${key}`)}
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{t(`faq.a${key.slice(1)}`)}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('contactTitle')}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-4 text-center">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="font-semibold text-foreground">{t('liveChat')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('liveChatDesc')}</p>
            <button
              type="button"
              disabled
              className="mt-3 rounded-lg bg-primary px-4 py-2 font-semibold text-white opacity-60"
            >
              {t('startChat')} (Coming Soon)
            </button>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <HelpCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="font-semibold text-foreground">{t('emailSupport')}</p>
            <p className="mt-2 text-sm text-muted-foreground">support@primefx.com</p>
            <button
              type="button"
              disabled
              className="mt-3 rounded-lg border border-border px-4 py-2 font-semibold opacity-60"
            >
              {t('sendEmail')} (Coming Soon)
            </button>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="font-semibold text-foreground">{t('supportHours')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('supportHoursDesc')}</p>
            <button
              type="button"
              disabled
              className="mt-3 rounded-lg border border-border px-4 py-2 font-semibold opacity-60"
            >
              {t('scheduleCall')} (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{t('ticketModalTitle')}</h3>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t('subject')}</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('subjectPlaceholder')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t('fieldDescription')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t('priority')}</label>
                <CustomSelect
                  value={priority}
                  onValueChange={setPriority}
                  options={priorityOptions}
                  placeholder={t('priorityMedium')}
                />
              </div>
              <button
                type="button"
                onClick={handleSubmitTicket}
                disabled={submitting || !subject.trim() || !description.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTicketId ? (
        <TicketThreadModal
          ticketId={activeTicketId}
          onClose={() => setActiveTicketId(null)}
          onSent={() => {
            reload()
            reloadStats()
          }}
        />
      ) : null}
    </div>
  )
}
