import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

let adminClient: SupabaseClient | null = null

export type ServiceRoleKeyIssue = 'missing' | 'same-as-anon' | 'wrong-role' | 'invalid-format'

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
}

function decodeJwtRole(key: string): string | null {
  try {
    const parts = key.split('.')
    if (parts.length < 2) return null

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf8')
    const data = JSON.parse(json) as { role?: string }

    return typeof data.role === 'string' ? data.role : null
  } catch {
    return null
  }
}

export function getServiceRoleKeyIssue(): ServiceRoleKeyIssue | null {
  const key = getServiceRoleKey().trim()
  const anonKey = getSupabaseAnonKey().trim()

  if (!key) {
    return 'missing'
  }

  if (anonKey && key === anonKey) {
    return 'same-as-anon'
  }

  const role = decodeJwtRole(key)
  if (!role) {
    return 'invalid-format'
  }

  if (role !== 'service_role') {
    return 'wrong-role'
  }

  return null
}

export function hasAdminServerAccess() {
  return Boolean(getSupabaseUrl() && getServiceRoleKeyIssue() === null)
}

export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const key = getServiceRoleKey()

  if (!url || !key || getServiceRoleKeyIssue()) {
    adminClient = null
    return null
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return adminClient
}

export function createFallbackSupabaseClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
