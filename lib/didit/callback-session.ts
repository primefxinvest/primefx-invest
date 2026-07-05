export const DIDIT_SESSION_STORAGE_KEY = 'primefx_didit_session_id'

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
