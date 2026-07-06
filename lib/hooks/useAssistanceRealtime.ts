'use client'

import { useEffect, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import type { AssistanceMessage } from '@/lib/assistance/types'

type RealtimeMessage = {
  id: string
  role: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

export function useAssistanceRealtime(
  sessionId: string | null | undefined,
  onMessage: (message: AssistanceMessage) => void
) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!sessionId) return

    const supabase = createBrowserSupabaseClient()
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
          onMessageRef.current({
            id: row.id,
            role: row.role as AssistanceMessage['role'],
            content: row.content,
            metadata: (row.metadata as AssistanceMessage['metadata']) ?? {},
            createdAt: row.created_at,
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [sessionId])
}
