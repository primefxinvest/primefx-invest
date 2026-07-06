'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, CheckCheck, Headphones, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  adminCloseAssistanceTicket,
  adminMarkSessionMessagesRead,
  adminRecordAgentJoin,
  adminReplyAssistanceSession,
  adminResolveAssistanceSession,
  adminReopenAssistanceTicket,
  adminUpdateAgentPresence,
} from '@/lib/admin/assistance-actions'
import { formatDateTime } from '@/lib/data/format'
import { useAssistanceRealtime } from '@/lib/hooks/useAssistanceRealtime'
import { useAssistancePresence } from '@/lib/hooks/useAssistancePresence'
import { sortMessagesByCreatedAt } from '@/lib/assistance/message-utils'
import type { AssistanceMessage, AssistanceMessageMeta } from '@/lib/assistance/types'
import { PRESENCE_HEARTBEAT_MS } from '@/lib/assistance/presence'
import { cn } from '@/lib/utils'

type SessionDetail = {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  status: string
  category: string | null
  ticketNumber: string | null
  ticketId: string | null
  assignedAgentName: string | null
  agentUserId: string
  agentEmail: string
}

type Message = {
  id: string
  role: string
  content: string
  createdAt: string
  metadata?: AssistanceMessageMeta
}

function DeliveryTicks({ status }: { status?: string }) {
  if (status === 'read') {
    return <CheckCheck className="h-3 w-3 text-primary" aria-label="Read" />
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-3 w-3 text-muted-foreground" aria-label="Delivered" />
  }
  if (status === 'sending') {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-label="Sending" />
  }
  return <Check className="h-3 w-3 text-muted-foreground" aria-label="Sent" />
}

