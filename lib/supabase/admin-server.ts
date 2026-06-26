import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

let adminClient: SupabaseClient | null = null

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
}

export function hasAdminServerAccess() {
  return Boolean(getSupabaseUrl() && getServiceRoleKey())
}

export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const key = getServiceRoleKey()

  if (!url || !key) {
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
