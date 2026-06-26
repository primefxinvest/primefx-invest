'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMfaStatus } from '@/lib/auth/mfa'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { getDepositCurrencies, getWithdrawalCurrencies } from '@/lib/payments/config'
import { isBinancePayConfigured, isNowPaymentsConfigured } from '@/lib/payments/env'
import { createDepositPayment, createWithdrawalPayment } from '@/lib/payments/service'
import type { CreateDepositResult, CreateWithdrawalResult } from '@/lib/payments/types'

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
  return {
    depositCurrencies: getDepositCurrencies(),
    withdrawalCurrencies: getWithdrawalCurrencies(),
    binancePayEnabled: isBinancePayConfigured(),
    nowPaymentsEnabled: isNowPaymentsConfigured(),
  }
}

export async function initiateDeposit(input: {
  amountUsd: number
  currency: string
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
  })

  if (result.success) {
    revalidatePath('/wallet')
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
    const mfa = await getMfaStatus()
    if (!mfa.enabled) {
      return { success: false, error: 'Enable two-factor authentication before withdrawing funds.' }
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
    revalidatePath('/transactions')
  }

  return result
}
