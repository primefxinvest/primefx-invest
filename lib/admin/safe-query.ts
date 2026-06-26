import 'server-only'

import {
  getServiceRoleKeyIssue,
  hasAdminServerAccess,
  type ServiceRoleKeyIssue,
} from '@/lib/supabase/admin-server'

export async function withAdminData<T>(
  loader: () => Promise<T>,
  fallback: T
): Promise<{
  data: T
  error: string | null
  configured: boolean
  serviceRoleIssue: ServiceRoleKeyIssue | null
}> {
  const serviceRoleIssue = getServiceRoleKeyIssue()

  if (!hasAdminServerAccess()) {
    return { data: fallback, error: null, configured: false, serviceRoleIssue }
  }

  try {
    const data = await loader()
    return { data, error: null, configured: true, serviceRoleIssue: null }
  } catch (err) {
    return {
      data: fallback,
      error: err instanceof Error ? err.message : 'Failed to load admin data',
      configured: true,
      serviceRoleIssue: null,
    }
  }
}
