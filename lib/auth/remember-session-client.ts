'use client'

import {
  REMEMBER_SESSION_COOKIE,
  SESSION_IDLE_MS_REMEMBER,
} from '@/lib/auth/session-policy'

function cookieSecureSuffix() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
}

export function setRememberSessionPreference(enabled: boolean) {
  if (typeof document === 'undefined') return

  if (enabled) {
    const maxAge = Math.floor(SESSION_IDLE_MS_REMEMBER / 1000)
    document.cookie = `${REMEMBER_SESSION_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${cookieSecureSuffix()}`
    return
  }

  document.cookie = `${REMEMBER_SESSION_COOKIE}=0; Path=/; Max-Age=0; SameSite=Lax${cookieSecureSuffix()}`
}

export function clearRememberSessionPreference() {
  setRememberSessionPreference(false)
}
