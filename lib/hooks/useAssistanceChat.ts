'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  escalateAssistanceSession,
  getOrCreateAssistanceSession,
  markAssistanceMessagesRead,
  pollAssistanceMessageUpdates,
  resolveAssistanceSession,
  saveAssistanceMessage,
  sendEscalatedUserMessage,
  uploadAssistanceAttachment,
} from '@/lib/assistance/actions'
import type {
  AssistanceAttachment,
  AssistanceMessage,
  AssistanceMessageMeta,
  AssistanceSession,
  EscalationSummary,
} from '@/lib/assistance/types'
import { parseEscalationFromResponse, userRequestsHumanSupport } from '@/lib/assistance/escalation'
import { getMessageText } from '@/lib/ai/message-utils'
import { toPrimeAiClientError, PRIMEAI_UNAVAILABLE_USER_MESSAGE } from '@/lib/ai/user-errors'
import { resolveDeliveryStatus, sortMessagesByCreatedAt } from '@/lib/assistance/message-utils'
import type { DeliveryStatus } from '@/lib/assistance/message-utils'
import { useAssistanceChatTransport } from '@/lib/hooks/useAssistanceChatTransport'
import { useAssistanceRealtime } from '@/lib/hooks/useAssistanceRealtime'
import { useAssistancePresence } from '@/lib/hooks/useAssistancePresence'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { REALTIME_POLL_INTERVAL_MS } from '@/lib/assistance/constants'

export type AssistanceDisplayMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'agent'
  text: string
  createdAt?: string
  metadata?: AssistanceMessageMeta
  deliveryStatus?: DeliveryStatus
}

function toDisplayMessage(
  m: {
    id: string
    role: AssistanceDisplayMessage['role']
    text: string
    createdAt?: string
    metadata?: AssistanceMessageMeta
  },
  optimistic = false
): AssistanceDisplayMessage {
  return {
    ...m,
    deliveryStatus: resolveDeliveryStatus(m.metadata, { optimistic }),
  }
}

