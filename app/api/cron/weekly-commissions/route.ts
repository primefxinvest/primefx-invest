import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { runWeeklyInvestmentProfits } from '@/lib/invest/profit-service'
import {
  distributePendingReferralCommissions,
  payPendingRankCashBonuses,
} from '@/lib/referral/commission-service'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profitRun = await runWeeklyInvestmentProfits()
    const commissions = await distributePendingReferralCommissions()
    const rankBonuses = await payPendingRankCashBonuses()

    return NextResponse.json({
      ok: true,
      profitRun,
      commissions,
      rankBonuses,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Weekly commission run failed' },
      { status: 500 }
    )
  }
}
