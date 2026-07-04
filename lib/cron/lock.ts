import 'server-only'

import { randomUUID } from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { logFinancialAudit } from '@/lib/payments/financial-audit'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for cron locks.')
  }
  return db
}

export async function withCronJobLock<T>(
  jobName: string,
  fn: () => Promise<T>,
  ttlSeconds = 3600
): Promise<{ skipped: true; reason: string } | { skipped: false; result: T }> {
  const db = getDb()
  const owner = randomUUID()

  const { data: acquired, error } = await db.rpc('acquire_cron_job_lock', {
    p_job_name: jobName,
    p_owner: owner,
    p_ttl_seconds: ttlSeconds,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!acquired) {
    await logFinancialAudit({
      eventType: 'cron.lock_skipped',
      referenceId: jobName,
      metadata: { reason: 'lock_held' },
    })
    return { skipped: true, reason: `Cron job "${jobName}" is already running.` }
  }

  await logFinancialAudit({
    eventType: 'cron.lock_acquired',
    referenceId: jobName,
    metadata: { owner },
  })

  try {
    const result = await fn()
    return { skipped: false, result }
  } finally {
    await db.rpc('release_cron_job_lock', {
      p_job_name: jobName,
      p_owner: owner,
    })
    await logFinancialAudit({
      eventType: 'cron.lock_released',
      referenceId: jobName,
      metadata: { owner },
    })
  }
}