export function useAssistanceChat() {
  const t = useTranslations('assistance')
  const sessionUser = useSessionUser()
  const [session, setSession] = useState<AssistanceSession | null>(null)
  const [hasAgentReply, setHasAgentReply] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [infrastructureMissing, setInfrastructureMissing] = useState(false)
  const [input, setInput] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [escalationSuggested, setEscalationSuggested] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')
  const [escalationSummary, setEscalationSummary] = useState<EscalationSummary | null>(null)
  const [escalating, setEscalating] = useState(false)
  const [humanConnected, setHumanConnected] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<AssistanceAttachment[]>([])
  const [supplementalMessages, setSupplementalMessages] = useState<AssistanceDisplayMessage[]>([])
  const [messageMeta, setMessageMeta] = useState<Record<string, AssistanceMessageMeta>>({})
  const lastSavedAssistantRef = useRef<string | null>(null)
  const pendingQueryRef = useRef<string | null>(null)
  const knownMessageIdsRef = useRef<Set<string>>(new Set())
  const userMessageIdsRef = useRef<Set<string>>(new Set())

  const transport = useAssistanceChatTransport(session?.id ?? null)
  const welcomeText = useMemo(() => t('welcomeMessage'), [t])
  const [hasConversationHistory, setHasConversationHistory] = useState(false)

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport,
    messages: [],
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isEscalated = session?.status === 'escalated'
  const isHumanMode = isEscalated

  const presence = useAssistancePresence({
    sessionId: isEscalated ? session?.id : null,
    participantId: sessionUser.id ?? 'anonymous',
    role: 'user',
    displayName: sessionUser.name ?? sessionUser.email ?? 'Customer',
    enabled: isEscalated && Boolean(session?.id),
  })

  const displayMessages = useMemo<AssistanceDisplayMessage[]>(() => {
    const fromChat = messages.map((m) => {
      const meta = messageMeta[m.id]
      return toDisplayMessage({
        id: m.id,
        role: m.role as AssistanceDisplayMessage['role'],
        text: getMessageText(m),
        createdAt: meta?.sentAt ?? undefined,
        metadata: meta,
      })
    })
    const merged = [...fromChat, ...supplementalMessages]
    const seen = new Set<string>()
    const deduped = merged.filter((m) => {
      if (!m.text || seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    return sortMessagesByCreatedAt(deduped)
  }, [messages, supplementalMessages, messageMeta])

  const agentJoined = useMemo(
    () =>
      supplementalMessages.some(
        (m) => m.role === 'system' && m.metadata?.eventType === 'agent_join'
      ) || hasAgentReply,
    [supplementalMessages, hasAgentReply]
  )

  const userMessageCount = useMemo(
    () => displayMessages.filter((m) => m.role === 'user').length,
    [displayMessages]
  )

  const handleMessageUpdate = useCallback((message: AssistanceMessage) => {
    setMessageMeta((prev) => ({ ...prev, [message.id]: message.metadata }))
    setSupplementalMessages((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? toDisplayMessage({
              id: message.id,
              role: message.role,
              text: message.content,
              createdAt: message.createdAt,
              metadata: message.metadata,
            })
          : m
      )
    )
  }, [])

  const handleRealtimeMessage = useCallback(
    (message: AssistanceMessage) => {
      if (knownMessageIdsRef.current.has(message.id)) return
      knownMessageIdsRef.current.add(message.id)

      if (message.role === 'user') {
        userMessageIdsRef.current.add(message.id)
      }

      setMessageMeta((prev) => ({ ...prev, [message.id]: message.metadata }))

      if (message.role === 'agent') {
        setHasAgentReply(true)
      }

      if (message.role === 'agent' || message.role === 'system') {
        setSupplementalMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [
            ...prev,
            toDisplayMessage({
              id: message.id,
              role: message.role,
              text: message.content,
              createdAt: message.createdAt,
              metadata: message.metadata,
            }),
          ]
        })
        return
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [
          ...prev,
          {
            id: message.id,
            role: message.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: message.content }],
          },
        ]
      })
    },
    [setMessages]
  )

  useAssistanceRealtime(session?.id, handleRealtimeMessage, knownMessageIdsRef, {
    mode: 'user',
    onUpdate: handleMessageUpdate,
  })

  useEffect(() => {
    if (!session?.id || !isEscalated) return
    void markAssistanceMessagesRead(session.id)
  }, [session?.id, isEscalated, displayMessages.length])

  useEffect(() => {
    if (!session?.id) return
    const ids = Array.from(userMessageIdsRef.current)
    if (!ids.length) return

    const poll = async () => {
      const result = await pollAssistanceMessageUpdates(session.id!, ids)
      if (!result.ok || !result.messages?.length) return
      for (const message of result.messages) {
        handleMessageUpdate(message)
      }
    }

    void poll()
    const timer = setInterval(() => {
      void poll()
    }, REALTIME_POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [session?.id, handleMessageUpdate])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await getOrCreateAssistanceSession()
      if (cancelled) return
      setSessionLoading(false)

      if (!result.ok || !result.data) {
        if (result.infrastructureMissing) {
          setInfrastructureMissing(true)
          toast.error(result.error ?? t('unavailable'))
        }
        return
      }

      setSession(result.data.session)
      setHasAgentReply(result.data.hasAgentReply)
      setHumanConnected(result.data.session.status === 'escalated')

      if (result.data.messages.length > 0) {
        setHasConversationHistory(true)
        const persisted = result.data.messages
        const meta: Record<string, AssistanceMessageMeta> = {}
        for (const m of persisted) {
          meta[m.id] = m.metadata
          knownMessageIdsRef.current.add(m.id)
          if (m.role === 'user') userMessageIdsRef.current.add(m.id)
        }
        setMessageMeta(meta)

        const chatMessages = persisted
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: m.content }],
          }))

        const extra = persisted
          .filter((m) => m.role === 'agent' || m.role === 'system')
          .map((m) =>
            toDisplayMessage({
              id: m.id,
              role: m.role,
              text: m.content,
              createdAt: m.createdAt,
              metadata: m.metadata,
            })
          )

        setMessages(chatMessages)
        setSupplementalMessages(extra)
      } else {
        setHasConversationHistory(false)
        setMessages([])
        setSupplementalMessages([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setMessages, t])

  const persistUserMessage = useCallback(
    async (text: string, attachments?: AssistanceAttachment[]) => {
      if (!session?.id) return null
      const result = isEscalated
        ? await sendEscalatedUserMessage({
            sessionId: session.id,
            content: text,
            attachments,
          })
        : await saveAssistanceMessage({
            sessionId: session.id,
            role: 'user',
            content: text,
            metadata: attachments?.length ? { attachments } : {},
          })

      if (result.ok && result.message) {
        knownMessageIdsRef.current.add(result.message.id)
        userMessageIdsRef.current.add(result.message.id)
        setMessageMeta((prev) => ({ ...prev, [result.message!.id]: result.message!.metadata }))
        return result.message
      }
      return null
    },
    [isEscalated, session?.id]
  )

  const persistAssistantMessage = useCallback(
    async (text: string, meta?: { escalationSuggested?: boolean; escalationReason?: string }) => {
      if (!session?.id || isEscalated) return
      const result = await saveAssistanceMessage({
        sessionId: session.id,
        role: 'assistant',
        content: text,
        metadata: meta ?? {},
      })
      if (result.ok && result.message) {
        knownMessageIdsRef.current.add(result.message.id)
      }
    },
    [isEscalated, session?.id]
  )

  useEffect(() => {
    if (isEscalated || status !== 'ready' || isLoading) return
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant) return

    const rawText = getMessageText(lastAssistant)
    if (rawText === lastSavedAssistantRef.current) return

    const { cleanText, shouldEscalate, reason } = parseEscalationFromResponse(rawText)
    lastSavedAssistantRef.current = rawText

    if (cleanText !== rawText) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === lastAssistant.id
            ? { ...m, parts: [{ type: 'text' as const, text: cleanText }] }
            : m
        )
      )
    }

    if (shouldEscalate) {
      setEscalationSuggested(true)
      setEscalationReason(reason ?? t('escalation.defaultReason'))
    }

    void persistAssistantMessage(cleanText, {
      escalationSuggested: shouldEscalate,
      escalationReason: reason ?? undefined,
    })
  }, [status, isLoading, messages, persistAssistantMessage, setMessages, t, isEscalated])

  const submitMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return
      clearError()
      setPendingAction(null)

      if (isEscalated) {
        presence.signalTyping()
      }

      if (!session?.id) {
        const created = await getOrCreateAssistanceSession()
        if (!created.ok || !created.data) {
          toast.error(created.error ?? t('unavailable'))
          return
        }
        setSession(created.data.session)
      }

      if (!isEscalated && userRequestsHumanSupport(trimmed)) {
        setEscalationSuggested(true)
        setEscalationReason(t('escalation.userRequested'))
      }

      const attachmentNote =
        pendingAttachments.length > 0
          ? `\n[Attachments: ${pendingAttachments.map((a) => a.name).join(', ')}]`
          : ''

      const optimisticId = `optimistic-${Date.now()}`
      const fullText = trimmed + attachmentNote

      if (isEscalated) {
        setSupplementalMessages((prev) => [
          ...prev,
          toDisplayMessage(
            {
              id: optimisticId,
              role: 'user',
              text: fullText,
              createdAt: new Date().toISOString(),
            },
            true
          ),
        ])
      }

      const persisted = await persistUserMessage(trimmed, pendingAttachments)

      if (isEscalated && persisted) {
        setSupplementalMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? toDisplayMessage({
                  id: persisted.id,
                  role: 'user',
                  text: fullText,
                  createdAt: persisted.createdAt,
                  metadata: persisted.metadata,
                })
              : m
          )
        )
      } else if (!isEscalated) {
        sendMessage({ text: fullText })
      } else if (!persisted) {
        setSupplementalMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        toast.error(t('requestFailed'))
        return
      }

      setInput('')
      setPendingAttachments([])
      if (!isEscalated) {
        setEscalationSuggested(false)
      }
    },
    [
      clearError,
      isEscalated,
      isLoading,
      pendingAttachments,
      persistUserMessage,
      presence,
      sendMessage,
      session?.id,
      t,
    ]
  )

  useEffect(() => {
    if (sessionLoading || !pendingQueryRef.current) return
    const query = pendingQueryRef.current
    pendingQueryRef.current = null
    void submitMessage(query)
  }, [sessionLoading, submitMessage])

  const startChat = useCallback(
    (query?: string) => {
      if (query) {
        if (sessionLoading) {
          pendingQueryRef.current = query
        } else {
          void submitMessage(query)
        }
      }
    },
    [sessionLoading, submitMessage]
  )

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      if (isEscalated && value.trim()) {
        presence.signalTyping()
      }
    },
    [isEscalated, presence]
  )

  const handleEscalate = async () => {
    if (escalating) return
    setEscalating(true)

    const chatMessages = displayMessages.map((m) => ({
      role: m.role,
      content: m.text,
    }))

    const result = await escalateAssistanceSession({
      sessionId: session?.id,
      escalationReason: escalationReason || t('escalation.defaultReason'),
      messages: chatMessages,
      aiActions: [t('escalation.checkedContext'), t('escalation.attemptedResolution')],
    })

    setEscalating(false)

    if (!result.ok) {
      toast.error(result.error ?? t('escalation.failed'))
      return
    }

    setEscalationSuggested(false)
    setHumanConnected(true)
    setSession((prev) => {
      const sessionId = result.sessionId ?? prev?.id ?? ''
      return {
        id: sessionId,
        status: 'escalated' as const,
        category: prev?.category ?? result.summary?.category ?? null,
        escalationReason: escalationReason || t('escalation.defaultReason'),
        ticketId: result.ticketId ?? null,
        ticketNumber: result.ticketNumber ?? null,
        assignedAgentId: prev?.assignedAgentId ?? null,
        createdAt: prev?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    if (result.summary) setEscalationSummary(result.summary)

    if (result.connectedMessage) {
      const connectedId = `connected-${Date.now()}`
      setSupplementalMessages((prev) => [
        ...prev,
        { id: connectedId, role: 'system', text: result.connectedMessage! },
      ])
    }

    toast.success(t('escalation.connected'))
  }

  const handleResolve = async () => {
    if (!session?.id) return
    await resolveAssistanceSession(session.id)
    setSession((prev) => (prev ? { ...prev, status: 'resolved' } : prev))
    toast.success(t('resolved'))
  }

  const handleFileSelect = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadAssistanceAttachment(formData)
    setUploading(false)
    if (!result.ok || !result.attachment) {
      toast.error(result.error ?? t('attachmentFailed'))
      return
    }
    setPendingAttachments((prev) => [...prev, result.attachment!])
  }

  const clientError = useMemo(() => {
    if (infrastructureMissing) return t('infrastructureMissing')
    if (!error) return null
    const sanitized = toPrimeAiClientError(error.message)
    return sanitized === PRIMEAI_UNAVAILABLE_USER_MESSAGE ? t('unavailable') : t('requestFailed')
  }, [error, infrastructureMissing, t])

  const hasUnread = userMessageCount > 0 && session?.status === 'active'

  return {
    session,
    sessionLoading,
    messages: displayMessages,
    input,
    setInput: handleInputChange,
    isLoading,
    isHumanMode,
    humanConnected,
    userMessageCount,
    pendingAction,
    setPendingAction,
    escalationSuggested,
    escalationReason,
    escalationSummary,
    escalating,
    uploading,
    pendingAttachments,
    clientError,
    hasUnread,
    hasAgentReply,
    agentJoined,
    agentPresence: presence.agentPresence,
    agentTyping: presence.agentTyping,
    welcomeText,
    hasConversationHistory,
    infrastructureMissing,
    submitMessage,
    startChat,
    handleEscalate,
    handleResolve,
    handleFileSelect,
    setEscalationSuggested,
    setEscalationReason,
  }
}

export type AssistanceChatState = ReturnType<typeof useAssistanceChat>
