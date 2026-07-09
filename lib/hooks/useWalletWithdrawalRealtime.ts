'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

function dispatchWalletWithdrawalsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('primefx:wallet-withdrawals-updated'))
}

export function useWalletWithdrawalRealtime(input: {
  userId?: string
  enabled?: boolean
  onUpdate?: () => void
}) {
  const { userId, enabled = true, onUpdate } = input
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!enabled || !userId) return

    const channel = supabase
      .channel(`user:wallet-withdrawals:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdateRef.current?.()
          dispatchWalletWithdrawalsUpdated()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, userId])
}
