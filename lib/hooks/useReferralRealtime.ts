'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useReferralRealtime(onRefresh: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        onRefresh()
      }, 800)
    }

    const channel = supabase
      .channel('referral-program-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referral_commissions' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referral_network' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_referral_stats' },
        scheduleRefresh
      )
      .subscribe()

    const onFocus = () => scheduleRefresh()
    window.addEventListener('focus', onFocus)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('focus', onFocus)
      void supabase.removeChannel(channel)
    }
  }, [enabled, onRefresh])
}
