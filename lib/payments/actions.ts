'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireServerMfaEnabled } from '@/lib/auth/mfa-server'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { fetchPaymentProviderOptionsServer } from '@/lib/payments/options-server'
import { syncUserPendingDeposits } from '@/lib/payments/deposit-sync'
import { createDepositPayment, createWithdrawalPayment } from '@/lib/payments/service'
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

export async function initiateWithdrawal(input: {
  amountUsd: number
  currency: string
  address: string
}): Promise<CreateWithdrawalResult> {
  const user = await requireUser()

  if (INVESTOR_RULES.security.twoFactorRequiredForWithdrawal) {
    const mfa = await requireServerMfaEnabled(user.id)
    if (!mfa.allowed) {
      return { success: false, error: mfa.error }
    }
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
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
  }

  return result
}
