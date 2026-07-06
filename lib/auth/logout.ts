'use client'

import { supabase } from '@/lib/supabase'
import { clearRememberSessionPreference } from '@/lib/auth/remember-session-client'
import { getLocaleFromPathname, localizePath } from '@/lib/i18n/pathname'
import type { AppLocale } from '@/i18n/routing'

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
    clearRememberSessionPreference()
    const locale = getLocaleFromPathname(window.location.pathname) as AppLocale
    window.location.href = localizePath('/login', locale)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Logout failed. Please try again.',
    }
  }
}
