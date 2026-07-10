import { NextResponse, type NextRequest } from 'next/server'
import { createPostSignupSession } from '@/lib/auth/signup-session'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  let body: { userId?: string; email?: string }
  try {
    body = (await request.json()) as { userId?: string; email?: string }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const userId = body.userId?.trim()
  const email = body.email?.trim()

  if (!userId || !email) {
    return NextResponse.json(
      { success: false, error: 'userId and email are required.', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  const { supabase, applyCookiesTo } = createRouteHandlerSupabaseClient(request, () =>
    NextResponse.json({ success: true })
  )

  const result = await createPostSignupSession({
    userId,
    email,
    verifyOtp: async (tokenHash) => {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email',
      })
      return { error: error ? { message: error.message, code: error.code } : null }
    },
  })

  if (!result.success) {
    return NextResponse.json(result, { status: 422 })
  }

  return applyCookiesTo(NextResponse.json({ success: true }))
}
