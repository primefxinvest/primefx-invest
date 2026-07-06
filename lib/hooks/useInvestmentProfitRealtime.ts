'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

function dispatchInvestmentUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('primefx:investment-updated'))
}

export function useInvestmentProfitRealtime(input: {
  userId?: string
  investmentId?: string
  enabled?: boolean
  onChange?: () => void
}) {
  const { userId, investmentId, enabled = true, onChange } = input
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!enabled || !userId) return

    const channel = supabase
      .channel(`user:investment-profits:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'investment_profit_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (investmentId && payload.new?.investment_id !== investmentId) return
          onChangeRef.current?.()
          dispatchInvestmentUpdated()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'investments',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (investmentId && payload.new?.id !== investmentId) return
          onChangeRef.current?.()
          dispatchInvestmentUpdated()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, investmentId, userId])
}
