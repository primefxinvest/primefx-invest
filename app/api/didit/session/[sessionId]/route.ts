import { NextResponse } from 'next/server'
import { requireAdminApiModule } from '@/lib/admin/api-auth'
import { logAdminAction } from '@/lib/admin/audit'
import { refreshDiditSessionFromApi } from '@/lib/didit/session-admin'
import { getDiditSessionNotFoundAdminMessage, isDiditSessionNotFoundError } from '@/lib/didit/errors'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ sessionId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiModule('kyc_aml_compliance')
  if (auth.response) return auth.response

  const { sessionId } = await context.params
  const trimmed = sessionId?.trim()
  if (!trimmed) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  try {
    const session = await refreshDiditSessionFromApi(trimmed)

    await logAdminAction({
      context: auth.context!,
      module: 'kyc_aml_compliance',
      action: 'didit_session_refreshed',
      afterState: { session_id: trimmed, status: session.status },
    })

    const sessionNotFound =
      session.status === 'Expired' &&
      typeof session.decision === 'object' &&
      session.decision !== null &&
      (session.decision as Record<string, unknown>).reason === 'session_not_found'

    return NextResponse.json({
      session,
      ...(sessionNotFound
        ? { sessionNotFound: true, message: getDiditSessionNotFoundAdminMessage() }
        : {}),
    })
  } catch (err) {
    console.error('[didit/session GET]', err)
    if (isDiditSessionNotFoundError(err)) {
      return NextResponse.json(
        {
          error: getDiditSessionNotFoundAdminMessage(),
          sessionNotFound: true,
          sessionId: err.sessionId,
        },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to refresh session' },
      { status: 500 }
    )
  }
}
