'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { fetchPaymentProviderOptionsServer } from '@/lib/payments/options-server'
import { syncUserPendingDeposits } from '@/lib/payments/deposit-sync'
import { createDepositPayment, createWithdrawalPayment } from '@/lib/payments/service'
import { getPaymentByOrderId } from '@/lib/payments/wallet-ledger'
import { enforceUserRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { requireVerifiedEmail, EMAIL_NOT_VERIFIED_CODE } from '@/lib/auth/require-verified-email'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'
import {
  assertTransactionAuthorized,
  type TransactionStepUpCredentials,
} from '@/lib/security/transaction-protection'
import type { CreateDepositResult, CreateWithdrawalResult, PaymentProviderId } from '@/lib/payments/types'

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

export async function getPaymentProviderOptions() {
  return fetchPaymentProviderOptionsServer()
}

export async function initiateDeposit(input: {
  amountUsd: number
  currency: string
  provider?: PaymentProviderId
}): Promise<CreateDepositResult> {
  const user = await requireUser()

  try {
    await enforceUserRateLimit('deposit', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false, error: err.message }
    }
    throw err
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'deposit')
  if (!account.allowed) {
    return { success: false, error: account.error }
  }

  const kyc = await requireVerifiedKyc(user.id, 'deposit')
  if (!kyc.allowed) {
    return { success: false, error: kyc.error }
  }

  const result = await createDepositPayment({
    userId: user.id,
    amountUsd: input.amountUsd,
    currency: input.currency,
    customerEmail: user.email ?? undefined,
    provider: input.provider,
  })

  if (result.success) {
    revalidatePath('/wallet')
    revalidatePath('/wallet/deposit')
    revalidatePath('/wallet/withdraw')
    revalidatePath('/wallet/transfer')
    revalidatePath('/transactions')
  }

  return result
}

export async function initiateWithdrawal(
  input: {
    amountUsd: number
    currency: string
    address: string
  } & TransactionStepUpCredentials
): Promise<CreateWithdrawalResult> {
  const user = await requireUser()

  try {
    await enforceUserRateLimit('withdrawal', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false, error: err.message }
    }
    throw err
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'withdrawal')
  if (!account.allowed) {
    return { success: false, error: account.error }
  }

  const emailVerification = requireVerifiedEmail(user)
  if (!emailVerification.allowed) {
    return { success: false, error: emailVerification.error, code: EMAIL_NOT_VERIFIED_CODE }
  }

  const auth = await assertTransactionAuthorized(user.id, 'withdrawal', {
    totpCode: input.totpCode,
    transactionPin: input.transactionPin,
  })
  if (!auth.allowed) {
    return { success: false, error: auth.error }
  }

  const kyc = await requireVerifiedKyc(user.id, 'withdrawal')
  if (!kyc.allowed) {
    return { success: false, error: kyc.error }
  }

  const result = await createWithdrawalPayment({
    userId: user.id,
    amountUsd: input.amountUsd,
    currency: input.currency,
    address: input.address.trim(),
  })

  if (result.success) {
    revalidatePath('/wallet')
    revalidatePath('/wallet/deposit')
    revalidatePath('/wallet/withdraw')
    revalidatePath('/wallet/transfer')
    revalidatePath('/transactions')
  }

  return result
}

export async function syncPendingDeposits() {
  const user = await requireUser()
  const result = await syncUserPendingDeposits(user.id)

  if (result.completed > 0) {
    revalidatePath('/wallet')
    revalidatePath('/wallet/deposit')
    revalidatePath('/wallet/deposit/success')
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
  } else if (result.stillPending > 0) {
    revalidatePath('/transactions')
  }

  return result
}

export async function syncDepositOrder(orderId: string) {
  const user = await requireUser()
  const trimmed = orderId?.trim()
  if (!trimmed) {
    return { success: false as const, error: 'Missing order reference.' }
  }

  const payment = await getPaymentByOrderId(trimmed)
  if (payment && String(payment.investor_id) !== user.id) {
    return { success: false as const, error: 'Payment does not belong to this user.' }
  }

  if (payment?.status === 'completed') {
    revalidatePath('/wallet')
    revalidatePath('/wallet/deposit')
    revalidatePath('/wallet/deposit/success')
    revalidatePath('/dashboard')
    revalidatePath('/transactions')

    return {
      success: true as const,
      orderId: trimmed,
      status: 'completed' as const,
      amountUsd: Number(payment.amount_usd ?? 0),
      paymentStatus: String(payment.status ?? ''),
    }
  }

  const { syncDepositByOrderId } = await import('@/lib/payments/deposit-sync')
  const result = await syncDepositByOrderId(trimmed, user.id)
  const refreshedPayment = payment ?? (await getPaymentByOrderId(trimmed))

  if (result.status === 'completed') {
    revalidatePath('/wallet')
    revalidatePath('/wallet/deposit')
    revalidatePath('/wallet/deposit/success')
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
  }

  return {
    success: true as const,
    ...result,
    amountUsd: refreshedPayment ? Number(refreshedPayment.amount_usd ?? 0) : 0,
    paymentStatus: refreshedPayment ? String(refreshedPayment.status ?? '') : null,
  }
}
