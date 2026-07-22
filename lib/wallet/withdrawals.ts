import 'server-only'

import { generatePaymentReference } from '@/lib/payments/reference'
import {
  calculateWithdrawalFee,
  recordPlatformFee,
} from '@/lib/payments/fees'
import { holdWalletFunds, restoreWalletHold } from '@/lib/payments/wallet-ledger'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { isMissingDbFunctionError } from '@/lib/db/missing-rpc'
import { formatRiskScoreLabel } from '@/lib/admin/withdrawal-risk'
import { getDisplayNetworkFeeUsd } from '@/lib/fees/display'
import { roundMoney } from '@/lib/fees/constants'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal operations.')
  }
  return db
}

function parseCoinNetwork(currency: string | null | undefined, networkId?: string | null) {
  const raw = String(currency ?? '').toUpperCase()
  if (networkId) {
    const coin = raw.includes('_') ? raw.split('_')[0] : raw || null
    return { coin, network: networkId.toUpperCase() }
  }
  if (raw.includes('_')) {
    const [coin, network] = raw.split('_')
    return { coin: coin || null, network: network || null }
  }
  return { coin: raw || null, network: null }
}

export async function createWithdrawalRequest(input: {
  userId: string
  amountUsd: number
  methodLabel: string
  provider?: string | null
  currency?: string | null
  payoutAddress?: string | null
  coin?: string | null
  network?: string | null
  walletLabel?: string | null
  note?: string
  metadata?: Record<string, unknown>
  riskScore?: number
}) {
  const amount = input.amountUsd
  if (!(amount > 0) || !Number.isFinite(amount)) {
    throw new Error('Enter a valid withdrawal amount.')
  }
  if (amount < INVESTOR_RULES.financial.minimumWithdrawal) {
    throw new Error(`Minimum withdrawal is $${INVESTOR_RULES.financial.minimumWithdrawal}.`)
  }

  const address = input.payoutAddress?.trim() ?? ''
  if (!address) {
    throw new Error('Wallet address is required.')
  }

  const { coin, network } = parseCoinNetwork(input.currency, input.network)
  const resolvedCoin = (input.coin ?? coin)?.toUpperCase() ?? null
  const resolvedNetwork = (input.network ?? network)?.toUpperCase() ?? null

  if (!resolvedCoin) {
    throw new Error('Cryptocurrency is required.')
  }
  if (!resolvedNetwork) {
    throw new Error('Network is required.')
  }

  const kyc = await requireVerifiedKyc(input.userId, 'withdrawal')
  if (!kyc.allowed) {
    throw new Error(kyc.error)
  }

  const platformFee = calculateWithdrawalFee(amount).fee
  const networkFee = getDisplayNetworkFeeUsd(resolvedNetwork)
  const fee = roundMoney(platformFee + networkFee)
  const netAmount = roundMoney(Math.max(0, amount - fee))
  const grossAmount = roundMoney(amount)

  const referenceId = generatePaymentReference('withdrawal')
  const requestedAt = new Date()
  // Immediate admin review queue (Binance/Bybit style). available_at = now.
  const availableAt = requestedAt
  const riskScore = input.riskScore ?? 0
  const riskLevel = formatRiskScoreLabel(riskScore)

  const db = getDb()

  // Prevent duplicate in-flight submits for the same user/amount/address within 30s.
  const duplicateWindow = new Date(Date.now() - 30_000).toISOString()
  const { data: recentDup } = await db
    .from('withdrawal_requests')
    .select('id, reference_id')
    .eq('user_id', input.userId)
    .eq('amount_usd', grossAmount)
    .eq('payout_address', address)
    .gte('requested_at', duplicateWindow)
    .in('status', ['pending', 'pending_notice', 'ready', 'approved', 'processing'])
    .limit(1)
    .maybeSingle()

  if (recentDup) {
    return {
      referenceId: String(recentDup.reference_id),
      requestId: String(recentDup.id),
      availableAt: availableAt.toISOString(),
      fee,
      netAmount,
      status: 'pending' as const,
      coin: resolvedCoin,
      network: resolvedNetwork,
      walletAddress: address,
      duplicate: true as const,
    }
  }

  await holdWalletFunds(input.userId, grossAmount)

  try {
    const insertPayload: Record<string, unknown> = {
      user_id: input.userId,
      amount_usd: grossAmount,
      fee_usd: fee,
      net_amount_usd: netAmount,
      method_label: input.methodLabel,
      provider: input.provider ?? 'manual',
      currency: input.currency ?? resolvedCoin,
      payout_address: address,
      status: 'pending',
      requested_at: requestedAt.toISOString(),
      available_at: availableAt.toISOString(),
      reference_id: referenceId,
      metadata: {
        note: input.note?.trim() ?? null,
        coin: resolvedCoin,
        network: resolvedNetwork,
        wallet_label: input.walletLabel?.trim() ?? null,
        wallet_address: address,
        platform_fee_usd: platformFee,
        network_fee_usd: networkFee,
        risk_score: riskScore,
        risk_level: riskLevel,
        ...(input.metadata ?? {}),
      },
    }

    // Prefer dedicated columns when migration 047 is applied; ignore unknown-column errors.
    insertPayload.coin = resolvedCoin
    insertPayload.network = resolvedNetwork
    insertPayload.wallet_address = address
    insertPayload.wallet_label = input.walletLabel?.trim() || null
    insertPayload.risk_level = riskLevel

    let request: { id: string } | null = null
    let requestError: { message: string } | null = null

    {
      const result = await db.from('withdrawal_requests').insert(insertPayload).select('id').single()
      request = result.data as { id: string } | null
      requestError = result.error

      // Retry without extended columns if schema not migrated yet.
      if (
        requestError &&
        /column .* does not exist|Could not find the/i.test(requestError.message)
      ) {
        const {
          coin: _c,
          network: _n,
          wallet_address: _w,
          wallet_label: _l,
          risk_level: _r,
          ...legacyPayload
        } = insertPayload
        const retry = await db.from('withdrawal_requests').insert(legacyPayload).select('id').single()
        request = retry.data as { id: string } | null
        requestError = retry.error
      }
    }

    if (requestError || !request) {
      throw new Error(requestError?.message ?? 'Failed to create withdrawal request.')
    }

    const { error: txError } = await db.from('transactions').insert({
      user_id: input.userId,
      type: 'withdrawal',
      amount: grossAmount,
      status: 'Pending',
      description: `${resolvedCoin} (${resolvedNetwork}) withdrawal pending review. Net $${netAmount.toFixed(2)} after fees.`,
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
      status: 'pending' as const,
      coin: resolvedCoin,
      network: resolvedNetwork,
      walletAddress: address,
      duplicate: false as const,
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
  if (status === 'approved') {
    patch.approved_at = new Date().toISOString()
  }
  if (status === 'completed') {
    patch.completed_at = new Date().toISOString()
  }
  if (['cancelled', 'failed'].includes(status)) {
    patch.rejected_at = new Date().toISOString()
  }

  const { error } = await db.from('withdrawal_requests').update(patch).eq('id', requestId)

  if (error) {
    // Drop unknown columns and retry for pre-migration schemas.
    if (/column .* does not exist/i.test(error.message)) {
      const {
        approved_at: _a,
        completed_at: _c,
        rejected_at: _r,
        processed_by: _p,
        tx_hash: _t,
        notes: _n,
        ...safePatch
      } = patch
      const retry = await db.from('withdrawal_requests').update(safePatch).eq('id', requestId)
      if (retry.error) throw new Error(retry.error.message)
      return
    }
    throw new Error(error.message)
  }
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

export async function claimWithdrawalStatusTransition(input: {
  requestId: string
  fromStatuses: string[]
  toStatus: string
  extra?: Record<string, unknown>
}) {
  const db = getDb()
  const { data, error } = await db.rpc('claim_withdrawal_status_transition', {
    p_request_id: input.requestId,
    p_from_statuses: input.fromStatuses,
    p_to_status: input.toStatus,
    p_extra: input.extra ?? {},
  })

  if (!error) {
    return data as Record<string, unknown> | null
  }

  if (!isMissingDbFunctionError(error.message)) {
    throw new Error(error.message)
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
    ...(input.extra ?? {}),
  }
  if (input.toStatus === 'approved') patch.approved_at = new Date().toISOString()
  if (input.toStatus === 'completed') {
    patch.completed_at = new Date().toISOString()
    patch.processed_at = new Date().toISOString()
  }
  if (['cancelled', 'failed'].includes(input.toStatus)) {
    patch.rejected_at = new Date().toISOString()
    patch.processed_at = new Date().toISOString()
  }

  const { data: fallback, error: fallbackError } = await db
    .from('withdrawal_requests')
    .update(patch)
    .eq('id', input.requestId)
    .in('status', input.fromStatuses)
    .select('*')
    .maybeSingle()
  if (fallbackError && /column .* does not exist/i.test(fallbackError.message)) {
    const {
      approved_at: _a,
      completed_at: _c,
      rejected_at: _r,
      processed_by: _p,
      tx_hash: _t,
      notes: _n,
      ...safePatch
    } = patch
    const retry = await db
      .from('withdrawal_requests')
      .update(safePatch)
      .eq('id', input.requestId)
      .in('status', input.fromStatuses)
      .select('*')
      .maybeSingle()
    if (retry.error) throw new Error(retry.error.message)
    return retry.data as Record<string, unknown> | null
  }

  if (fallbackError) throw new Error(fallbackError.message)
  return fallback as Record<string, unknown> | null
}

export async function fetchUserWithdrawalRequests(userId: string, limit = 50) {
  const db = getDb()
  const { data, error } = await db
    .from('withdrawal_requests')
    .select(
      'id, amount_usd, fee_usd, net_amount_usd, method_label, status, requested_at, available_at, reference_id, processed_at, currency, payout_address, metadata, coin, network, wallet_address, wallet_label'
    )
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (/column .* does not exist/i.test(error.message)) {
      const retry = await db
        .from('withdrawal_requests')
        .select(
          'id, amount_usd, fee_usd, net_amount_usd, method_label, status, requested_at, available_at, reference_id, processed_at, currency, payout_address, metadata'
        )
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })
        .limit(limit)
      if (retry.error) throw new Error(retry.error.message)
      return retry.data ?? []
    }
    throw new Error(error.message)
  }
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

export async function getWithdrawalRequestByReference(referenceId: string, userId?: string) {
  const db = getDb()
  let query = db
    .from('withdrawal_requests')
    .select('*')
    .eq('reference_id', referenceId)

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  return data
}
