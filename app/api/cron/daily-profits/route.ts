import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { runDailyInvestmentProfits } from '@/lib/invest/profit-service'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profitRun = await runDailyInvestmentProfits()

    return NextResponse.json({
      ok: true,
      profitRun,
      note: 'Referral commissions accrue as pending and pay on weekly distribution cron.',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Daily profit run failed' },
      { status: 500 }
    )
  }
}
