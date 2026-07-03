import { NextResponse } from 'next/server'
import { createDiditVerificationSession } from '@/lib/didit/client'
import { upsertVerificationSession } from '@/lib/didit/verification-sessions'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

  if (profile?.is_verified || String(profile?.kyc_status).toLowerCase() === 'verified') {
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
