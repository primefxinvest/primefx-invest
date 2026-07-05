import 'server-only'

import { generatePaymentReference } from '@/lib/payments/reference'
import { calculateP2pTransferFee } from '@/lib/payments/fees'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'
import { notifyTransferCompleted } from '@/lib/notifications/service'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import { toTransferUserError } from '@/lib/wallet/transfer-errors'

const MIN_TRANSFER = 5
const MAX_TRANSFER = 10_000

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for wallet operations.')
  }
  return db
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

  const referenceId = generatePaymentReference('transfer')
  const note = input.message?.trim()

  const senderDescription = note
    ? `Sent $${recipientAmount.toFixed(2)} to ${input.recipientLabel} (fee $${fee.toFixed(2)}) — ${note}`
    : `Sent $${recipientAmount.toFixed(2)} to ${input.recipientLabel} (fee $${fee.toFixed(2)})`

  const recipientDescription = note
    ? `Received $${recipientAmount.toFixed(2)} from ${input.senderLabel} — ${note}`
    : `Received $${recipientAmount.toFixed(2)} from ${input.senderLabel}`

  const db = getDb()

  const { data, error } = await db.rpc('execute_atomic_wallet_transfer', {
    p_sender_id: input.senderId,
    p_recipient_id: input.recipientId,
    p_recipient_amount: recipientAmount,
    p_fee_amount: fee,
    p_reference_id: referenceId,
    p_sender_description: senderDescription,
    p_recipient_description: recipientDescription,
  })

  if (error) {
    console.error('[Transfer] execute_atomic_wallet_transfer failed:', error.message)
    return { success: false, error: toTransferUserError(error.message) }
  }

  if (!data) {
    console.error('[Transfer] execute_atomic_wallet_transfer returned no data')
    return { success: false, error: toTransferUserError(null) }
  }

  try {
    await logFinancialAudit({
      eventType: 'wallet.debit',
      userId: input.senderId,
      referenceId,
      amountUsd: senderTotal,
      metadata: { type: 'p2p_transfer', recipientId: input.recipientId },
    })
    await logFinancialAudit({
      eventType: 'wallet.credit',
      userId: input.recipientId,
      referenceId,
      amountUsd: recipientAmount,
      metadata: { type: 'p2p_transfer', senderId: input.senderId },
    })
    await notifyTransferCompleted(input.senderId, input.recipientId, recipientAmount, referenceId)
  } catch (notifyErr) {
    console.error('[Transfer] Post-transfer notify/audit failed (transfer succeeded):', notifyErr)
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
