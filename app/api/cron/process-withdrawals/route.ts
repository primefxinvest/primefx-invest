import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { processDueWalletWithdrawals } from '@/lib/cron/daily-jobs'

/** Manual trigger — production schedule uses /api/cron/daily */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processDueWalletWithdrawals()

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Withdrawal processing failed' },
      { status: 500 }
    )
  }
}
