/** Designated platform Super Admin — sole holder of /admin and admin API access. */
export const SUPER_ADMIN_EMAIL = 'fxinvestprime@gmail.com'

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

/** Bootstrap env may list emails, but only the designated Super Admin is honored. */
export function getAuthorizedBootstrapEmails(): string[] {
  const raw = process.env.ADMIN_SUPER_EMAILS ?? SUPER_ADMIN_EMAIL
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email === SUPER_ADMIN_EMAIL.toLowerCase())
}

export type SuperAdminProtectionAction = 'deactivate' | 'demote' | 'delete'

/** Application-level guard when mutating admin_profiles (DB trigger is the primary safety net). */
export function assertSuperAdminProtected(
  targetEmail: string | null | undefined,
  action: SuperAdminProtectionAction
): void {
  if (isSuperAdminEmail(targetEmail)) {
    throw new Error(
      `Cannot ${action} the designated Super Admin (${SUPER_ADMIN_EMAIL}).`
    )
  }
}
