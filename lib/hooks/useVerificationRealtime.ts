'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  isTerminalDiditStatus,
  mapDiditStatusToVerificationStatus,
  type UserVerificationStatus,
} from '@/lib/didit/status-maps'

export type VerificationSessionRealtimeRow = {
  session_id: string
  status: string
  decision: Record<string, unknown> | null
  updated_at: string
  user_id: string | null
}

export type UserVerificationRealtimePayload = {
  verificationStatus: UserVerificationStatus
  kycStatus: string | null
  isVerified: boolean
  diditStatus?: string
  sessionId?: string
  decision?: Record<string, unknown> | null
}

function dispatchVerificationUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('primefx:verification-updated'))
}

export function useAdminVerificationSessionsRealtime(input: {
  enabled?: boolean
  onSessionChange: (row: VerificationSessionRealtimeRow, eventType: 'INSERT' | 'UPDATE') => void
}) {
  const { enabled = true, onSessionChange } = input
  const onSessionChangeRef = useRef(onSessionChange)
  onSessionChangeRef.current = onSessionChange

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('admin:verification_sessions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'verification_sessions' },
        (payload) => {
          const row = payload.new as VerificationSessionRealtimeRow
          if (row?.session_id) onSessionChangeRef.current(row, 'INSERT')
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'verification_sessions' },
        (payload) => {
          const row = payload.new as VerificationSessionRealtimeRow
          if (row?.session_id) onSessionChangeRef.current(row, 'UPDATE')
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled])
}

export function useUserVerificationRealtime(input: {
  userId?: string
  sessionId?: string
  onUpdate: (payload: UserVerificationRealtimePayload) => void
}) {
  const { userId, sessionId, onUpdate } = input
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!userId && !sessionId) return

    const channelName = `user:verification:${userId ?? 'anon'}:${sessionId ?? 'none'}`
    const channel = supabase.channel(channelName)

    if (userId) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            verification_status?: string | null
            kyc_status?: string | null
            is_verified?: boolean | null
          }

          const verificationStatus = String(row.verification_status ?? 'pending').toLowerCase()
          const normalizedStatus =
            verificationStatus === 'approved' ||
            verificationStatus === 'declined' ||
            verificationStatus === 'expired' ||
            verificationStatus === 'pending_review' ||
            verificationStatus === 'in_progress' ||
            verificationStatus === 'abandoned'
              ? verificationStatus
              : 'pending'

          onUpdateRef.current({
            verificationStatus: normalizedStatus as UserVerificationStatus,
            kycStatus: (row.kyc_status as string | null) ?? null,
            isVerified: Boolean(row.is_verified),
          })
          dispatchVerificationUpdated()
        }
      )
    }

    if (userId) {
      const handleUserSessionRow = (row: VerificationSessionRealtimeRow) => {
        const diditStatus = row.status ?? 'In Progress'

        onUpdateRef.current({
          verificationStatus: mapDiditStatusToVerificationStatus(diditStatus),
          kycStatus: diditStatus === 'Approved' ? 'Verified' : null,
          isVerified: diditStatus === 'Approved',
          diditStatus,
          sessionId: row.session_id,
          decision: row.decision,
        })

        if (isTerminalDiditStatus(diditStatus)) {
          dispatchVerificationUpdated()
        }
      }

      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'verification_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          handleUserSessionRow(payload.new as VerificationSessionRealtimeRow)
        }
      )
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verification_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          handleUserSessionRow(payload.new as VerificationSessionRealtimeRow)
        }
      )
    }

    if (sessionId) {
      const handleSessionRow = (row: VerificationSessionRealtimeRow) => {
        const diditStatus = row.status ?? 'In Progress'

        onUpdateRef.current({
          verificationStatus: mapDiditStatusToVerificationStatus(diditStatus),
          kycStatus: null,
          isVerified: diditStatus === 'Approved',
          diditStatus,
          sessionId: row.session_id,
          decision: row.decision,
        })

        if (isTerminalDiditStatus(diditStatus)) {
          dispatchVerificationUpdated()
        }
      }

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verification_sessions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          handleSessionRow(payload.new as VerificationSessionRealtimeRow)
        }
      )
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'verification_sessions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          handleSessionRow(payload.new as VerificationSessionRealtimeRow)
        }
      )
    }

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, sessionId])
}
