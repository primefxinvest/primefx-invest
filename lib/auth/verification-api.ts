import 'server-only'

import { createAdminSupabaseClient, getServiceRoleKeyIssue } from '@/lib/supabase/admin-server'
import { waitForAuthUser } from '@/lib/auth/signup-session'
import { isEmailVerified } from '@/lib/auth/require-verified-email'

export function getVerificationEmailRedirectUrl(origin: string) {
  const url = new URL('/auth/callback', origin)
  url.searchParams.set('redirect', '/dashboard')
  url.searchParams.set('verify', '1')
  return url.toString()
}

export function requireAdminClient() {
  const admin = createAdminSupabaseClient()
  const keyIssue = getServiceRoleKeyIssue()
  if (!admin || keyIssue) {
    const error =
      keyIssue === 'wrong-role' || keyIssue === 'same-as-anon'
        ? 'SUPABASE_SERVICE_ROLE_KEY is set to the anon key. Use the service_role secret from Supabase → Project Settings → API.'
        : 'Server auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment.'
    return { admin: null as null, error, code: keyIssue ?? 'SERVICE_ROLE_MISSING' }
  }
  return { admin, error: null as null, code: null as null }
}

export async function getAuthUserVerificationState(userId: string, email: string) {
  const { admin, error, code } = requireAdminClient()
  if (!admin) {
    return { success: false as const, error: error!, code: code! }
  }

  const authUser = await waitForAuthUser(admin, userId)
  if (!authUser?.email) {
    console.error('[verification] auth user not found', { userId })
    return {
      success: false as const,
      error: 'Account not found. Please sign up again.',
      code: 'AUTH_USER_NOT_FOUND',
    }
  }

  if (authUser.email.toLowerCase() !== email.trim().toLowerCase()) {
    console.error('[verification] email mismatch', {
      userId,
      expected: email,
      actual: authUser.email,
    })
    return {
      success: false as const,
      error: 'Email does not match this account.',
      code: 'EMAIL_MISMATCH',
    }
  }

  return {
    success: true as const,
    admin,
    authUser,
    verified: isEmailVerified(authUser),
    email: authUser.email,
    emailConfirmedAt: authUser.email_confirmed_at ?? null,
  }
}

export async function recordVerificationEmailSent(userId: string) {
  const { admin } = requireAdminClient()
  if (!admin) return

  const { error } = await admin
    .from('users')
    .update({
      verification_email_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('[verification] record sent_at failed', {
      userId,
      message: error.message,
    })
  }
}

export async function sendSignupVerificationEmail(input: {
  email: string
  redirectTo: string
}) {
  const { admin, error, code } = requireAdminClient()
  if (!admin) {
    return { success: false as const, error: error!, code: code! }
  }

  const { error: resendError } = await admin.auth.resend({
    type: 'signup',
    email: input.email,
    options: { emailRedirectTo: input.redirectTo },
  })

  if (resendError) {
    console.error('[verification] resend failed', {
      email: input.email,
      message: resendError.message,
      code: resendError.code,
    })
    return {
      success: false as const,
      error: resendError.message || 'Verification email failed.',
      code: resendError.code ?? 'SEND_FAILED',
    }
  }

  return { success: true as const }
}
