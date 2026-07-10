'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPostSignupSession } from '@/lib/auth/signup-session'

/** @deprecated Prefer POST /api/auth/post-signup-session for reliable cookie handling. */
export async function establishPostSignupSessionAction(input: {
  userId: string
  email: string
}): Promise<{ success: boolean; error?: string; code?: string }> {
  const supabase = await createServerSupabaseClient()
  return createPostSignupSession({
    userId: input.userId,
    email: input.email,
    verifyOtp: async (tokenHash) => {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email',
      })
      return { error: error ? { message: error.message, code: error.code } : null }
    },
  })
}
