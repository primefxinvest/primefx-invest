'use client'

import { useEffect, useRef, type MutableRefObject } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { pollAssistanceMessages } from '@/lib/assistance/actions'
import { adminPollAssistanceMessages } from '@/lib/admin/assistance-actions'
import { REALTIME_POLL_INTERVAL_MS, REALTIME_RECONNECT_DELAY_MS } from '@/lib/assistance/constants'
import type { AssistanceMessage } from '@/lib/assistance/types'

type RealtimeMessage = {
  id: string
  role: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

type UseAssistanceRealtimeOptions = {
  mode?: 'user' | 'admin'
  onUpdate?: (message: AssistanceMessage) => void
}

function mapRow(row: RealtimeMessage): AssistanceMessage {
  return {
    id: row.id,
    role: row.role as AssistanceMessage['role'],
    content: row.content,
    metadata: (row.metadata as AssistanceMessage['metadata']) ?? {},
    createdAt: row.created_at,
  }
}

export function useAssistanceRealtime(
  sessionId: string | null | undefined,
  onMessage: (message: AssistanceMessage) => void,
  knownIdsRef?: MutableRefObject<Set<string>>,
  options?: UseAssistanceRealtimeOptions
) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage
  const onUpdateRef = useRef(options?.onUpdate)
  onUpdateRef.current = options?.onUpdate
  const mode = options?.mode ?? 'user'
  const trackedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    const supabase = createBrowserSupabaseClient()

    const isKnown = (id: string) => {
      if (knownIdsRef?.current.has(id)) return true
      return trackedIdsRef.current.has(id)
    }

    const markKnown = (id: string) => {
      knownIdsRef?.current.add(id)
      trackedIdsRef.current.add(id)
    }

    const deliver = (message: AssistanceMessage) => {
      if (cancelled) return
      if (isKnown(message.id)) {
        onUpdateRef.current?.(message)
        return
      }
      markKnown(message.id)
      onMessageRef.current(message)
    }

    const poll = async () => {
      if (cancelled) return

      if (mode === 'admin') {
        const known = knownIdsRef ? Array.from(knownIdsRef.current) : []
        const result = await adminPollAssistanceMessages(sessionId, known)
        if (!result.success || !result.messages?.length) return
        for (const message of result.messages) {
          deliver({
            id: message.id,
            role: message.role as AssistanceMessage['role'],
            content: message.content,
            metadata: (message.metadata as AssistanceMessage['metadata']) ?? {},
            createdAt: message.createdAt,
          })
        }
        return
      }

      const known = knownIdsRef ? Array.from(knownIdsRef.current) : []
      const result = await pollAssistanceMessages(sessionId, known)
      if (result.ok && result.messages?.length) {
        for (const message of result.messages) {
          if (message.role === 'agent' || message.role === 'system') {
            deliver(message)
          }
        }
      }
    }

    const startPolling = () => {
      if (pollTimer) return
      void poll()
      pollTimer = setInterval(() => {
        void poll()
      }, REALTIME_POLL_INTERVAL_MS)
    }

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    let channel = supabase.channel(`assistance:${sessionId}:${mode}`)

    const subscribe = () => {
      if (mode === 'admin') {
        startPolling()
        return
      }

      channel = supabase
        .channel(`assistance:${sessionId}:user`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assistance_messages',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            deliver(mapRow(payload.new as RealtimeMessage))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'assistance_messages',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const message = mapRow(payload.new as RealtimeMessage)
            onUpdateRef.current?.(message)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            stopPolling()
            void poll()
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            startPolling()
            if (!reconnectTimer) {
              reconnectTimer = setTimeout(() => {
                reconnectTimer = null
                if (cancelled) return
                void supabase.removeChannel(channel)
                subscribe()
              }, REALTIME_RECONNECT_DELAY_MS)
            }
          }
        })

      startPolling()
    }

    subscribe()

    return () => {
      cancelled = true
      stopPolling()
      if (reconnectTimer) clearTimeout(reconnectTimer)
      void supabase.removeChannel(channel)
    }
  }, [sessionId, knownIdsRef, mode])
}
