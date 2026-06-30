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
    .in('status', ['pending_notice', 'ready'])
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
  const { error } = await db
    .from('withdrawal_requests')
    .update({
      status,
      processed_at: new Date().toISOString(),
      ...(extra ?? {}),
    })
    .eq('id', requestId)

  if (error) throw new Error(error.message)
}
