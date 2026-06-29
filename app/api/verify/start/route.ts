import { NextResponse } from 'next/server'
import { createDiditVerificationSession } from '@/lib/didit/client'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_verified || String(profile?.kyc_status).toLowerCase() === 'verified') {
    return NextResponse.json({ error: 'Identity is already verified.' }, { status: 409 })
  }

  try {
    const session = await createDiditVerificationSession({
      userId: user.id,
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
      .eq('id', user.id)

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
