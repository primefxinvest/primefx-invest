import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { processDueCapitalWithdrawals } from '@/lib/cron/daily-jobs'
import { runWeeklyReferralDistribution } from '@/lib/referral/commission-service'

/** Manual trigger — production schedule uses /api/cron/daily (Fridays) */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const referral = await runWeeklyReferralDistribution()
    const capitalWithdrawals = await processDueCapitalWithdrawals()

    return NextResponse.json({
      ok: true,
      referral,
      capitalWithdrawals,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Weekly distribution failed' },
      { status: 500 }
    )
  }
}
