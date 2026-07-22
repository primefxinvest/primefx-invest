'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function useAdminWithdrawalRealtime(input?: {
  enabled?: boolean
  onUpdate?: () => void
}) {
  const { enabled = true, onUpdate } = input ?? {}
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('admin:withdrawal-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
        },
        () => {
          onUpdateRef.current?.()
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, router])
}
