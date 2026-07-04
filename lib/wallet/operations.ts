import 'server-only'

import { generatePaymentReference } from '@/lib/payments/reference'
import {
  assertSufficientBalance,
  creditInvestorWallet,
  debitInvestorWallet,
} from '@/lib/payments/wallet-ledger'
import { calculateP2pTransferFee, recordPlatformFee } from '@/lib/payments/fees'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'
import { notifyTransferCompleted } from '@/lib/notifications/service'

const MIN_TRANSFER = 5
const MAX_TRANSFER = 10_000

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for wallet operations.')
  }
  return db
}

async function createCompletedTransaction(input: {
  userId: string
  type: string
  amount: number
  description: string
  referenceId: string
}) {
  const db = getDb()
  const { error } = await db.from('transactions').insert({
    user_id: input.userId,
    type: input.type,
    amount: input.amount,
    status: 'Completed',
    description: input.description,
    reference_id: `${input.referenceId}-${input.type}`,
  })

  if (error) throw new Error(error.message)
}

export async function executeWalletTransfer(input: {
  senderId: string
  recipientId: string
  amountUsd: number
  message?: string
  recipientLabel: string
  senderLabel: string
}): Promise<{ success: true; referenceId: string } | { success: false; error: string }> {
  if (input.senderId === input.recipientId) {
    return { success: false, error: 'You cannot transfer funds to your own account.' }
  }

  const amount = input.amountUsd
  if (!Number.isFinite(amount) || amount < MIN_TRANSFER) {
    return { success: false, error: `Minimum transfer is $${MIN_TRANSFER.toFixed(2)}.` }
  }
  if (amount > MAX_TRANSFER) {
    return { success: false, error: `Maximum transfer per transaction is $${MAX_TRANSFER.toLocaleString()}.` }
  }

  const account = await requireActiveAccountForFinancialAction(input.senderId, 'transfer')
  if (!account.allowed) {
    return { success: false, error: account.error }
  }

  const { recipientAmount, fee, senderTotal } = calculateP2pTransferFee(amount)

  const kyc = await requireVerifiedKyc(input.senderId, 'transfer')
  if (!kyc.allowed) {
    return { success: false, error: kyc.error }
  }

  try {
    await assertSufficientBalance(input.senderId, senderTotal)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Insufficient available balance.',
    }
  }

  const referenceId = generatePaymentReference('transfer')
  const note = input.message?.trim()

  try {
    await debitInvestorWallet(input.senderId, senderTotal)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to debit wallet.',
    }
  }

  try {
    await creditInvestorWallet(input.recipientId, recipientAmount)
  } catch (err) {
    await creditInvestorWallet(input.senderId, senderTotal)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to credit recipient wallet.',
    }
  }

  try {
    await createCompletedTransaction({
      userId: input.senderId,
      type: 'transfer_sent',
      amount: senderTotal,
      description: note
        ? `Sent $${recipientAmount.toFixed(2)} to ${input.recipientLabel} (fee $${fee.toFixed(2)}) — ${note}`
        : `Sent $${recipientAmount.toFixed(2)} to ${input.recipientLabel} (fee $${fee.toFixed(2)})`,
      referenceId,
    })

    await createCompletedTransaction({
      userId: input.recipientId,
      type: 'transfer_received',
      amount: recipientAmount,
      description: note
        ? `Received $${recipientAmount.toFixed(2)} from ${input.senderLabel} — ${note}`
        : `Received $${recipientAmount.toFixed(2)} from ${input.senderLabel}`,
      referenceId,
    })

    await recordPlatformFee({
      userId: input.senderId,
      feeType: 'p2p_transfer',
      grossAmount: recipientAmount,
      feeAmount: fee,
      referenceId,
    })

    await notifyTransferCompleted(input.senderId, input.recipientId, recipientAmount, referenceId)
  } catch (err) {
    await creditInvestorWallet(input.senderId, amount)
    await debitInvestorWallet(input.recipientId, amount)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to record transfer.',
    }
  }

  return { success: true, referenceId }
}

export async function recordManualBankDeposit(input: {
  userId: string
  amountUsd: number
  note?: string
}) {
  const amount = input.amountUsd
  if (amount < INVESTOR_RULES.financial.minimumDeposit) {
    throw new Error(`Minimum deposit is $${INVESTOR_RULES.financial.minimumDeposit}.`)
  }
  if (amount > INVESTOR_RULES.financial.maximumSingleDeposit) {
    throw new Error(
      `Maximum single deposit is $${INVESTOR_RULES.financial.maximumSingleDeposit.toLocaleString()}.`
    )
  }

  const kyc = await requireVerifiedKyc(input.userId, 'deposit')
  if (!kyc.allowed) {
    throw new Error(kyc.error)
  }

  const referenceId = generatePaymentReference('deposit')
  const db = getDb()
  const { error } = await db.from('transactions').insert({
    user_id: input.userId,
    type: 'deposit',
    amount,
    status: 'Pending',
    description: input.note?.trim()
      ? `Bank transfer deposit — ${input.note.trim()}`
      : 'Bank transfer deposit — awaiting confirmation',
    reference_id: referenceId,
  })

  if (error) throw new Error(error.message)
  return { referenceId }
}

export async function recordManualWithdrawalRequest(input: {
  userId: string
  amountUsd: number
  methodLabel: string
  note?: string
}) {
  const { createWithdrawalRequest } = await import('@/lib/wallet/withdrawals')
  return createWithdrawalRequest({
    userId: input.userId,
    amountUsd: input.amountUsd,
    methodLabel: input.methodLabel,
    note: input.note,
  })
}
