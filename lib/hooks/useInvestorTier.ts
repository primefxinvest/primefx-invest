'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, supabase } from '@/lib/supabase'
import {
  getInvestorTierConfig,
  normalizeInvestorTier,
  type InvestorTierKey,
} from '@/lib/investor/tiers'
import type { InvestorTierConfig } from '@/lib/investor/types'

export interface InvestorTierState {
  loading: boolean
  tierKey: InvestorTierKey
  tierLabel: string
  badge: string
  config: InvestorTierConfig
}

const defaultTier = getInvestorTierConfig('starter')

export function useInvestorTier(): InvestorTierState {
  const [state, setState] = useState<InvestorTierState>({
    loading: true,
    tierKey: 'starter',
    tierLabel: defaultTier.label,
    badge: defaultTier.badge,
    config: defaultTier,
  })

  useEffect(() => {
    let active = true

    async function load() {
      const { data: authUser } = await getCurrentUser()
      if (!active) return

      if (!authUser) {
        setState({
          loading: false,
          tierKey: 'starter',
          tierLabel: defaultTier.label,
          badge: defaultTier.badge,
          config: defaultTier,
        })
        return
      }

      let tierRaw =
        (authUser.user_metadata?.investor_tier as string | undefined) ??
        (authUser.user_metadata?.tier as string | undefined) ??
        'Starter'

      const { data: dbUser } = await supabase
        .from('users')
        .select('investor_tier')
        .eq('id', authUser.id)
        .maybeSingle()

      if (dbUser?.investor_tier) {
        tierRaw = dbUser.investor_tier as string
      }

      const tierKey = normalizeInvestorTier(tierRaw)
      const config = getInvestorTierConfig(tierKey)

      if (!active) return

      setState({
        loading: false,
        tierKey,
        tierLabel: config.label,
        badge: config.badge,
        config,
      })
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        load()
      }
    })

    const onProfileUpdate = () => load()
    window.addEventListener('primefx:profile-updated', onProfileUpdate)

    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener('primefx:profile-updated', onProfileUpdate)
    }
  }, [])

  return state
}
