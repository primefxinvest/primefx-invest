'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const AUTH_USER_RETRY_ATTEMPTS = 5
const AUTH_USER_RETRY_DELAY_MS = 400

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForAuthUser(admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, userId: string) {
  for (let attempt = 0; attempt < AUTH_USER_RETRY_ATTEMPTS; attempt += 1) {
    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (!error && data?.user) {
      return data.user
    }
    if (attempt < AUTH_USER_RETRY_ATTEMPTS - 1) {
      await sleep(AUTH_USER_RETRY_DELAY_MS)
    }
  }
  return null
}

/** Establish a session immediately after signup without requiring email confirmation. */
export async function establishPostSignupSessionAction(input: {
  userId: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return { success: false, error: 'Server configuration error.' }
  }

  const authUser = await waitForAuthUser(admin, input.userId)
  if (!authUser?.email) {
    return {
      success: false,
      error: 'Account is still being created. Please wait a moment and try signing in.',
    }
  }

  if (authUser.email.toLowerCase() !== input.email.trim().toLowerCase()) {
    return { success: false, error: 'Account mismatch. Please contact support.' }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: authUser.email,
  })

  const tokenHash = linkData?.properties?.hashed_token
  if (linkError || !tokenHash) {
    return {
      success: false,
      error: linkError?.message ?? 'Could not start your session. Please try signing in.',
    }
  }

  const supabase = await createServerSupabaseClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  })

  if (verifyError) {
    return {
      success: false,
      error: verifyError.message || 'Could not sign you in. Please try logging in manually.',
    }
  }

  return { success: true }
}
