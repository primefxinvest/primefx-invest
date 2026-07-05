'use server'

import { revalidatePath } from 'next/cache'
import { initiateDeposit, initiateWithdrawal } from '@/lib/payments/actions'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  executeWalletTransfer,
  recordManualBankDeposit,
  recordManualWithdrawalRequest,
} from '@/lib/wallet/operations'
import {
  lookupTransferRecipient,
} from '@/lib/wallet/transfer-lookup'
import { enforceUserRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'
import {
  assertTransactionAuthorized,
  type TransactionStepUpCredentials,
} from '@/lib/security/transaction-protection'
import type { TransferRecipientMethod } from '@/lib/wallet/types'
import { toTransferUserError } from '@/lib/wallet/transfer-errors'
import { notifyDepositCreated, notifyWithdrawalSubmitted } from '@/lib/notifications/service'

async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in.')
  }

  return user
}

function revalidateWalletPaths() {
  revalidatePath('/wallet')
  revalidatePath('/wallet/deposit')
  revalidatePath('/wallet/withdraw')
  revalidatePath('/wallet/transfer')
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}

export async function searchTransferRecipient(
  method: TransferRecipientMethod,
  query: string
) {
  await requireUser()
  const recipient = await lookupTransferRecipient(method, query)
  if (!recipient) return { found: false as const }
  return { found: true as const, recipient }
}

export async function submitWalletTransfer(
  input: {
    method: TransferRecipientMethod
    recipientQuery: string
    amountUsd: number
    message?: string
  } & TransactionStepUpCredentials
) {
  const user = await requireUser()

  try {
    await enforceUserRateLimit('transfer', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false as const, error: err.message }
    }
    throw err
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'transfer')
  if (!account.allowed) {
    return { success: false as const, error: account.error }
  }

  const auth = await assertTransactionAuthorized(user.id, 'transfer', {
    totpCode: input.totpCode,
    transactionPin: input.transactionPin,
  })
  if (!auth.allowed) {
    return { success: false as const, error: auth.error }
  }

  const recipient = await lookupTransferRecipient(input.method, input.recipientQuery)

  if (!recipient) {
    return { success: false as const, error: 'Recipient not found. Check the email or PrimeFx ID.' }
  }

  const supabase = await createServerSupabaseClient()
  const { data: senderProfile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const result = await executeWalletTransfer({
    senderId: user.id,
    recipientId: recipient.id,
    amountUsd: input.amountUsd,
    message: input.message,
    recipientLabel: recipient.fullName || recipient.email,
    senderLabel: senderProfile?.full_name || user.email || 'PrimeFx user',
  })

  if (result.success) {
    revalidateWalletPaths()
    return result
  }

  return { success: false as const, error: toTransferUserError(result.error) }
}

export async function submitBankDeposit(input: { amountUsd: number; note?: string }) {
  const user = await requireUser()

  try {
    await enforceUserRateLimit('deposit', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false as const, error: err.message }
    }
    throw err
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'deposit')
  if (!account.allowed) {
    return { success: false as const, error: account.error }
  }

  try {
    const { referenceId } = await recordManualBankDeposit({
      userId: user.id,
      amountUsd: input.amountUsd,
      note: input.note,
    })

    await notifyDepositCreated(user.id, input.amountUsd, referenceId)
    revalidateWalletPaths()

    return { success: true as const, referenceId }
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to submit bank deposit.',
    }
  }
}

export async function submitManualWithdrawal(
  input: {
    amountUsd: number
    methodLabel: string
    note?: string
  } & TransactionStepUpCredentials
) {
  const user = await requireUser()

  try {
    await enforceUserRateLimit('withdrawal', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false as const, error: err.message }
    }
    throw err
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'withdrawal')
  if (!account.allowed) {
    return { success: false as const, error: account.error }
  }

  const auth = await assertTransactionAuthorized(user.id, 'withdrawal', {
    totpCode: input.totpCode,
    transactionPin: input.transactionPin,
  })
  if (!auth.allowed) {
    return { success: false as const, error: auth.error }
  }

  try {
    const { referenceId } = await recordManualWithdrawalRequest({
      userId: user.id,
      amountUsd: input.amountUsd,
      methodLabel: input.methodLabel,
      note: input.note,
    })

    await notifyWithdrawalSubmitted(user.id, input.amountUsd, referenceId)
    revalidateWalletPaths()

    return { success: true as const, referenceId }
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to submit withdrawal.',
    }
  }
}

export { initiateDeposit, initiateWithdrawal }
