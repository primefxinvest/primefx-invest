import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { runDailyCron } from '@/lib/cron/daily-jobs'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDailyCron()

    return NextResponse.json({
      ok: true,
      ...result,
      note:
        'Unified daily cron: wallet withdrawals (daily), investment profits (Mon–Fri), referral + capital payouts (Friday).',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Daily cron failed' },
      { status: 500 }
    )
  }
}
