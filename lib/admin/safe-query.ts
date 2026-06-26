import 'server-only'

import { hasAdminServerAccess } from '@/lib/supabase/admin-server'

export async function withAdminData<T>(
  loader: () => Promise<T>,
  fallback: T
): Promise<{ data: T; error: string | null; configured: boolean }> {
  if (!hasAdminServerAccess()) {
    return { data: fallback, error: null, configured: false }
  }

  try {
    const data = await loader()
    return { data, error: null, configured: true }
  } catch (err) {
    return {
      data: fallback,
      error: err instanceof Error ? err.message : 'Failed to load admin data',
      configured: true,
    }
  }
}
