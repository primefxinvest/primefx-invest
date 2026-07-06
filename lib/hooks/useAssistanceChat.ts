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
  uploadAssistanceAttachment,
} from '@/lib/assistance/actions'
import type { AssistanceAttachment, AssistanceSession, EscalationSummary } from '@/lib/assistance/types'
import { parseEscalationFromResponse, userRequestsHumanSupport } from '@/lib/assistance/escalation'
import { getMessageText } from '@/lib/ai/message-utils'
import { toPrimeAiClientError, PRIMEAI_UNAVAILABLE_USER_MESSAGE } from '@/lib/ai/user-errors'
import { useAssistanceChatTransport } from '@/lib/hooks/useAssistanceChatTransport'

export function useAssistanceChat() {
  const t = useTranslations('assistance')
  const [session, setSession] = useState<AssistanceSession | null>(null)
  const [hasAgentReply, setHasAgentReply] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [input, setInput] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [escalationSuggested, setEscalationSuggested] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')
  const [escalationSummary, setEscalationSummary] = useState<EscalationSummary | null>(null)
  const [escalating, setEscalating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<AssistanceAttachment[]>([])
  const lastSavedAssistantRef = useRef<string | null>(null)
  const pendingQueryRef = useRef<string | null>(null)

  const transport = useAssistanceChatTransport(session?.id ?? null)
  const welcomeText = useMemo(() => t('welcomeMessage'), [t])
  const [hasConversationHistory, setHasConversationHistory] = useState(false)

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport,
    messages: [],
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isHumanMode = session?.status === 'escalated' && (hasAgentReply || Boolean(session.ticketNumber))
  const userMessageCount = messages.filter((m) => m.role === 'user').length

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await getOrCreateAssistanceSession()
      if (cancelled) return
      setSessionLoading(false)
      if (!result.ok || !result.data) return

      setSession(result.data.session)
      setHasAgentReply(result.data.hasAgentReply)

      if (result.data.messages.length > 0) {
        setHasConversationHistory(true)
        setMessages(
          result.data.messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              parts: [{ type: 'text' as const, text: m.content }],
            }))
        )
      } else {
        setHasConversationHistory(false)
        setMessages([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setMessages])

  const persistUserMessage = useCallback(
    async (text: string, attachments?: AssistanceAttachment[]) => {
      if (!session?.id) return
      await saveAssistanceMessage({
        sessionId: session.id,
        role: 'user',
        content: text,
        metadata: attachments?.length ? { attachments } : {},
      })
    },
    [session?.id]
  )

  const persistAssistantMessage = useCallback(
    async (text: string, meta?: { escalationSuggested?: boolean; escalationReason?: string }) => {
      if (!session?.id) return
      await saveAssistanceMessage({
        sessionId: session.id,
        role: 'assistant',
        content: text,
        metadata: meta ?? {},
      })
    },
    [session?.id]
  )

  useEffect(() => {
    if (status !== 'ready' || isLoading) return
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
  }, [status, isLoading, messages, persistAssistantMessage, setMessages, t])

  const submitMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return
      clearError()
      setPendingAction(null)
      setEscalationSuggested(false)

      if (userRequestsHumanSupport(trimmed)) {
        setEscalationSuggested(true)
        setEscalationReason(t('escalation.userRequested'))
      }

      const attachmentNote =
        pendingAttachments.length > 0
          ? `\n[Attachments: ${pendingAttachments.map((a) => a.name).join(', ')}]`
          : ''

      await persistUserMessage(trimmed, pendingAttachments)
      sendMessage({ text: trimmed + attachmentNote })
      setInput('')
      setPendingAttachments([])
    },
    [clearError, isLoading, pendingAttachments, persistUserMessage, sendMessage, t]
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
    if (!session?.id || escalating) return
    setEscalating(true)

    const chatMessages = messages.map((m) => ({
      role: m.role,
      content: getMessageText(m),
    }))

    const result = await escalateAssistanceSession({
      sessionId: session.id,
      escalationReason: escalationReason || t('escalation.defaultReason'),
      messages: chatMessages,
      aiActions: [t('escalation.checkedContext'), t('escalation.attemptedResolution')],
    })

    setEscalating(false)

    if (!result.ok) {
      toast.error(result.error ?? t('escalation.failed'))
      return
    }

    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'escalated',
            ticketId: result.ticketId ?? null,
            ticketNumber: result.ticketNumber ?? null,
          }
        : prev
    )
    if (result.summary) setEscalationSummary(result.summary)
    toast.success(t('escalation.success', { ticket: result.ticketNumber ?? '' }))
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
    if (!error) return null
    const sanitized = toPrimeAiClientError(error.message)
    return sanitized === PRIMEAI_UNAVAILABLE_USER_MESSAGE ? t('unavailable') : t('requestFailed')
  }, [error, t])

  const hasUnread = userMessageCount > 0 && session?.status === 'active'

  return {
    session,
    sessionLoading,
    messages,
    input,
    setInput,
    isLoading,
    isHumanMode,
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
