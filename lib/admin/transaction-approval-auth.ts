/** Sole authorized email for approving or rejecting financial transactions. */
export const TRANSACTION_APPROVAL_ADMIN_EMAIL = 'infojimvio@gmail.com'

/** Display label for the Finance Admin portal account (effective tier-1 module access). */
export const FINANCE_ADMIN_ROLE_LABEL = 'Finance Admin'

export const TRANSACTION_APPROVAL_FORBIDDEN_MESSAGE =
  'You do not have permission to approve or reject transactions.'

export function isTransactionApprovalAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === TRANSACTION_APPROVAL_ADMIN_EMAIL.toLowerCase()
}

export function canApproveOrRejectTransactions(email: string | null | undefined): boolean {
  return isTransactionApprovalAdminEmail(email)
}

export class TransactionApprovalForbiddenError extends Error {
  readonly statusCode = 403

  constructor(message = TRANSACTION_APPROVAL_FORBIDDEN_MESSAGE) {
    super(message)
    this.name = 'TransactionApprovalForbiddenError'
  }
}

export function assertTransactionApprovalAccess(email: string | null | undefined): void {
  if (!canApproveOrRejectTransactions(email)) {
    throw new TransactionApprovalForbiddenError()
  }
}
