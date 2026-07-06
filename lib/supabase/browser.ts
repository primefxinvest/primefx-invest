import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

const BROWSER_AUTH_OPTIONS = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
} as const

let browserClient: SupabaseClient | undefined

export function createBrowserSupabaseClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
    )
  }

  // Keep a single instance in the browser; avoid reusing a server-created singleton after hydration.
  if (typeof window !== 'undefined') {
    if (!browserClient) {
      browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, BROWSER_AUTH_OPTIONS)
    }
    return browserClient
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, BROWSER_AUTH_OPTIONS)
}