export function AdminSupportSessionChat({
  session,
  initialMessages,
}: {
  session: SessionDetail
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(
    sortMessagesByCreatedAt(initialMessages)
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(session.status)
  const [joined, setJoined] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const knownIds = useRef(new Set(initialMessages.map((m) => m.id)))

  const presence = useAssistancePresence({
    sessionId: session.id,
    participantId: session.agentUserId,
    role: 'agent',
    displayName: session.agentEmail,
    enabled: true,
  })

  const sortedMessages = useMemo(
    () => sortMessagesByCreatedAt(messages),
    [messages]
  )

  const handleRealtime = useCallback((message: AssistanceMessage) => {
    if (knownIds.current.has(message.id)) return
    knownIds.current.add(message.id)
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev
      return sortMessagesByCreatedAt([
        ...prev,
        {
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
          metadata: message.metadata,
        },
      ])
    })
  }, [])

  const handleUpdate = useCallback((message: AssistanceMessage) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? { ...m, metadata: message.metadata, content: message.content }
          : m
      )
    )
  }, [])

  useAssistanceRealtime(session.id, handleRealtime, knownIds, {
    mode: 'admin',
    onUpdate: handleUpdate,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await adminRecordAgentJoin(session.id)
      if (cancelled) return
      if (!result.success) {
        toast.error(result.error ?? 'Could not join session')
        return
      }
      setJoined(true)
      if (result.message) {
        knownIds.current.add(result.message.id)
        setMessages((prev) =>
          sortMessagesByCreatedAt([
            ...prev,
            {
              id: result.message!.id,
              role: result.message!.role,
              content: result.message!.content,
              createdAt: result.message!.createdAt,
              metadata: result.message!.metadata as AssistanceMessageMeta,
            },
          ])
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session.id])

  useEffect(() => {
    void adminMarkSessionMessagesRead(session.id)
  }, [session.id, messages.length])

  useEffect(() => {
    void adminUpdateAgentPresence(true)
    const timer = setInterval(() => {
      void adminUpdateAgentPresence(true)
    }, PRESENCE_HEARTBEAT_MS)
    return () => {
      clearInterval(timer)
      void adminUpdateAgentPresence(false)
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages, presence.userTyping])

  const sendReply = async () => {
    const body = input.trim()
    if (!body || sending) return
    setSending(true)
    const result = await adminReplyAssistanceSession(session.id, body)
    setSending(false)

    if (!result.success) {
      toast.error(result.error ?? 'Failed to send reply')
      return
    }

    if (result.message) {
      knownIds.current.add(result.message.id)
      setMessages((prev) =>
        sortMessagesByCreatedAt([
          ...prev,
          {
            id: result.message!.id,
            role: result.message!.role,
            content: result.message!.content,
            createdAt: result.message!.createdAt,
            metadata: result.message!.metadata as AssistanceMessageMeta,
          },
        ])
      )
    }
    setInput('')
  }

  const resolveSession = async () => {
    const result = await adminResolveAssistanceSession(session.id)
    if (!result.success) {
      toast.error(result.error ?? 'Failed to resolve')
      return
    }
    setStatus('resolved')
    toast.success('Session resolved')
  }

  const closeTicket = async () => {
    if (!session.ticketId) return
    const result = await adminCloseAssistanceTicket(session.ticketId)
    if (!result.success) {
      toast.error(result.error ?? 'Failed to close ticket')
      return
    }
    toast.success('Ticket closed')
  }

  const reopenTicket = async () => {
    if (!session.ticketId) return
    const result = await adminReopenAssistanceTicket(session.ticketId)
    if (!result.success) {
      toast.error(result.error ?? 'Failed to reopen ticket')
      return
    }
    setStatus('escalated')
    toast.success('Ticket reopened')
  }

  const userOnline =
    presence.userPresence?.status === 'online' ||
    presence.userPresence?.status === 'away'

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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              {session.userName ?? session.userEmail}
            </h1>
            <span className="relative flex h-2 w-2" title={userOnline ? 'Customer online' : 'Customer offline'}>
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  userOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                )}
              />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{session.userEmail}</p>
          <p className="mt-2 text-xs capitalize text-muted-foreground">
            Status: {status}
            {session.category ? ` · ${session.category.replace(/_/g, ' ')}` : ''}
            {joined ? ' · You joined' : ''}
          </p>
          {presence.userTyping ? (
            <p className="mt-1 text-xs text-muted-foreground">Customer is typing…</p>
          ) : null}
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
          <button
            type="button"
            onClick={resolveSession}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50"
          >
            Mark resolved
          </button>
          {session.ticketId ? (
            status === 'resolved' ? (
              <button
                type="button"
                onClick={reopenTicket}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50"
              >
                Reopen ticket
              </button>
            ) : (
              <button
                type="button"
                onClick={closeTicket}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50"
              >
                Close ticket
              </button>
            )
          ) : null}
        </div>
      </div>

      <div className="flex min-h-[420px] flex-col rounded-xl border border-border bg-card">
        <div className="primefx-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {sortedMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            sortedMessages.map((message) => {
              const isSystem = message.role === 'system'
              const isAgentJoin = message.metadata?.eventType === 'agent_join'

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center px-2">
                    <p className="rounded-full bg-emerald-50 px-3 py-1.5 text-center text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {message.content}
                    </p>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    'rounded-lg border p-3',
                    message.role === 'user'
                      ? 'border-border bg-muted/30'
                      : message.role === 'agent'
                        ? 'border-violet-200 bg-violet-50/50'
                        : message.role === 'assistant'
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-amber-200 bg-amber-50/50'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold capitalize text-foreground">
                      {message.role === 'assistant' ? (
                        'PrimeFx Assistance'
                      ) : message.role === 'agent' ? (
                        <>
                          <Headphones className="h-3 w-3" />
                          Support Specialist
                        </>
                      ) : (
                        message.role
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {formatDateTime(message.createdAt)}
                      {message.role === 'agent' ? (
                        <DeliveryTicks status={message.metadata?.deliveryStatus ?? 'sent'} />
                      ) : null}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
                  {isAgentJoin && message.metadata?.joinedAt ? (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Joined at {formatDateTime(message.metadata.joinedAt)}
                    </p>
                  ) : null}
                </div>
              )
            })
          )}
          {presence.userTyping ? (
            <p className="text-xs text-muted-foreground">Customer is typing…</p>
          ) : null}
          <div ref={endRef} aria-hidden />
        </div>

        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendReply()
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (e.target.value.trim()) presence.signalTyping()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendReply()
                }
              }}
              placeholder="Reply to customer…"
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="rounded-lg bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
