import { NextResponse, type NextRequest } from 'next/server'
import { createPostSignupSession } from '@/lib/auth/signup-session'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  let body: { userId?: string; email?: string }
  try {
    body = (await request.json()) as { userId?: string; email?: string }
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid request body.',
        error: { code: 'INVALID_BODY' },
      },
      { status: 400 }
    )
  }

  const userId = body.userId?.trim()
  const email = body.email?.trim()

  if (!userId || !email) {
    return NextResponse.json(
      {
        success: false,
        message: 'userId and email are required.',
        error: { code: 'MISSING_FIELDS' },
      },
      { status: 400 }
    )
  }

  try {
    const { supabase, applyCookiesTo } = createRouteHandlerSupabaseClient(request, () =>
      NextResponse.json({ success: true, message: 'Session created.' })
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
      return NextResponse.json(
        {
          success: false,
          message: result.error,
          error: { code: result.code ?? 'SESSION_FAILED', detail: result.error },
        },
        { status: 422 }
      )
    }

    return applyCookiesTo(
      NextResponse.json({
        success: true,
        message: 'Session created successfully.',
        data: { userId },
      })
    )
  } catch (err) {
    console.error('[api:post-signup-session] unhandled error', err)
    return NextResponse.json(
      {
        success: false,
        message: 'Could not sign you in after signup. Please try logging in.',
        error: { code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}
