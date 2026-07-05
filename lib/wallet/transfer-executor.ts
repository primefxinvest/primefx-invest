import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { roundMoney } from '@/lib/fees/constants'

export function isMissingRpcError(message: string | undefined | null): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return (
    lower.includes('could not find the function') ||
    lower.includes('schema cache') ||
    lower.includes('pgrst202') ||
    (lower.includes('function') && lower.includes('does not exist')) ||
    (lower.includes('function') && lower.includes('not found'))
  )
}

export function isRecoverableTransferInfraError(message: string | undefined | null): boolean {
  if (!message) return false
  if (isMissingRpcError(message)) return true

  const lower = message.toLowerCase()
  return (
    lower.includes('permission denied for function') ||
    lower.includes('must be owner of function') ||
    lower.includes('42883')
  )
}

async function invokeWalletRpc(
  db: SupabaseClient,
  fn: 'atomic_debit_wallet' | 'atomic_credit_wallet',
  userId: string,
  amountUsd: number
) {
  const { error } = await db.rpc(fn, {
    p_user_id: userId,
    p_amount: amountUsd,
  })

  if (error) throw new Error(error.message)
}

async function createCompletedTransaction(
  db: SupabaseClient,
  input: {
    userId: string
    type: string
    amount: number
    description: string
    referenceId: string
  }
) {
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

async function recordPlatformFeeDirect(
  db: SupabaseClient,
  input: {
    userId: string
    grossAmount: number
    feeAmount: number
    referenceId: string
  }
) {
  const { error } = await db.from('platform_fee_ledger').insert({
    user_id: input.userId,
    fee_type: 'p2p_transfer',
    gross_amount: input.grossAmount,
    fee_amount: input.feeAmount,
    reference_id: input.referenceId,
  })

  if (error) {
    console.warn('[Transfer] platform_fee_ledger insert skipped:', error.message)
  }
}

/** Primary path — single DB transaction via RPC. */
export async function executeTransferViaRpc(
  db: SupabaseClient,
  input: {
    senderId: string
    recipientId: string
    recipientAmount: number
    fee: number
    referenceId: string
    senderDescription: string
    recipientDescription: string
  }
) {
  return db.rpc('execute_atomic_wallet_transfer', {
    p_sender_id: input.senderId,
    p_recipient_id: input.recipientId,
    p_recipient_amount: input.recipientAmount,
    p_fee_amount: input.fee,
    p_reference_id: input.referenceId,
    p_sender_description: input.senderDescription,
    p_recipient_description: input.recipientDescription,
  })
}

/** Fallback — separate atomic debit/credit RPCs + transaction rows. */
export async function executeTransferViaLegacyRpc(
  db: SupabaseClient,
  input: {
    senderId: string
    recipientId: string
    recipientAmount: number
    fee: number
    senderTotal: number
    referenceId: string
    senderDescription: string
    recipientDescription: string
  }
) {
  await invokeWalletRpc(db, 'atomic_debit_wallet', input.senderId, input.senderTotal)

  try {
    await invokeWalletRpc(db, 'atomic_credit_wallet', input.recipientId, input.recipientAmount)
  } catch (creditErr) {
    await invokeWalletRpc(db, 'atomic_credit_wallet', input.senderId, input.senderTotal)
    throw creditErr
  }

  try {
    await createCompletedTransaction(db, {
      userId: input.senderId,
      type: 'transfer_sent',
      amount: input.senderTotal,
      description: input.senderDescription,
      referenceId: input.referenceId,
    })

    await createCompletedTransaction(db, {
      userId: input.recipientId,
      type: 'transfer_received',
      amount: input.recipientAmount,
      description: input.recipientDescription,
      referenceId: input.referenceId,
    })

    await recordPlatformFeeDirect(db, {
      userId: input.senderId,
      grossAmount: input.recipientAmount,
      feeAmount: input.fee,
      referenceId: input.referenceId,
    })
  } catch (recordErr) {
    await invokeWalletRpc(db, 'atomic_debit_wallet', input.recipientId, input.recipientAmount)
    await invokeWalletRpc(db, 'atomic_credit_wallet', input.senderId, input.senderTotal)
    throw recordErr
  }
}

async function adjustBalanceOptimistic(
  db: SupabaseClient,
  userId: string,
  deltaAvailable: number,
  deltaTotal: number,
  minAvailable: number
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: wallet, error: readError } = await db
      .from('wallet_balances')
      .select('id, available_balance, total_balance')
      .eq('user_id', userId)
      .maybeSingle()

    if (readError || !wallet) {
      throw new Error(readError?.message ?? 'SENDER_WALLET_NOT_FOUND')
    }

    const lockedAvailable = String(wallet.available_balance ?? '0')
    const lockedTotal = String(wallet.total_balance ?? '0')
    const currentAvailable = Number(lockedAvailable)
    const currentTotal = Number(lockedTotal)

    if (currentAvailable + deltaAvailable < minAvailable) {
      throw new Error('INSUFFICIENT_BALANCE')
    }

    const nextAvailable = roundMoney(currentAvailable + deltaAvailable)
    const nextTotal = roundMoney(Math.max(0, currentTotal + deltaTotal))

    const { data: updated, error: updateError } = await db
      .from('wallet_balances')
      .update({
        available_balance: nextAvailable,
        total_balance: nextTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)
      .eq('available_balance', lockedAvailable)
      .select('user_id')
      .maybeSingle()

    if (!updateError && updated) {
      return
    }

    if (updateError && !updateError.message.includes('0 rows')) {
      throw new Error(updateError.message)
    }
  }

  throw new Error('CONCURRENT_UPDATE')
}

/** Last-resort fallback when RPC functions are not deployed yet. */
export async function executeTransferViaDirectUpdate(
  db: SupabaseClient,
  input: {
    senderId: string
    recipientId: string
    recipientAmount: number
    fee: number
    senderTotal: number
    referenceId: string
    senderDescription: string
    recipientDescription: string
  }
) {
  await adjustBalanceOptimistic(db, input.senderId, -input.senderTotal, -input.senderTotal, 0)

  try {
    await adjustBalanceOptimistic(
      db,
      input.recipientId,
      input.recipientAmount,
      input.recipientAmount,
      0
    )
  } catch (creditErr) {
    await adjustBalanceOptimistic(db, input.senderId, input.senderTotal, input.senderTotal, 0)
    throw creditErr
  }

  try {
    await createCompletedTransaction(db, {
      userId: input.senderId,
      type: 'transfer_sent',
      amount: input.senderTotal,
      description: input.senderDescription,
      referenceId: input.referenceId,
    })

    await createCompletedTransaction(db, {
      userId: input.recipientId,
      type: 'transfer_received',
      amount: input.recipientAmount,
      description: input.recipientDescription,
      referenceId: input.referenceId,
    })

    await recordPlatformFeeDirect(db, {
      userId: input.senderId,
      grossAmount: input.recipientAmount,
      feeAmount: input.fee,
      referenceId: input.referenceId,
    })
  } catch (recordErr) {
    await adjustBalanceOptimistic(db, input.recipientId, -input.recipientAmount, -input.recipientAmount, 0)
    await adjustBalanceOptimistic(db, input.senderId, input.senderTotal, input.senderTotal, 0)
    throw recordErr
  }
}
