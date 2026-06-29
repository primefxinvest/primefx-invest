import type { AdminMutationResult } from '@/lib/admin/auth'

export function isAdminMutationFailure(
  result: AdminMutationResult | void | { success: boolean; error?: string }
): result is { success: false; error: string } {
  return Boolean(result && result.success === false && 'error' in result)
}
