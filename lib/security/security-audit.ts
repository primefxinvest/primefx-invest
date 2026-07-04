import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export type SecurityAuditEvent =
  | 'kyc.verification_started'
  | 'kyc.verification_synced'
  | 'kyc.verification_rejected'
  | 'kyc.session_ownership_denied'
  | 'kyc.admin_override'
  | 'admin.permission_changed'
  | 'rate_limit.exceeded'
  | 'transaction.pin_denied'
  | 'transaction.auth_denied'

export async function logSecurityAudit(input: {
  eventType: SecurityAuditEvent
  userId?: string | null
  actorId?: string | null
  resourceId?: string | null
  ipAddress?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    const db = createAdminSupabaseClient()
    if (!db) return

    await db.from('security_audit_logs').insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      actor_id: input.actorId ?? null,
      resource_id: input.resourceId ?? null,
      ip_address: input.ipAddress ?? null,
      metadata: input.metadata ?? {},
    })
  } catch (err) {
    console.error('[security-audit]', input.eventType, err)
  }
}
