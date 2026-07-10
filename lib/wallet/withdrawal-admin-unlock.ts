export const ADMIN_HOLD_UNLOCKED_BY_KEY = 'admin_hold_unlocked_by'
export const ADMIN_HOLD_UNLOCKED_AT_KEY = 'admin_hold_unlocked_at'

export function isWithdrawalAdminUnlocked(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (!metadata) return false
  return typeof metadata[ADMIN_HOLD_UNLOCKED_BY_KEY] === 'string'
}

export function getWithdrawalAdminUnlockLabel(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  return isWithdrawalAdminUnlocked(metadata) ? 'Unlocked by Admin' : null
}
