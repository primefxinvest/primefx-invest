'use server'

import { revalidatePath } from 'next/cache'
import { requireServerMfaEnabled } from '@/lib/auth/mfa-server'
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
import type { TransferRecipientMethod } from '@/lib/wallet/types'
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

export async function submitWalletTransfer(input: {
  method: TransferRecipientMethod
  recipientQuery: string
  amountUsd: number
  message?: string
}) {
  const user = await requireUser()
  const recipient = await lookupTransferRecipient(input.method, input.recipientQuery)

  if (!recipient) {
    return { success: false as const, error: 'Recipient not found. Check the email, username, or PrimeFx ID.' }
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
  }

  return result
}

export async function submitBankDeposit(input: { amountUsd: number; note?: string }) {
  const user = await requireUser()

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

export async function submitManualWithdrawal(input: {
  amountUsd: number
  methodLabel: string
  note?: string
}) {
  const user = await requireUser()

  const mfa = await requireServerMfaEnabled(user.id)
  if (!mfa.allowed) {
    return { success: false as const, error: mfa.error }
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
