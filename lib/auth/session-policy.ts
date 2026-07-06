export const REMEMBER_SESSION_COOKIE = 'primefx_remember_session'

/** Default idle timeout for standard sessions (30 minutes). */
export const SESSION_IDLE_MS_DEFAULT = 30 * 60 * 1000

/** Extended idle timeout when the user opts into "Remember me" (7 days). */
export const SESSION_IDLE_MS_REMEMBER = 7 * 24 * 60 * 60 * 1000

export function isRememberSessionEnabled(cookieValue: string | undefined): boolean {
  return cookieValue === '1'
}

export function resolveSessionIdleMs(rememberSession: boolean): number {
  return rememberSession ? SESSION_IDLE_MS_REMEMBER : SESSION_IDLE_MS_DEFAULT
}

type AuthErrorLike = {
  message?: string
  status?: number
  name?: string
}

/** Only treat definitive auth failures as grounds to clear a session. */
export function isDefinitiveAuthError(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false

  const message = (error.message ?? '').toLowerCase()
  const status = error.status

  if (status === 401) return true

  return (
    message.includes('invalid jwt') ||
    message.includes('jwt expired') ||
    message.includes('refresh token not found') ||
    message.includes('invalid refresh token') ||
    message.includes('session not found') ||
    message.includes('auth session missing') ||
    message.includes('user not found')
  )
}

export function isTransientAuthError(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false
  if (error instanceof TypeError) {
    return error.message === 'Failed to fetch'
  }
  const message = (error.message ?? '').toLowerCase()
  return (
    message === 'failed to fetch' ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch')
  )
}
