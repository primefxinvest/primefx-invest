'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { getCurrentUser, supabase } from '@/lib/supabase'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import { getStoredProfileAvatar, getStoredProfileFullName } from '@/lib/profile/actions'
import { resolveUserDisplayName } from '@/lib/profile/display-name'
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

type SessionStore = {
  user: SessionUser
  loaded: boolean
}

let store: SessionStore = { user: emptyUser, loaded: false }
let loadPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return store
}

async function loadSessionUser() {
  const { data } = await getCurrentUser()

  if (!data) {
    store = { user: emptyUser, loaded: true }
    emit()
    return
  }

  let tier =
    (data.user_metadata?.investor_tier as string | undefined) ??
    (data.user_metadata?.tier as string | undefined) ??
    'Starter'

  const { data: dbUser } = await supabase
    .from('users')
    .select('investor_tier, full_name, avatar_url')
    .eq('id', data.id)
    .maybeSingle()

  if (dbUser?.investor_tier) {
    tier = dbUser.investor_tier as string
  }

  const storedAvatar = getStoredProfileAvatar(data.id)

  store = {
    user: {
      id: data.id,
      name: resolveUserDisplayName({
        dbName: dbUser?.full_name as string | undefined,
        metadataName: data.user_metadata?.full_name as string | undefined,
        localName: getStoredProfileFullName(data.id),
        email: data.email,
      }),
      email: data.email ?? '',
      tier: formatTierLabel(tier),
      avatar:
        (dbUser?.avatar_url as string | undefined) ??
        storedAvatar ??
        (data.user_metadata?.avatar_url as string | undefined) ??
        getDefaultAvatarUrl(data.id),
    },
    loaded: true,
  }
  emit()
}

function ensureSessionLoaded() {
  if (loadPromise) return loadPromise
  loadPromise = loadSessionUser().finally(() => {
    loadPromise = null
  })
  return loadPromise
}

function invalidateSession() {
  store = { user: emptyUser, loaded: false }
  loadPromise = null
  emit()
  void ensureSessionLoaded()
}

let authListenerBound = false

function bindAuthListener() {
  if (authListenerBound || typeof window === 'undefined') return
  authListenerBound = true

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      store = { user: emptyUser, loaded: true }
      emit()
      return
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      invalidateSession()
    }
  })

  window.addEventListener('primefx:profile-updated', invalidateSession)
}

export function useSessionUser() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    bindAuthListener()
    if (!snapshot.loaded) {
      void ensureSessionLoaded()
    }
  }, [snapshot.loaded])

  return snapshot.user
}
