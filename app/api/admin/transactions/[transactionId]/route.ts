import { NextResponse } from 'next/server'
import { requireAdminApiModule } from '@/lib/admin/api-auth'
import { getAdminTransactionById } from '@/lib/admin/queries'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ transactionId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiModule('financial_management')
  if (auth.response) return auth.response

  const { transactionId } = await context.params
  const trimmed = transactionId?.trim()
  if (!trimmed) {
    return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
  }

  try {
    const transaction = await getAdminTransactionById(trimmed)
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ transaction })
  } catch (err) {
    console.error('[admin/transactions GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load transaction' },
      { status: 500 }
    )
  }
}
