import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { runWeeklyReferralDistribution } from '@/lib/referral/commission-service'
import {
  listDueInvestmentCapitalWithdrawals,
  processInvestmentCapitalWithdrawal,
} from '@/lib/invest/capital-withdrawal'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const referral = await runWeeklyReferralDistribution()

    const dueCapital = await listDueInvestmentCapitalWithdrawals()
    let capitalProcessed = 0
    for (const row of dueCapital) {
      await processInvestmentCapitalWithdrawal(row.id as string)
      capitalProcessed += 1
    }

    return NextResponse.json({
      ok: true,
      referral,
      capitalWithdrawals: { processed: capitalProcessed, totalDue: dueCapital.length },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Weekly distribution failed' },
      { status: 500 }
    )
  }
}
