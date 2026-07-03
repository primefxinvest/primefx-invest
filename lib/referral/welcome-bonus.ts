import 'server-only'

import { REFERRAL_WELCOME_BONUS_USD } from '@/lib/referral/program-config'
import { getReferralProgramEnabled } from '@/lib/referral/settings'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { creditInvestorWallet } from '@/lib/payments/wallet-ledger'
import { generatePaymentReference } from '@/lib/payments/reference'
import { createUserNotification } from '@/lib/notifications/service'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for welcome bonus.')
  }
  return db
}

function isKycVerified(kycStatus: string | null | undefined): boolean {
  const value = String(kycStatus ?? '').toLowerCase()
  return value === 'verified' || value === 'approved'
}

async function creditWelcomeBonus(userId: string, label: string) {
  const referenceId = generatePaymentReference('bonus')
  await creditInvestorWallet(userId, REFERRAL_WELCOME_BONUS_USD)
  const db = getDb()
  await db.from('transactions').insert({
    user_id: userId,
    type: 'bonus',
    amount: REFERRAL_WELCOME_BONUS_USD,
    status: 'Completed',
    description: label,
    reference_id: referenceId,
  })
  await createUserNotification({
    userId,
    title: 'Welcome bonus received',
    message: `$${REFERRAL_WELCOME_BONUS_USD} investment credit has been added to your wallet.`,
    type: 'reward',
  })
}

/** Pay $10 to referred user and $10 to direct referrer after first deposit + KYC. */
export async function processReferralWelcomeBonus(referredUserId: string) {
  const enabled = await getReferralProgramEnabled()
  if (!enabled) return { paid: false as const, reason: 'disabled' as const }

  const db = getDb()

  const { data: referredUser } = await db
    .from('users')
    .select('kyc_status, is_verified')
    .eq('id', referredUserId)
    .maybeSingle()

  if (!referredUser || (!isKycVerified(referredUser.kyc_status as string) && !referredUser.is_verified)) {
    return { paid: false as const, reason: 'kyc_pending' as const }
  }

  const { data: referral } = await db
    .from('referrals')
    .select('id, referrer_id, welcome_bonus_paid')
    .eq('referred_user_id', referredUserId)
    .maybeSingle()

  if (!referral?.referrer_id || referral.welcome_bonus_paid) {
    return { paid: false as const, reason: 'none' as const }
  }

  const referrerId = referral.referrer_id as string

  await creditWelcomeBonus(referredUserId, 'Referral welcome bonus — first deposit & KYC')
  await creditWelcomeBonus(referrerId, 'Referral welcome bonus — your friend joined & verified')

  await db
    .from('referrals')
    .update({ welcome_bonus_paid: true, status: 'Active' })
    .eq('id', referral.id)

  return { paid: true as const, referrerId, amountUsd: REFERRAL_WELCOME_BONUS_USD }
}

/** Call after KYC approval to catch users who deposited before verification. */
export async function processWelcomeBonusAfterKycApproval(userId: string) {
  const db = getDb()
  const { count } = await db
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'deposit')
    .eq('status', 'Completed')

  if ((count ?? 0) > 0) {
    return processReferralWelcomeBonus(userId)
  }

  return { paid: false as const, reason: 'no_deposit' as const }
}
