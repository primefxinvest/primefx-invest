import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export type FinancialAuditEvent =
  | 'wallet.credit'
  | 'wallet.debit'
  | 'wallet.hold'
  | 'wallet.release_hold'
  | 'wallet.restore_hold'
  | 'deposit.claimed'
  | 'deposit.credited'
  | 'deposit.duplicate_blocked'
  | 'withdrawal.claimed'
  | 'withdrawal.approved'
  | 'withdrawal.rejected'
  | 'withdrawal.payout_initiated'
  | 'withdrawal.completed'
  | 'withdrawal.failed'
  | 'withdrawal.ready'
  | 'withdrawal.admin_hold_unlocked'
  | 'profit.run_claimed'
  | 'profit.run_completed'
  | 'profit.run_skipped'
  | 'referral.commission_accrued'
  | 'referral.commission_duplicate_blocked'
  | 'referral.commission_paid'
  | 'referral.rank_bonus_paid'
  | 'cron.lock_acquired'
  | 'cron.lock_released'
  | 'cron.lock_skipped'

export async function logFinancialAudit(input: {
  eventType: FinancialAuditEvent
  userId?: string | null
  referenceId?: string | null
  amountUsd?: number | null
  metadata?: Record<string, unknown>
}) {
  try {
    const db = createAdminSupabaseClient()
    if (!db) return

    await db.from('financial_audit_logs').insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      reference_id: input.referenceId ?? null,
      amount_usd: input.amountUsd ?? null,
      metadata: input.metadata ?? {},
    })
  } catch (err) {
    console.error('[financial-audit]', input.eventType, err)
  }
}
