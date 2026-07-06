'use client'

import { useEffect, useRef, type MutableRefObject } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { pollAssistanceMessages } from '@/lib/assistance/actions'
import type { AssistanceMessage } from '@/lib/assistance/types'

type RealtimeMessage = {
  id: string
  role: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

const POLL_INTERVAL_MS = 3000

export function useAssistanceRealtime(
  sessionId: string | null | undefined,
  onMessage: (message: AssistanceMessage) => void,
  knownIdsRef?: MutableRefObject<Set<string>>
) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    const supabase = createBrowserSupabaseClient()

    const deliver = (message: AssistanceMessage, source: 'realtime' | 'poll') => {
      if (cancelled) return
      if (knownIdsRef?.current.has(message.id)) return

      console.log('[USER_REALTIME_EVENT_RECEIVED]', {
        source,
        messageId: message.id,
        role: message.role,
        sessionId,
      })

      onMessageRef.current(message)
    }

    const channel = supabase
      .channel(`assistance:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assistance_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeMessage
          deliver(
            {
              id: row.id,
              role: row.role as AssistanceMessage['role'],
              content: row.content,
              metadata: (row.metadata as AssistanceMessage['metadata']) ?? {},
              createdAt: row.created_at,
            },
            'realtime'
          )
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[USER_REALTIME_EVENT_RECEIVED] subscription unhealthy', { status, sessionId })
        }
      })

    const poll = async () => {
      if (cancelled) return
      const known = knownIdsRef ? Array.from(knownIdsRef.current) : []
      const result = await pollAssistanceMessages(sessionId, known)
      if (!result.ok || !result.messages?.length) return

      for (const message of result.messages) {
        if (message.role !== 'agent' && message.role !== 'system') continue
        deliver(message, 'poll')
      }
    }

    void poll()
    const pollTimer = setInterval(() => {
      void poll()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(pollTimer)
      void supabase.removeChannel(channel)
    }
  }, [sessionId, knownIdsRef])
}
