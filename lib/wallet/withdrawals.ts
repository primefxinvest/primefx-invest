import 'server-only'

import { generatePaymentReference } from '@/lib/payments/reference'
import {
  calculateWithdrawalFee,
  getWithdrawalAvailableDate,
  recordPlatformFee,
} from '@/lib/payments/fees'
import { holdWalletFunds, restoreWalletHold } from '@/lib/payments/wallet-ledger'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { isMissingDbFunctionError } from '@/lib/db/missing-rpc'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal operations.')
  }
  return db
}

export async function createWithdrawalRequest(input: {
  userId: string
  amountUsd: number
  methodLabel: string
  provider?: string | null
  currency?: string | null
  payoutAddress?: string | null
  note?: string
  metadata?: Record<string, unknown>
}) {
  const amount = input.amountUsd
  if (amount < INVESTOR_RULES.financial.minimumWithdrawal) {
    throw new Error(`Minimum withdrawal is $${INVESTOR_RULES.financial.minimumWithdrawal}.`)
  }

  const kyc = await requireVerifiedKyc(input.userId, 'withdrawal')
  if (!kyc.allowed) {
    throw new Error(kyc.error)
  }

  const { grossAmount, fee, netAmount } = calculateWithdrawalFee(amount)
  const referenceId = generatePaymentReference('withdrawal')
  const requestedAt = new Date()
  const availableAt = getWithdrawalAvailableDate(requestedAt)

  await holdWalletFunds(input.userId, grossAmount)

  const db = getDb()

  try {
    const { data: request, error: requestError } = await db
      .from('withdrawal_requests')
      .insert({
        user_id: input.userId,
        amount_usd: grossAmount,
        fee_usd: fee,
        net_amount_usd: netAmount,
        method_label: input.methodLabel,
        provider: input.provider ?? null,
        currency: input.currency ?? null,
        payout_address: input.payoutAddress ?? null,
        status: 'pending_notice',
        requested_at: requestedAt.toISOString(),
        available_at: availableAt.toISOString(),
        reference_id: referenceId,
        metadata: {
          note: input.note?.trim() ?? null,
          ...(input.metadata ?? {}),
        },
      })
      .select('id')
      .single()

    if (requestError || !request) {
      throw new Error(requestError?.message ?? 'Failed to create withdrawal request.')
    }

    const { error: txError } = await db.from('transactions').insert({
      user_id: input.userId,
      type: 'withdrawal',
      amount: grossAmount,
      status: 'Pending',
      description: `${input.methodLabel} withdrawal scheduled — available ${availableAt.toLocaleDateString('en-US')}. Net $${netAmount.toFixed(2)} after 5% fee.`,
      reference_id: referenceId,
    })

    if (txError) throw new Error(txError.message)

    await recordPlatformFee({
      userId: input.userId,
      feeType: 'withdrawal',
      grossAmount,
      feeAmount: fee,
      referenceId,
    })

    return {
      referenceId,
      requestId: request.id as string,
      availableAt: availableAt.toISOString(),
      fee,
      netAmount,
    }
  } catch (err) {
    await restoreWalletHold(input.userId, grossAmount)
    throw err
  }
}

export async function listDueWithdrawalRequests(limit = 50) {
  const db = getDb()
  const now = new Date().toISOString()

  const { data, error } = await db
    .from('withdrawal_requests')
    .select('*')
    .eq('status', 'pending_notice')
    .lte('available_at', now)
    .order('available_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function markWithdrawalRequestStatus(
  requestId: string,
  status: string,
  extra?: Record<string, unknown>
) {
  const db = getDb()
  const patch: Record<string, unknown> = {
    status,
    ...(extra ?? {}),
  }

  if (['completed', 'failed', 'cancelled'].includes(status)) {
    patch.processed_at = new Date().toISOString()
  }

  const { error } = await db.from('withdrawal_requests').update(patch).eq('id', requestId)

  if (error) throw new Error(error.message)
}

/** Atomically claim a due withdrawal request for processing. */
export async function claimWithdrawalForProcessing(
  requestId: string,
  targetStatus: string
) {
  const db = getDb()
  const { data, error } = await db.rpc('claim_withdrawal_request', {
    p_request_id: requestId,
    p_target_status: targetStatus,
  })

  if (error) {
    if (isMissingDbFunctionError(error.message)) {
      const now = new Date().toISOString()
      const { data: fallback, error: fallbackError } = await db
        .from('withdrawal_requests')
        .update({ status: targetStatus })
        .eq('id', requestId)
        .eq('status', 'pending_notice')
        .lte('available_at', now)
        .select('*')
        .maybeSingle()

      if (fallbackError) throw new Error(fallbackError.message)
      return fallback as Record<string, unknown> | null
    }
    throw new Error(error.message)
  }
  return data as Record<string, unknown> | null
}

export async function fetchUserWithdrawalRequests(userId: string, limit = 50) {
  const db = getDb()
  const { data, error } = await db
    .from('withdrawal_requests')
    .select(
      'id, amount_usd, fee_usd, net_amount_usd, method_label, status, requested_at, available_at, reference_id, processed_at'
    )
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getWithdrawalRequestById(requestId: string) {
  const db = getDb()
  const { data, error } = await db
    .from('withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
