import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'
import { stripLocalePrefix } from '@/lib/i18n/pathname'

export function sanitizeRedirectPath(path: string | null | undefined, fallback = '/dashboard') {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return fallback
  }
  return stripLocalePrefix(path)
}

export function getAuthenticatedEntryPath(
  redirectParam?: string | null,
  pendingMfa = false
) {
  if (pendingMfa) {
    const redirect = sanitizeRedirectPath(redirectParam)
    return `${MFA_VERIFY_ROUTE}?redirect=${encodeURIComponent(redirect)}`
  }
  return sanitizeRedirectPath(redirectParam)
}

export async function getValidatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    await supabase.auth.signOut()
    return { user: null as User | null, invalidSession: true, error }
  }

  return { user, invalidSession: false, error: null }
}
