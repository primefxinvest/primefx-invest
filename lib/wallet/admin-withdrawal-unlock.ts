import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import { notifyWithdrawalReadyForPayout } from '@/lib/notifications/service'
import {
  ADMIN_HOLD_UNLOCKED_AT_KEY,
  ADMIN_HOLD_UNLOCKED_BY_KEY,
} from '@/lib/wallet/withdrawal-admin-unlock'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal unlock.')
  }
  return db
}

export async function adminUnlockWithdrawalHold(input: {
  requestId: string
  adminEmail: string
  adminUserId: string
}) {
  const db = getDb()
  const now = new Date().toISOString()

  const { data: request, error: fetchError } = await db
    .from('withdrawal_requests')
    .select('*')
    .eq('id', input.requestId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!request) throw new Error('Withdrawal request not found.')

  const status = String(request.status ?? '').toLowerCase()
  if (status !== 'pending_notice') {
    throw new Error('Only withdrawals under the security hold can be unlocked.')
  }

  const existingMetadata = (request.metadata as Record<string, unknown> | null) ?? {}
  const metadata = {
    ...existingMetadata,
    [ADMIN_HOLD_UNLOCKED_AT_KEY]: now,
    [ADMIN_HOLD_UNLOCKED_BY_KEY]: input.adminEmail.trim().toLowerCase(),
  }

  const { data: updated, error: updateError } = await db
    .from('withdrawal_requests')
    .update({
      status: 'ready',
      available_at: now,
      metadata,
    })
    .eq('id', input.requestId)
    .eq('status', 'pending_notice')
    .select('*')
    .maybeSingle()

  if (updateError) throw new Error(updateError.message)
  if (!updated) {
    throw new Error('Withdrawal hold could not be unlocked — status may have changed.')
  }

  const userId = String(updated.user_id)
  const gross = Number(updated.amount_usd ?? 0)
  const referenceId = String(updated.reference_id ?? '')

  if (referenceId) {
    await db
      .from('transactions')
      .update({
        description: 'Wallet withdrawal — Unlocked by Admin. Ready for payout.',
      })
      .eq('reference_id', referenceId)
      .eq('user_id', userId)
  }

  await logFinancialAudit({
    eventType: 'withdrawal.admin_hold_unlocked',
    userId,
    referenceId: referenceId || input.requestId,
    amountUsd: gross,
    metadata: {
      request_id: input.requestId,
      unlocked_by: input.adminEmail,
      unlocked_by_user_id: input.adminUserId,
    },
  })

  await notifyWithdrawalReadyForPayout(userId, gross, referenceId || input.requestId)

  return {
    requestId: input.requestId,
    userId,
    referenceId,
    status: 'ready' as const,
    unlockedAt: now,
    unlockedBy: input.adminEmail,
  }
}
