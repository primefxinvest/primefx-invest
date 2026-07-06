import 'server-only'

import type { User } from '@supabase/supabase-js'

export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED' as const

export const EMAIL_NOT_VERIFIED_MESSAGE =
  'Please verify your email address before using this feature.'

export function isEmailVerified(user: Pick<User, 'email_confirmed_at'> | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at)
}

export function requireVerifiedEmail(
  user: Pick<User, 'email_confirmed_at'> | null | undefined
):
  | { allowed: true }
  | { allowed: false; error: string; code: typeof EMAIL_NOT_VERIFIED_CODE } {
  if (isEmailVerified(user)) {
    return { allowed: true }
  }

  return {
    allowed: false,
    error: EMAIL_NOT_VERIFIED_MESSAGE,
    code: EMAIL_NOT_VERIFIED_CODE,
  }
}
