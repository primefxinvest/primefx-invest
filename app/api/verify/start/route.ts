import { NextResponse } from 'next/server'
import { createDiditVerificationSession } from '@/lib/didit/client'
import { upsertVerificationSession } from '@/lib/didit/verification-sessions'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { enforceUserRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { logSecurityAudit } from '@/lib/security/security-audit'
import { requireVerifiedEmail } from '@/lib/auth/require-verified-email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const emailVerification = requireVerifiedEmail(user)
  if (!emailVerification.allowed) {
    return NextResponse.json(
      { error: emailVerification.error, code: 'EMAIL_NOT_VERIFIED' },
      { status: 403 }
    )
  }

  try {
    await enforceUserRateLimit('kyc:start', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message, code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    }
    throw err
  }

  let requestedUserId: string | undefined
  try {
    const body = (await request.json()) as { userId?: unknown }
    requestedUserId =
      typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : undefined
  } catch {
    requestedUserId = undefined
  }

  if (requestedUserId && requestedUserId !== user.id) {
    return NextResponse.json({ error: 'Profile user mismatch.' }, { status: 403 })
  }

  const userId = requestedUserId ?? user.id

  const adminDb = createAdminSupabaseClient()
  if (!adminDb) {
    return NextResponse.json(
      { error: 'Verification service is not configured (missing service role key).' },
      { status: 503 }
    )
  }

  const { data: profile } = await adminDb
    .from('users')
    .select('is_verified, kyc_status, verification_status')
    .eq('id', userId)
    .maybeSingle()

  if (
    profile?.is_verified ||
    profile?.verification_status === 'approved' ||
    String(profile?.kyc_status).toLowerCase() === 'verified'
  ) {
    return NextResponse.json({ error: 'Identity is already verified.' }, { status: 409 })
  }

  try {
    const session = await createDiditVerificationSession({
      userId,
      email: user.email,
    })

    await adminDb
      .from('users')
      .update({
        didit_session_id: session.session_id,
        verification_status: 'pending',
        is_verified: false,
        kyc_verification_detail: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    await upsertVerificationSession({
      sessionId: session.session_id,
      vendorData: userId,
      status: session.status ?? 'Not Started',
      workflowId: session.workflow_id ?? null,
      userId,
    })

    await logSecurityAudit({
      eventType: 'kyc.verification_started',
      userId,
      actorId: user.id,
      resourceId: session.session_id,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.session_id,
      status: session.status,
    })
  } catch (err) {
    console.error('[verify/start]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to start verification' },
      { status: 500 }
    )
  }
}
