'use client'

import { supabase } from '@/lib/supabase'

function clearAppSessionState() {
  if (typeof window === 'undefined') return

  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('primefx_')) {
      sessionStorage.removeItem(key)
    }
  })
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: clientError } = await supabase.auth.signOut({ scope: 'global' })

    if (clientError) {
      return { success: false, error: clientError.message }
    }

    const response = await fetch('/auth/signout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      return { success: false, error: body?.error ?? 'Could not clear your session.' }
    }

    clearAppSessionState()
    window.location.href = '/login'
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Logout failed. Please try again.',
    }
  }
}
