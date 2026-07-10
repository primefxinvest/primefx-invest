import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import { getWithdrawalAvailableDate } from '@/lib/fees/constants'
import {
  ADMIN_HOLD_UNLOCKED_AT_KEY,
  ADMIN_HOLD_UNLOCKED_BY_KEY,
} from '@/lib/wallet/withdrawal-admin-unlock'

const ADMIN_HOLD_RELOCKED_AT_KEY = 'admin_hold_relocked_at'
const ADMIN_HOLD_RELOCKED_BY_KEY = 'admin_hold_relocked_by'
const ADMIN_HOLD_RELOCK_REASON_KEY = 'admin_hold_relock_reason'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal re-lock.')
  }
  return db
}

export async function adminRelockWithdrawalHold(input: {
  requestId: string
  adminEmail: string
  adminUserId: string
  reason: string
}) {
  const reason = input.reason.trim()
  if (!reason) {
    throw new Error('A reason is required to re-lock a withdrawal.')
  }

  const db = getDb()
  const now = new Date()
  const availableAt = getWithdrawalAvailableDate(now).toISOString()

  const { data: request, error: fetchError } = await db
    .from('withdrawal_requests')
    .select('*')
    .eq('id', input.requestId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!request) throw new Error('Withdrawal request not found.')

  const status = String(request.status ?? '').toLowerCase()
  if (status !== 'ready') {
    throw new Error('Only ready withdrawals can be re-locked.')
  }

  const existingMetadata = (request.metadata as Record<string, unknown> | null) ?? {}
  const metadata: Record<string, unknown> = {
    ...existingMetadata,
    [ADMIN_HOLD_RELOCKED_AT_KEY]: now.toISOString(),
    [ADMIN_HOLD_RELOCKED_BY_KEY]: input.adminEmail.trim().toLowerCase(),
    [ADMIN_HOLD_RELOCK_REASON_KEY]: reason,
  }

  delete metadata[ADMIN_HOLD_UNLOCKED_AT_KEY]
  delete metadata[ADMIN_HOLD_UNLOCKED_BY_KEY]

  const { data: updated, error: updateError } = await db
    .from('withdrawal_requests')
    .update({
      status: 'pending_notice',
      available_at: availableAt,
      metadata,
    })
    .eq('id', input.requestId)
    .eq('status', 'ready')
    .select('*')
    .maybeSingle()

  if (updateError) throw new Error(updateError.message)
  if (!updated) {
    throw new Error('Withdrawal could not be re-locked — status may have changed.')
  }

  const userId = String(updated.user_id)
  const gross = Number(updated.amount_usd ?? 0)
  const referenceId = String(updated.reference_id ?? '')

  if (referenceId) {
    await db
      .from('transactions')
      .update({
        description: 'Wallet withdrawal — Security hold re-applied by admin.',
      })
      .eq('reference_id', referenceId)
      .eq('user_id', userId)
  }

  await logFinancialAudit({
    eventType: 'withdrawal.admin_hold_relocked',
    userId,
    referenceId: referenceId || input.requestId,
    amountUsd: gross,
    metadata: {
      request_id: input.requestId,
      relocked_by: input.adminEmail,
      relocked_by_user_id: input.adminUserId,
      reason,
      available_at: availableAt,
    },
  })

  return {
    requestId: input.requestId,
    userId,
    referenceId,
    status: 'pending_notice' as const,
    availableAt,
    reason,
  }
}

export function getWithdrawalRelockMetadataKeys() {
  return {
    relockedAt: ADMIN_HOLD_RELOCKED_AT_KEY,
    relockedBy: ADMIN_HOLD_RELOCKED_BY_KEY,
    relockReason: ADMIN_HOLD_RELOCK_REASON_KEY,
  }
}
