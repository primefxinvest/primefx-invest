import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import {
  listDueWithdrawalRequests,
  markWithdrawalRequestStatus,
} from '@/lib/wallet/withdrawals'
import { releaseWalletHold } from '@/lib/payments/wallet-ledger'
import { completeTransaction } from '@/lib/payments/wallet-ledger'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const due = await listDueWithdrawalRequests()
    let processed = 0

    for (const row of due) {
      const gross = Number(row.amount_usd)
      const referenceId = row.reference_id as string

      await releaseWalletHold(row.user_id as string, gross)
      await completeTransaction(referenceId, 'Completed')
      await markWithdrawalRequestStatus(row.id as string, 'completed')

      processed += 1
    }

    return NextResponse.json({ ok: true, processed, totalDue: due.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Withdrawal processing failed' },
      { status: 500 }
    )
  }
}
