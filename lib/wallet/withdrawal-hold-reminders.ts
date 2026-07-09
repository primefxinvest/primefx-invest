import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import {
  notifyWithdrawalHoldOneDayRemaining,
  notifyWithdrawalHoldThreeDaysRemaining,
} from '@/lib/notifications/service'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal hold reminders.')
  }
  return db
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Send deduplicated 3-day and 1-day hold reminders for active withdrawals. */
export async function processWithdrawalHoldReminders(limit = 200) {
  const db = getDb()
  const now = Date.now()

  const { data, error } = await db
    .from('withdrawal_requests')
    .select('id, user_id, amount_usd, reference_id, available_at, status')
    .eq('status', 'pending_notice')
    .order('available_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)

  let threeDay = 0
  let oneDay = 0
  let skipped = 0

  for (const row of data ?? []) {
    const availableAt = new Date(String(row.available_at)).getTime()
    const remainingMs = availableAt - now
    if (remainingMs <= 0) {
      skipped += 1
      continue
    }

    const userId = String(row.user_id)
    const amount = Number(row.amount_usd)
    const referenceId = String(row.reference_id)
    const daysLeft = Math.ceil(remainingMs / DAY_MS)

    if (daysLeft === 3) {
      const sent = await notifyWithdrawalHoldThreeDaysRemaining(userId, amount, referenceId)
      if (sent) threeDay += 1
      else skipped += 1
      continue
    }

    if (daysLeft === 1) {
      const sent = await notifyWithdrawalHoldOneDayRemaining(userId, amount, referenceId)
      if (sent) oneDay += 1
      else skipped += 1
      continue
    }

    skipped += 1
  }

  return { threeDay, oneDay, skipped, checked: data?.length ?? 0 }
}
