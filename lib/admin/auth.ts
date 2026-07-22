import 'server-only'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { ADMIN_TIER_LABELS } from './permissions'
import type { AdminContext, AdminModule, AdminProfile } from './types'
import { canAccessModule } from './permissions'
import {
  getAuthorizedBootstrapEmails,
  isAuthorizedAdminPortalEmail,
  isFullAdminPortalEmail,
  PLATFORM_OWNER_ROLE_LABEL,
} from './super-admin'
import {
  assertTransactionApprovalAccess,
  assertDepositApprovalAccess,
  assertWithdrawalApprovalAccess,
  isTransactionApprovalAdminEmail,
} from './transaction-approval-auth'

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isAuthorizedAdminPortalEmail(user.email)) {
    return null
  }

  const adminDb = createAdminSupabaseClient()
  let profile: AdminProfile | null = null

  if (adminDb) {
    const { data } = await adminDb
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    profile = data as AdminProfile | null
  } else {
    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    profile = data as AdminProfile | null
  }

  if (profile) {
    if (isTransactionApprovalAdminEmail(user.email)) {
      return {
        userId: user.id,
        email: user.email,
        tier: 1,
        roleLabel: PLATFORM_OWNER_ROLE_LABEL,
        isBootstrap: false,
      }
    }

    if (isFullAdminPortalEmail(user.email)) {
      return {
        userId: user.id,
        email: user.email,
        tier: 1,
        roleLabel: 'Super Admin',
        isBootstrap: false,
      }
    }

    return {
      userId: user.id,
      email: user.email,
      tier: 1,
      roleLabel: profile.role_label || ADMIN_TIER_LABELS[1],
      isBootstrap: false,
    }
  }

  if (isTransactionApprovalAdminEmail(user.email)) {
    return {
      userId: user.id,
      email: user.email,
      tier: 1,
      roleLabel: PLATFORM_OWNER_ROLE_LABEL,
      isBootstrap: true,
    }
  }

  if (isFullAdminPortalEmail(user.email)) {
    return {
      userId: user.id,
      email: user.email,
      tier: 1,
      roleLabel: 'Super Admin',
      isBootstrap: true,
    }
  }

  const bootstrapEmails = getAuthorizedBootstrapEmails()
  if (bootstrapEmails.length > 0 && bootstrapEmails.includes(user.email.toLowerCase())) {
    const isOwner = isTransactionApprovalAdminEmail(user.email)
    return {
      userId: user.id,
      email: user.email,
      tier: 1,
      roleLabel: isOwner ? PLATFORM_OWNER_ROLE_LABEL : 'Super Admin',
      isBootstrap: true,
    }
  }

  return null
}

export {
  SUPER_ADMIN_EMAIL,
  FULL_ADMIN_PORTAL_EMAIL,
  PLATFORM_OWNER_ROLE_LABEL,
  isAuthorizedAdminPortalEmail,
  isFullAdminPortalEmail,
  isSuperAdminEmail,
} from './super-admin'
export {
  canApproveOrRejectTransactions,
  canApproveDeposits,
  canApproveWithdrawals,
  canApproveNonDepositTransactions,
  assertTransactionApprovalAccess,
  assertDepositApprovalAccess,
  assertWithdrawalApprovalAccess,
  assertTransactionTypeApprovalAccess,
  isDepositTransactionType,
  isWithdrawalTransactionType,
  isPlatformOwnerEmail,
  TRANSACTION_APPROVAL_ADMIN_EMAIL,
  PLATFORM_OWNER_EMAIL,
  TRANSACTION_APPROVAL_FORBIDDEN_MESSAGE,
  DEPOSIT_APPROVAL_FORBIDDEN_MESSAGE,
  WITHDRAWAL_APPROVAL_FORBIDDEN_MESSAGE,
  FINANCE_ADMIN_ROLE_LABEL,
  TransactionApprovalForbiddenError,
  DepositApprovalForbiddenError,
  WithdrawalApprovalForbiddenError,
} from './transaction-approval-auth'

export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminContext()
  if (!context) {
    redirect('/admin/unauthorized')
  }
  return context
}

export async function requireAdminModule(module: AdminModule): Promise<AdminContext> {
  const context = await requireAdmin()
  if (!canAccessModule(context.tier, module)) {
    redirect('/admin/unauthorized')
  }
  return context
}

export function assertModuleAccess(context: AdminContext, module: AdminModule) {
  if (!canAccessModule(context.tier, module)) {
    throw new Error('You do not have permission to perform this action.')
  }
}

export type AdminMutationResult =
  | { success: true }
  | { success: false; error: string }

export function getSelfTargetError(
  context: AdminContext,
  targetUserId: string
): string | undefined {
  if (context.userId === targetUserId) {
    return 'Admin actions on your own account are prohibited.'
  }
}

export function rejectSelfTarget(
  context: AdminContext,
  targetUserId: string
): AdminMutationResult | null {
  const error = getSelfTargetError(context, targetUserId)
  return error ? { success: false, error } : null
}

/** @deprecated Prefer rejectSelfTarget for server actions that return AdminMutationResult */
export function assertNotSelfTarget(context: AdminContext, targetUserId: string) {
  const error = getSelfTargetError(context, targetUserId)
  if (error) {
    throw new Error(error)
  }
}

export function assertTransactionApprovalPermission(context: AdminContext): void {
  assertTransactionApprovalAccess(context.email)
}

export function assertDepositApprovalPermission(context: AdminContext): void {
  assertDepositApprovalAccess(context.email)
}

export function assertWithdrawalApprovalPermission(context: AdminContext): void {
  assertWithdrawalApprovalAccess(context.email)
}
