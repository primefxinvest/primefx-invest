'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { TransactionDbRow } from '@/lib/data/transaction-map'

export type TransactionRealtimeRow = TransactionDbRow

function dispatchTransactionsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('primefx:transactions-updated'))
}

function dispatchWalletUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('primefx:wallet-updated'))
}

export function useUserTransactionsRealtime(input: {
  userId?: string
  enabled?: boolean
  onInsert?: (row: TransactionRealtimeRow) => void
  onUpdate?: (row: TransactionRealtimeRow) => void
}) {
  const { userId, enabled = true, onInsert, onUpdate } = input
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  onInsertRef.current = onInsert
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!enabled || !userId) return

    const channel = supabase
      .channel(`user:transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as TransactionRealtimeRow
          if (!row?.id) return
          onInsertRef.current?.(row)
          dispatchTransactionsUpdated()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as TransactionRealtimeRow
          if (!row?.id) return
          onUpdateRef.current?.(row)
          dispatchTransactionsUpdated()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, userId])
}

export function useUserWalletRealtime(input: {
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
      .channel(`user:wallet:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallet_balances',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdateRef.current?.()
          dispatchWalletUpdated()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, userId])
}

export function useAdminTransactionsRealtime(input: {
  enabled?: boolean
  onInsert?: (row: TransactionRealtimeRow) => void
  onUpdate?: (row: TransactionRealtimeRow) => void
}) {
  const { enabled = true, onInsert, onUpdate } = input
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  onInsertRef.current = onInsert
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('admin:transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const row = payload.new as TransactionRealtimeRow
          if (!row?.id) return
          onInsertRef.current?.(row)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          const row = payload.new as TransactionRealtimeRow
          if (!row?.id) return
          onUpdateRef.current?.(row)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled])
}
