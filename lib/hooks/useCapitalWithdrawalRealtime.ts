'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export type CapitalWithdrawalRealtimeRow = {
  id: string
  investment_id: string
  amount_usd: number | string
  status: string
  requested_at: string
  available_at: string
  reference_id: string | null
}

function dispatchCapitalWithdrawalsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('primefx:capital-withdrawals-updated'))
}

export function useCapitalWithdrawalRequestsRealtime(input: {
  userId?: string
  enabled?: boolean
  onChange?: (row: CapitalWithdrawalRealtimeRow, eventType: 'INSERT' | 'UPDATE') => void
}) {
  const { userId, enabled = true, onChange } = input
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!enabled || !userId) return

    const channel = supabase
      .channel(`user:capital-withdrawals:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'investment_withdrawal_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as CapitalWithdrawalRealtimeRow
          if (!row?.id) return
          onChangeRef.current?.(row, 'INSERT')
          dispatchCapitalWithdrawalsUpdated()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'investment_withdrawal_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as CapitalWithdrawalRealtimeRow
          if (!row?.id) return
          onChangeRef.current?.(row, 'UPDATE')
          dispatchCapitalWithdrawalsUpdated()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, userId])
}
