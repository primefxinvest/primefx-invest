'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, supabase } from '@/lib/supabase'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import { getStoredProfileAvatar } from '@/lib/profile/actions'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { formatInvestorTierLabel } from '@/lib/investor/tiers'

export interface SessionUser {
  id: string
  name: string
  email: string
  tier: string
  avatar: string
}

function formatTierLabel(tier?: string | null) {
  return formatInvestorTierLabel(tier)
}

const emptyUser: SessionUser = {
  id: '',
  name: 'Guest',
  email: '',
  tier: 'Investor',
  avatar: getDefaultAvatarUrl('guest'),
}

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser>(emptyUser)

  useEffect(() => {
    let active = true

    async function load() {
      const { data } = await getCurrentUser()
      if (!active) return

      if (!data) {
        setUser(emptyUser)
        return
      }

      let tier =
        (data.user_metadata?.investor_tier as string | undefined) ??
        (data.user_metadata?.tier as string | undefined) ??
        'Starter'

      const { data: dbUser } = await supabase
        .from('users')
        .select('investor_tier')
        .eq('id', data.id)
        .maybeSingle()

      if (dbUser?.investor_tier) {
        tier = dbUser.investor_tier as string
      }

      const storedAvatar = getStoredProfileAvatar(data.id)

      setUser({
        id: data.id,
        name:
          (data.user_metadata?.full_name as string | undefined) ??
          data.email?.split('@')[0] ??
          'User',
        email: data.email ?? '',
        tier: formatTierLabel(tier),
        avatar:
          storedAvatar ??
          (data.user_metadata?.avatar_url as string | undefined) ??
          getDefaultAvatarUrl(data.id),
      })
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(emptyUser)
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        load()
      }
    })

    const handleProfileUpdate = () => {
      load()
    }

    window.addEventListener('primefx:profile-updated', handleProfileUpdate)

    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener('primefx:profile-updated', handleProfileUpdate)
    }
  }, [])

  return user
}
