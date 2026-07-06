'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  escalateAssistanceSession,
  getOrCreateAssistanceSession,
  resolveAssistanceSession,
  saveAssistanceMessage,
  sendEscalatedUserMessage,
  uploadAssistanceAttachment,
} from '@/lib/assistance/actions'
import type { AssistanceAttachment, AssistanceMessage, AssistanceSession, EscalationSummary } from '@/lib/assistance/types'
import { parseEscalationFromResponse, userRequestsHumanSupport } from '@/lib/assistance/escalation'
import { getMessageText } from '@/lib/ai/message-utils'
import { toPrimeAiClientError, PRIMEAI_UNAVAILABLE_USER_MESSAGE } from '@/lib/ai/user-errors'
import { useAssistanceChatTransport } from '@/lib/hooks/useAssistanceChatTransport'
import { useAssistanceRealtime } from '@/lib/hooks/useAssistanceRealtime'

export type AssistanceDisplayMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'agent'
  text: string
}

export function useAssistanceChat() {
  const t = useTranslations('assistance')
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
  const lastSavedAssistantRef = useRef<string | null>(null)
  const pendingQueryRef = useRef<string | null>(null)
  const knownMessageIdsRef = useRef<Set<string>>(new Set())

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

  const displayMessages = useMemo<AssistanceDisplayMessage[]>(() => {
    const fromChat = messages.map((m) => ({
      id: m.id,
      role: m.role as AssistanceDisplayMessage['role'],
      text: getMessageText(m),
    }))
    const merged = [...fromChat, ...supplementalMessages]
    const seen = new Set<string>()
    return merged.filter((m) => {
      if (!m.text || seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
  }, [messages, supplementalMessages])

  const userMessageCount = useMemo(
    () => displayMessages.filter((m) => m.role === 'user').length,
    [displayMessages]
  )

  const handleRealtimeMessage = useCallback((message: AssistanceMessage) => {
    if (knownMessageIdsRef.current.has(message.id)) return
    knownMessageIdsRef.current.add(message.id)

    if (message.role === 'agent') {
      setHasAgentReply(true)
    }

    if (message.role === 'agent' || message.role === 'system') {
      setSupplementalMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        const next = [
          ...prev,
          { id: message.id, role: message.role, text: message.content },
        ]
        console.log('[USER_MESSAGE_RENDERED]', {
          messageId: message.id,
          role: message.role,
          totalSupplemental: next.length,
        })
        return next
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
  }, [setMessages])

  useAssistanceRealtime(session?.id, handleRealtimeMessage, knownMessageIdsRef)

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
        const chatMessages = persisted
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: m.content }],
          }))

        const extra = persisted
          .filter((m) => m.role === 'agent' || m.role === 'system')
          .map((m) => ({ id: m.id, role: m.role, text: m.content }))

        for (const m of persisted) {
          knownMessageIdsRef.current.add(m.id)
        }

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
      if (!session?.id) return
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
      }
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

      await persistUserMessage(trimmed, pendingAttachments)

      if (isEscalated) {
        const optimisticId = `optimistic-${Date.now()}`
        setSupplementalMessages((prev) => [
          ...prev,
          { id: optimisticId, role: 'user', text: trimmed + attachmentNote },
        ])
      } else {
        sendMessage({ text: trimmed + attachmentNote })
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
      sendMessage,
      session?.id,
      setMessages,
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
    setInput,
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
