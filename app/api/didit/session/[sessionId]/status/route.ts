import { NextResponse } from 'next/server'
import { requireAdminApiModule } from '@/lib/admin/api-auth'
import { logAdminAction } from '@/lib/admin/audit'
import { applyDiditSessionStatusOverride } from '@/lib/didit/session-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ sessionId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApiModule('kyc_aml_compliance')
  if (auth.response) return auth.response

  const { sessionId } = await context.params
  const trimmed = sessionId?.trim()
  if (!trimmed) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  let body: { status?: string; comment?: string }
  try {
    body = (await request.json()) as { status?: string; comment?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const status = body.status?.trim()
  if (status !== 'Approved' && status !== 'Declined') {
    return NextResponse.json(
      { error: 'status must be Approved or Declined' },
      { status: 400 }
    )
  }

  try {
    const session = await applyDiditSessionStatusOverride({
      sessionId: trimmed,
      newStatus: status,
      comment: body.comment?.trim() || undefined,
    })

    await logAdminAction({
      context: auth.context!,
      module: 'kyc_aml_compliance',
      action: status === 'Approved' ? 'didit_session_approved' : 'didit_session_declined',
      afterState: { session_id: trimmed, status: session.status },
    })

    return NextResponse.json({ session })
  } catch (err) {
    console.error('[didit/session/status PATCH]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update session status' },
      { status: 500 }
    )
  }
}
