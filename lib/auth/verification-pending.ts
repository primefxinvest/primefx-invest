/** Client-side pending email verification state after signup (Option A). */

export const VERIFICATION_PENDING_STORAGE_KEY = 'primefx_verification_pending'

export type VerificationPending = {
  userId: string
  email: string
  createdAt: number
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000

export function saveVerificationPending(input: { userId: string; email: string }): void {
  if (typeof window === 'undefined') return

  const payload: VerificationPending = {
    userId: input.userId,
    email: input.email.trim().toLowerCase(),
    createdAt: Date.now(),
  }

  try {
    sessionStorage.setItem(VERIFICATION_PENDING_STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.error('[verification] failed to persist pending state', err)
  }
}

export function readVerificationPending(): VerificationPending | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(VERIFICATION_PENDING_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as VerificationPending
    if (!parsed?.userId || !parsed?.email) {
      clearVerificationPending()
      return null
    }

    if (Date.now() - (parsed.createdAt || 0) > MAX_AGE_MS) {
      clearVerificationPending()
      return null
    }

    return {
      userId: parsed.userId,
      email: parsed.email.trim().toLowerCase(),
      createdAt: parsed.createdAt,
    }
  } catch (err) {
    console.error('[verification] failed to read pending state', err)
    clearVerificationPending()
    return null
  }
}

export function updateVerificationPendingEmail(email: string): void {
  const current = readVerificationPending()
  if (!current) return
  saveVerificationPending({ userId: current.userId, email })
}

export function clearVerificationPending(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(VERIFICATION_PENDING_STORAGE_KEY)
  } catch {
    // ignore
  }
}
