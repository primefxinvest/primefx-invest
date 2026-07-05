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
import {
  executeTransferViaDirectUpdate,
  executeTransferViaLegacyRpc,
  executeTransferViaRpc,
  isRecoverableTransferInfraError,
} from '@/lib/wallet/transfer-executor'

const MIN_TRANSFER = 5
const MAX_TRANSFER = 10_000

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for wallet operations.')
  }
  return db
}

async function postTransferSideEffects(input: {
  senderId: string
  recipientId: string
  referenceId: string
  senderTotal: number
  recipientAmount: number
}) {
  try {
    await logFinancialAudit({
      eventType: 'wallet.debit',
      userId: input.senderId,
      referenceId: input.referenceId,
      amountUsd: input.senderTotal,
      metadata: { type: 'p2p_transfer', recipientId: input.recipientId },
    })
    await logFinancialAudit({
      eventType: 'wallet.credit',
      userId: input.recipientId,
      referenceId: input.referenceId,
      amountUsd: input.recipientAmount,
      metadata: { type: 'p2p_transfer', senderId: input.senderId },
    })
    await notifyTransferCompleted(
      input.senderId,
      input.recipientId,
      input.recipientAmount,
      input.referenceId
    )
  } catch (notifyErr) {
    console.error('[Transfer] Post-transfer notify/audit failed (transfer succeeded):', notifyErr)
  }
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

  let db
  try {
    db = getDb()
  } catch (err) {
    console.error('[Transfer] Admin Supabase client unavailable:', err)
    return { success: false, error: toTransferUserError('SUPABASE_SERVICE_ROLE_KEY missing') }
  }

  const payload = {
    senderId: input.senderId,
    recipientId: input.recipientId,
    recipientAmount,
    fee,
    senderTotal,
    referenceId,
    senderDescription,
    recipientDescription,
  }

  console.log('[Transfer] Starting transfer', {
    referenceId,
    senderId: input.senderId,
    recipientId: input.recipientId,
    recipientAmount,
    fee,
    senderTotal,
  })

  const { data, error } = await executeTransferViaRpc(db, payload)

  if (!error && data) {
    console.log('[Transfer] Completed via execute_atomic_wallet_transfer', referenceId)
    await postTransferSideEffects({
      senderId: input.senderId,
      recipientId: input.recipientId,
      referenceId,
      senderTotal,
      recipientAmount,
    })
    return { success: true, referenceId }
  }

  if (error && !isRecoverableTransferInfraError(error.message)) {
    console.error('[Transfer] execute_atomic_wallet_transfer failed:', error.message)
    return { success: false, error: toTransferUserError(error.message) }
  }

  console.warn('[Transfer] Atomic RPC unavailable, trying legacy debit/credit RPCs')

  try {
    await executeTransferViaLegacyRpc(db, payload)
    console.log('[Transfer] Completed via legacy atomic debit/credit RPCs', referenceId)
    await postTransferSideEffects({
      senderId: input.senderId,
      recipientId: input.recipientId,
      referenceId,
      senderTotal,
      recipientAmount,
    })
    return { success: true, referenceId }
  } catch (legacyErr) {
    const legacyMessage = legacyErr instanceof Error ? legacyErr.message : String(legacyErr)
    console.warn('[Transfer] Legacy RPC path failed:', legacyMessage)

    if (!isRecoverableTransferInfraError(legacyMessage)) {
      return { success: false, error: toTransferUserError(legacyMessage) }
    }
  }

  console.warn('[Transfer] Using direct wallet update fallback (apply migration 032 for full atomicity)')

  try {
    await executeTransferViaDirectUpdate(db, payload)
    console.log('[Transfer] Completed via direct wallet update fallback', referenceId)
    await postTransferSideEffects({
      senderId: input.senderId,
      recipientId: input.recipientId,
      referenceId,
      senderTotal,
      recipientAmount,
    })
    return { success: true, referenceId }
  } catch (directErr) {
    const directMessage = directErr instanceof Error ? directErr.message : String(directErr)
    console.error('[Transfer] Direct update fallback failed:', directMessage)
    return { success: false, error: toTransferUserError(directMessage) }
  }
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
