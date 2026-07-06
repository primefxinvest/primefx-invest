import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export type AssistanceInfrastructureStatus = {
  ready: boolean
  tables: {
    assistance_sessions: boolean
    assistance_messages: boolean
    support_tickets: boolean
    support_agents: boolean
  }
  missing: string[]
  message: string | null
}

export async function checkAssistanceInfrastructure(): Promise<AssistanceInfrastructureStatus> {
  const admin = createAdminSupabaseClient()
  const tables = {
    assistance_sessions: false,
    assistance_messages: false,
    support_tickets: false,
    support_agents: false,
  }

  if (!admin) {
    return {
      ready: false,
      tables,
      missing: Object.keys(tables),
      message: 'Support infrastructure is not configured. Contact your administrator.',
    }
  }

  const checks = await Promise.all(
    (Object.keys(tables) as (keyof typeof tables)[]).map(async (table) => {
      const { error } = await admin.from(table).select('id').limit(1)
      const missing = Boolean(error?.message && isTableMissingError(error.message))
      return { table, exists: !missing }
    })
  )

  for (const check of checks) {
    tables[check.table] = check.exists
  }

  const missing = (Object.entries(tables) as [keyof typeof tables, boolean][])
    .filter(([, ok]) => !ok)
    .map(([name]) => name)

  return {
    ready: missing.length === 0,
    tables,
    missing,
    message:
      missing.length > 0
        ? `Support database not ready. Missing: ${missing.join(', ')}. Run migration 035/036.`
        : null,
  }
}

export function isTableMissingError(message: string): boolean {
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('relation') && message.includes('assistance')
  )
}
