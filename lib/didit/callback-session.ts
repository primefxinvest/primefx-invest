export const DIDIT_SESSION_STORAGE_KEY = 'primefx_didit_session_id'
export const VERIFY_RETURN_PATH_KEY = 'primefx_verify_return_to'

export type VerifyReturnPath = '/profile' | '/dashboard'

export function storeDiditSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(DIDIT_SESSION_STORAGE_KEY, sessionId)
  } catch {
    // sessionStorage may be unavailable in some in-app browsers
  }
}

export function readStoredDiditSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    return sessionStorage.getItem(DIDIT_SESSION_STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function clearStoredDiditSessionId(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DIDIT_SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** URL param first, then sessionStorage backup from /api/verify/start. */
export function resolveCallbackSessionId(urlSessionId: string): string {
  return urlSessionId.trim() || readStoredDiditSessionId()
}

/** Remember where the user started verification (profile vs dashboard). */
export function storeVerifyReturnPath(pathname: string): void {
  if (typeof window === 'undefined') return
  try {
    const normalized = pathname.replace(/^\/(en|fr|es|de|ar)(?=\/|$)/, '') || '/'
    const target: VerifyReturnPath =
      normalized === '/profile' || normalized.startsWith('/profile/') ? '/profile' : '/dashboard'
    sessionStorage.setItem(VERIFY_RETURN_PATH_KEY, target)
  } catch {
    // sessionStorage may be unavailable in some in-app browsers
  }
}

export function resolveVerifyReturnPath(): VerifyReturnPath {
  if (typeof window === 'undefined') return '/dashboard'
  try {
    const stored = sessionStorage.getItem(VERIFY_RETURN_PATH_KEY)
    if (stored === '/profile') return '/profile'
    if (typeof document !== 'undefined' && document.referrer.includes('/profile')) {
      return '/profile'
    }
  } catch {
    // ignore
  }
  return '/dashboard'
}

export function clearVerifyReturnPath(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(VERIFY_RETURN_PATH_KEY)
  } catch {
    // ignore
  }
}
