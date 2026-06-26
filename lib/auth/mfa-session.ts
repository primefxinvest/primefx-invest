const MFA_SESSION_PREFIX = 'primefx_2fa_verified_'

export function markMfaSessionVerified(userId: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(`${MFA_SESSION_PREFIX}${userId}`, '1')
}

export function clearMfaSessionVerified(userId: string) {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(`${MFA_SESSION_PREFIX}${userId}`)
}

export function isMfaSessionVerified(userId: string) {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(`${MFA_SESSION_PREFIX}${userId}`) === '1'
}
