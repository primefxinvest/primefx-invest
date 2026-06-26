import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type { AdminContext, AdminModule } from './types'

interface AuditLogInput {
  context: AdminContext
  module: AdminModule
  action: string
  targetUserId?: string
  targetResource?: string
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  reasonCode?: string
  metadata?: Record<string, unknown>
}

export async function logAdminAction(input: AuditLogInput) {
  const adminDb = createAdminSupabaseClient()
  if (!adminDb) {
    console.warn('[admin] audit log skipped — service role not configured', input.action)
    return
  }

  await adminDb.from('admin_audit_logs').insert({
    admin_id: input.context.userId,
    admin_tier: input.context.tier,
    module: input.module,
    action: input.action,
    target_user_id: input.targetUserId ?? null,
    target_resource: input.targetResource ?? null,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
    reason_code: input.reasonCode ?? null,
    metadata: input.metadata ?? {},
  })
}
