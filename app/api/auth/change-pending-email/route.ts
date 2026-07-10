import { NextResponse, type NextRequest } from 'next/server'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import {
  getAuthUserVerificationState,
  getVerificationEmailRedirectUrl,
  recordVerificationEmailSent,
  sendSignupVerificationEmail,
} from '@/lib/auth/verification-api'
import { mapVerificationErrorMessage } from '@/lib/auth/signup-errors'
import { getRequestOrigin } from '@/lib/supabase/route-handler'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    await enforceIpRateLimit('auth:change-pending-email')
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json(
        {
          success: false,
          message: err.message,
          error: { code: 'RATE_LIMIT_EXCEEDED' },
        },
        { status: 429 }
      )
    }
  }

  let body: { userId?: string; currentEmail?: string; newEmail?: string }
  try {
    body = (await request.json()) as {
      userId?: string
      currentEmail?: string
      newEmail?: string
    }
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
  const currentEmail = body.currentEmail?.trim()
  const newEmail = body.newEmail?.trim().toLowerCase()

  if (!userId || !currentEmail || !newEmail) {
    return NextResponse.json(
      {
        success: false,
        message: 'userId, currentEmail, and newEmail are required.',
        error: { code: 'MISSING_FIELDS' },
      },
      { status: 400 }
    )
  }

  if (!EMAIL_RE.test(newEmail)) {
    return NextResponse.json(
      {
        success: false,
        message: 'Please enter a valid email address.',
        error: { code: 'INVALID_EMAIL' },
      },
      { status: 400 }
    )
  }

  if (newEmail === currentEmail.toLowerCase()) {
    return NextResponse.json(
      {
        success: false,
        message: 'Enter a different email address.',
        error: { code: 'SAME_EMAIL' },
      },
      { status: 400 }
    )
  }

  try {
    const state = await getAuthUserVerificationState(userId, currentEmail)
    if (!state.success) {
      return NextResponse.json(
        {
          success: false,
          message: mapVerificationErrorMessage(state.error),
          error: { code: state.code, detail: state.error },
        },
        { status: 422 }
      )
    }

    if (state.verified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your email is already verified. Change it from Settings instead.',
          error: { code: 'ALREADY_VERIFIED' },
        },
        { status: 422 }
      )
    }

    const { error: updateError } = await state.admin.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: false,
    })

    if (updateError) {
      console.error('[verification] change email failed', {
        userId,
        message: updateError.message,
        code: updateError.code,
      })
      return NextResponse.json(
        {
          success: false,
          message: mapVerificationErrorMessage(updateError.message, 'Could not change email.'),
          error: { code: updateError.code ?? 'UPDATE_FAILED', detail: updateError.message },
        },
        { status: 422 }
      )
    }

    await state.admin
      .from('users')
      .update({
        email: newEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    const redirectTo = getVerificationEmailRedirectUrl(getRequestOrigin(request))
    const sent = await sendSignupVerificationEmail({
      email: newEmail,
      redirectTo,
    })

    if (!sent.success) {
      console.error('[verification] change email sent failed', {
        userId,
        newEmail,
        error: sent.error,
      })
      return NextResponse.json(
        {
          success: false,
          message: mapVerificationErrorMessage(
            sent.error,
            'Email updated but verification email failed. Please use Resend.'
          ),
          error: { code: sent.code, detail: sent.error },
          data: { email: newEmail },
        },
        { status: 422 }
      )
    }

    await recordVerificationEmailSent(userId)
    console.info('[verification] pending email changed', { userId, newEmail })

    return NextResponse.json({
      success: true,
      message: 'Email updated. We sent a new verification link.',
      data: { email: newEmail, verified: false },
    })
  } catch (err) {
    console.error('[verification] change-pending-email unhandled error', err)
    return NextResponse.json(
      {
        success: false,
        message: mapVerificationErrorMessage(err, 'Could not change email.'),
        error: { code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}
