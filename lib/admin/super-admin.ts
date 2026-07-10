import {
  isTransactionApprovalAdminEmail,
  TRANSACTION_APPROVAL_ADMIN_EMAIL,
} from './transaction-approval-auth'

/** Designated platform owner — Super Admin, ownership protection, financial approver. */
export const SUPER_ADMIN_EMAIL = TRANSACTION_APPROVAL_ADMIN_EMAIL

/** Full admin portal access without ownership or financial approval privileges. */
export const FULL_ADMIN_PORTAL_EMAIL = 'fxinvestprime@gmail.com'

export const PLATFORM_OWNER_ROLE_LABEL = 'Platform Owner'

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return isTransactionApprovalAdminEmail(email)
}

export function isFullAdminPortalEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === FULL_ADMIN_PORTAL_EMAIL.toLowerCase()
}

/** Admin portal access: platform owner or full portal admin. */
export function isAuthorizedAdminPortalEmail(email: string | null | undefined): boolean {
  return isSuperAdminEmail(email) || isFullAdminPortalEmail(email)
}

/** Bootstrap env may list emails; only designated portal admins are honored. */
export function getAuthorizedBootstrapEmails(): string[] {
  const raw =
    process.env.ADMIN_SUPER_EMAILS ??
    `${SUPER_ADMIN_EMAIL},${FULL_ADMIN_PORTAL_EMAIL}`
  const allowed = new Set([
    SUPER_ADMIN_EMAIL.toLowerCase(),
    FULL_ADMIN_PORTAL_EMAIL.toLowerCase(),
  ])

  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => allowed.has(email))
}

export type SuperAdminProtectionAction = 'deactivate' | 'demote' | 'delete'

/** Application-level guard when mutating admin_profiles (DB trigger is the primary safety net). */
export function assertSuperAdminProtected(
  targetEmail: string | null | undefined,
  action: SuperAdminProtectionAction
): void {
  if (isSuperAdminEmail(targetEmail)) {
    throw new Error(
      `Cannot ${action} the designated Platform Owner (${SUPER_ADMIN_EMAIL}).`
    )
  }
}
