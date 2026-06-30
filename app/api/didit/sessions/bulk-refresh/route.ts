import { NextResponse } from 'next/server'
import { requireAdminApiModule } from '@/lib/admin/api-auth'
import { logAdminAction } from '@/lib/admin/audit'
import { listPendingVerificationSessionIds, refreshDiditSessionFromApi } from '@/lib/didit/session-admin'

export const runtime = 'nodejs'

const BULK_CONCURRENCY = 5

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function refreshWithRetry(sessionId: string, maxAttempts = 4) {
  let attempt = 0
  while (attempt < maxAttempts) {
    attempt += 1
    try {
      const session = await refreshDiditSessionFromApi(sessionId)
      return { sessionId, ok: true as const, session }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const isRateLimited = message.includes('429')
      if (isRateLimited && attempt < maxAttempts) {
        const retryAfterSec = 2 ** attempt
        await sleep(retryAfterSec * 1000)
        continue
      }
      return { sessionId, ok: false as const, error: message }
    }
  }
  return { sessionId, ok: false as const, error: 'Max retry attempts exceeded' }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function runWorker() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker))
  return results
}

export async function POST() {
  const auth = await requireAdminApiModule('kyc_aml_compliance')
  if (auth.response) return auth.response

  try {
    const sessionIds = await listPendingVerificationSessionIds()
    const results = await runWithConcurrency(sessionIds, BULK_CONCURRENCY, refreshWithRetry)

    const updated = results.filter((result) => result.ok).length
    const failed = results.length - updated

    await logAdminAction({
      context: auth.context!,
      module: 'kyc_aml_compliance',
      action: 'didit_sessions_bulk_refresh',
      afterState: { total: sessionIds.length, updated, failed },
    })

    return NextResponse.json({
      total: sessionIds.length,
      updated,
      failed,
      results,
    })
  } catch (err) {
    console.error('[didit/sessions/bulk-refresh]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bulk refresh failed' },
      { status: 500 }
    )
  }
}
