'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import {
  AWAY_THRESHOLD_MS,
  PRESENCE_HEARTBEAT_MS,
  TYPING_INACTIVITY_MS,
  presenceChannelName,
  type PresenceParticipantRole,
  type PresenceState,
  type PresenceStatus,
  type TypingState,
} from '@/lib/assistance/presence'

type UseAssistancePresenceOptions = {
  sessionId: string | null | undefined
  participantId: string
  role: PresenceParticipantRole
  displayName?: string
  enabled?: boolean
}

export function useAssistancePresence({
  sessionId,
  participantId,
  role,
  displayName,
  enabled = true,
}: UseAssistancePresenceOptions) {
  const [participants, setParticipants] = useState<PresenceState[]>([])
  const [typing, setTyping] = useState<TypingState[]>([])
  const [localStatus, setLocalStatus] = useState<PresenceStatus>('online')
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef(Date.now())
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>['channel']> | null>(null)

  const broadcastPresence = useCallback(
    (status: PresenceStatus) => {
      const channel = channelRef.current
      if (!channel) return
      void channel.send({
        type: 'broadcast',
        event: 'presence',
        payload: {
          participantId,
          role,
          status,
          displayName,
          joinedAt: new Date().toISOString(),
        } satisfies PresenceState,
      })
    },
    [displayName, participantId, role]
  )

  const setTypingActive = useCallback(
    (isTyping: boolean) => {
      const channel = channelRef.current
      if (!channel) return
      void channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { participantId, role, isTyping } satisfies TypingState,
      })
    },
    [participantId, role]
  )

  const signalTyping = useCallback(() => {
    lastActivityRef.current = Date.now()
    setTypingActive(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      setTypingActive(false)
    }, TYPING_INACTIVITY_MS)
  }, [setTypingActive])

  useEffect(() => {
    if (!sessionId || !enabled || !participantId) return

    let cancelled = false
    const supabase = createBrowserSupabaseClient()
    const channel = supabase.channel(presenceChannelName(sessionId), {
      config: { broadcast: { self: false } },
    })

    channelRef.current = channel

    channel
      .on('broadcast', { event: 'presence' }, ({ payload }) => {
        if (cancelled) return
        const state = payload as PresenceState
        if (state.participantId === participantId) return
        setParticipants((prev) => {
          const next = prev.filter((p) => p.participantId !== state.participantId)
          if (state.status !== 'offline') next.push(state)
          return next
        })
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (cancelled) return
        const state = payload as TypingState
        if (state.participantId === participantId) return
        setTyping((prev) => {
          const filtered = prev.filter((t) => t.participantId !== state.participantId)
          if (state.isTyping) filtered.push(state)
          return filtered
        })
        if (state.isTyping) {
          setTimeout(() => {
            setTyping((prev) =>
              prev.filter((t) => t.participantId !== state.participantId || t.isTyping)
            )
          }, TYPING_INACTIVITY_MS + 500)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastPresence('online')
        }
      })

    const heartbeat = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      const nextStatus: PresenceStatus = idle > AWAY_THRESHOLD_MS ? 'away' : 'online'
      setLocalStatus(nextStatus)
      broadcastPresence(nextStatus)
    }, PRESENCE_HEARTBEAT_MS)

    const handleVisibility = () => {
      if (document.hidden) {
        broadcastPresence('away')
      } else {
        lastActivityRef.current = Date.now()
        broadcastPresence('online')
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      void channel.send({
        type: 'broadcast',
        event: 'presence',
        payload: {
          participantId,
          role,
          status: 'offline',
        } satisfies PresenceState,
      })
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [broadcastPresence, enabled, participantId, role, sessionId])

  const agentPresence = participants.find((p) => p.role === 'agent')
  const userPresence = participants.find((p) => p.role === 'user')
  const agentTyping = typing.some((t) => t.role === 'agent' && t.isTyping)
  const userTyping = typing.some((t) => t.role === 'user' && t.isTyping)

  return {
    localStatus,
    agentPresence,
    userPresence,
    agentTyping,
    userTyping,
    signalTyping,
  }
}
