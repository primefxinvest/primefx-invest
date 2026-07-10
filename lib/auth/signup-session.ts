import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

const AUTH_USER_RETRY_ATTEMPTS = 4
const AUTH_USER_RETRY_DELAY_MS = 250

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForAuthUser(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  userId: string
) {
  for (let attempt = 0; attempt < AUTH_USER_RETRY_ATTEMPTS; attempt += 1) {
    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (!error && data?.user?.id) {
      return data.user
    }
    if (attempt < AUTH_USER_RETRY_ATTEMPTS - 1) {
      await sleep(AUTH_USER_RETRY_DELAY_MS)
    }
  }
  return null
}

export async function checkBootstrapRpcExists(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>
): Promise<{ exists: boolean; error?: string }> {
  const { error } = await admin.rpc('bootstrap_user_profile_atomic', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_email: 'rpc-probe@internal.local',
    p_full_name: 'RPC Probe',
    p_investor_tier: 'Starter',
  })

  if (!error) {
    return { exists: true }
  }

  const message = error.message ?? ''
  if (
    message.includes('bootstrap_user_profile_atomic') &&
    (message.includes('Could not find') ||
      message.includes('does not exist') ||
      error.code === 'PGRST202')
  ) {
    return {
      exists: false,
      error:
        'Database migration 046_signup_atomic_bootstrap.sql has not been applied. Run it in Supabase SQL editor.',
    }
  }

  return { exists: true }
}

export type PostSignupSessionResult =
  | { success: true }
  | { success: false; error: string; code?: string }

export async function createPostSignupSession(input: {
  userId: string
  email: string
  verifyOtp: (tokenHash: string) => Promise<{ error: { message: string; code?: string } | null }>
}): Promise<PostSignupSessionResult> {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return {
      success: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.',
      code: 'SERVICE_ROLE_MISSING',
    }
  }

  const authUser = await waitForAuthUser(admin, input.userId)
  if (!authUser?.email) {
    console.error('[signup:session] auth.users row not found', { userId: input.userId })
    return {
      success: false,
      error: `auth.users record not found for id ${input.userId}. Signup may not have completed.`,
      code: 'AUTH_USER_NOT_FOUND',
    }
  }

  if (authUser.email.toLowerCase() !== input.email.trim().toLowerCase()) {
    console.error('[signup:session] email mismatch', {
      userId: input.userId,
      expected: input.email,
      actual: authUser.email,
    })
    return {
      success: false,
      error: 'Signup email does not match the auth.users record.',
      code: 'EMAIL_MISMATCH',
    }
  }

  // Option A: only establish a session after the email is confirmed.
  if (!authUser.email_confirmed_at) {
    console.info('[session] refusing pre-verification session', { userId: input.userId })
    return {
      success: false,
      error: 'Please verify your email before signing in.',
      code: 'EMAIL_NOT_VERIFIED',
    }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: authUser.email,
  })

  const tokenHash = linkData?.properties?.hashed_token
  if (linkError || !tokenHash) {
    console.error('[signup:session] generateLink failed', {
      userId: input.userId,
      error: linkError?.message,
    })
    return {
      success: false,
      error: linkError?.message ?? 'Could not generate signup session link.',
      code: linkError?.code ?? 'GENERATE_LINK_FAILED',
    }
  }

  const { error: verifyError } = await input.verifyOtp(tokenHash)
  if (verifyError) {
    console.error('[signup:session] verifyOtp failed', {
      userId: input.userId,
      error: verifyError.message,
      code: verifyError.code,
    })
    return {
      success: false,
      error: verifyError.message,
      code: verifyError.code ?? 'VERIFY_OTP_FAILED',
    }
  }

  return { success: true }
}
