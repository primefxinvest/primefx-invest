'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { enforceUserRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { isEmailVerified } from '@/lib/auth/require-verified-email'
import type {
  EmailVerificationActionResult,
  EmailVerificationStatus,
} from '@/lib/auth/email-verification-types'

const RESEND_COOLDOWN_SECONDS = 60

function getEmailVerificationRedirectUrl(origin: string) {
  const url = new URL('/auth/callback', origin)
  url.searchParams.set('redirect', '/dashboard')
  return url.toString()
}

async function readLastSentAt(userId: string): Promise<string | null> {
  const db = createAdminSupabaseClient()
  if (!db) return null

  const { data } = await db
    .from('users')
    .select('verification_email_sent_at')
    .eq('id', userId)
    .maybeSingle()

  return (data?.verification_email_sent_at as string | null) ?? null
}

function computeResendCooldownSeconds(lastSentAt: string | null): number {
  if (!lastSentAt) return 0
  const elapsed = Date.now() - new Date(lastSentAt).getTime()
  const remaining = RESEND_COOLDOWN_SECONDS * 1000 - elapsed
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

export async function getEmailVerificationStatusAction(): Promise<EmailVerificationStatus | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return null

  const lastSentAt = await readLastSentAt(user.id)

  return {
    email: user.email,
    verified: isEmailVerified(user),
    lastSentAt,
    resendCooldownSeconds: computeResendCooldownSeconds(lastSentAt),
  }
}

async function recordVerificationEmailSent(userId: string) {
  const db = createAdminSupabaseClient()
  if (!db) return

  await db
    .from('users')
    .update({
      verification_email_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}

export async function resendVerificationEmailAction(
  origin?: string
): Promise<EmailVerificationActionResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { success: false, error: 'You must be signed in.', code: 'UNAUTHORIZED' }
  }

  if (isEmailVerified(user)) {
    return { success: false, error: 'Your email is already verified.', code: 'ALREADY_VERIFIED' }
  }

  try {
    await enforceUserRateLimit('email:resend', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return {
        success: false,
        error: err.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: err.retryAfterSeconds,
      }
    }
    throw err
  }

  const redirectTo = getEmailVerificationRedirectUrl(
    origin?.trim() || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  )

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: { emailRedirectTo: redirectTo },
  })

  if (error) {
    return {
      success: false,
      error: error.message || 'Failed to send verification email.',
      code: 'SEND_FAILED',
    }
  }

  await recordVerificationEmailSent(user.id)

  return { success: true }
}

export async function refreshEmailVerificationAction(): Promise<EmailVerificationStatus | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) return null

  const lastSentAt = await readLastSentAt(user.id)

  return {
    email: user.email,
    verified: isEmailVerified(user),
    lastSentAt,
    resendCooldownSeconds: computeResendCooldownSeconds(lastSentAt),
  }
}

export async function recordSignupVerificationEmailSentAction(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || isEmailVerified(user)) return

  await recordVerificationEmailSent(user.id)
}
