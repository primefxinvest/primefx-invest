import 'server-only'

import { INVESTOR_RULES } from '@/lib/investor/rules'
import { getKycBlockReason } from '@/lib/investor/kyc'
import { isAccountStatusFinanciallyBlocked } from '@/lib/security/account-access'
import { generatePaymentReference } from '@/lib/payments/reference'
import { notifyInvestmentCreated } from '@/lib/notifications/service'
import { markReferralActiveOnFirstActivity } from '@/lib/referral/commission-service'
import { syncInvestorTierFromActivePlans } from '@/lib/invest/tier-sync'
import {
  assertSufficientBalance,
  creditInvestorWallet,
  debitInvestorWallet,
} from '@/lib/payments/wallet-ledger'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export interface ExecuteInvestmentInput {
  userId: string
  planId: string
  amount: number
}

export interface ExecuteInvestmentResult {
  success: boolean
  error?: string
  investmentId?: string
  referenceId?: string
  investorTierUpgraded?: string
}

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error(
      'Investment processing is unavailable. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured.'
    )
  }
  return db
}

export async function executeInvestment(
  input: ExecuteInvestmentInput
): Promise<ExecuteInvestmentResult> {
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: 'Enter a valid investment amount.' }
  }

  const db = getDb()

  const { data: profile, error: profileError } = await db
    .from('users')
    .select('kyc_status, account_status')
    .eq('id', input.userId)
    .maybeSingle()

  if (profileError || !profile) {
    return { success: false, error: 'Account not found. Please sign in again.' }
  }

  const accountStatus = String(profile.account_status ?? 'active').toLowerCase()
  if (isAccountStatusFinanciallyBlocked(accountStatus)) {
    return { success: false, error: 'Your account cannot make new investments right now.' }
  }

  const { data: plan, error: planError } = await db
    .from('investment_plans')
    .select(
      'id, name, minimum_investment, max_investment, is_active, visibility, weekly_roi, investor_count'
    )
    .eq('id', input.planId)
    .maybeSingle()

  if (planError || !plan) {
    return { success: false, error: 'Investment plan not found.' }
  }

  if (!plan.is_active || String(plan.visibility ?? 'public').toLowerCase() !== 'public') {
    return { success: false, error: 'This investment plan is not available.' }
  }

  const minimum = Number(plan.minimum_investment ?? 0)
  const maximum = plan.max_investment != null ? Number(plan.max_investment) : null

  if (amount < minimum) {
    return {
      success: false,
      error: `Minimum investment for ${plan.name} is $${minimum.toLocaleString('en-US')}.`,
    }
  }

  if (maximum != null && maximum > 0 && amount > maximum) {
    return {
      success: false,
      error: `Maximum investment for ${plan.name} is $${maximum.toLocaleString('en-US')}.`,
    }
  }

  if (INVESTOR_RULES.financial.kycRequiredForInvestment) {
    const kycBlock = getKycBlockReason(profile.kyc_status as string | undefined, 'investment')
    if (kycBlock) {
      return { success: false, error: kycBlock }
    }
  }

  const { count: activeCount, error: countError } = await db
    .from('investments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .ilike('status', 'active')

  if (countError) {
    return { success: false, error: 'Unable to verify your active investments. Please try again.' }
  }

  if ((activeCount ?? 0) >= INVESTOR_RULES.financial.maximumActiveInvestments) {
    return {
      success: false,
      error: `You can have at most ${INVESTOR_RULES.financial.maximumActiveInvestments} active investments.`,
    }
  }

  try {
    await assertSufficientBalance(input.userId, amount)
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Insufficient wallet balance. Please deposit funds first.',
    }
  }

  const referenceId = generatePaymentReference('investment')
  let walletDebited = false

  try {
    await debitInvestorWallet(input.userId, amount)
    walletDebited = true

    const { data: investment, error: investmentError } = await db
      .from('investments')
      .insert({
        user_id: input.userId,
        plan_id: input.planId,
        amount,
        current_value: amount,
        roi_percentage: Number(plan.weekly_roi ?? 0),
        status: 'Active',
        reference_id: referenceId,
      })
      .select('id')
      .single()

    if (investmentError || !investment) {
      throw new Error(investmentError?.message ?? 'Failed to create investment record.')
    }

    const { error: transactionError } = await db.from('transactions').insert({
      user_id: input.userId,
      type: 'investment',
      amount,
      status: 'Completed',
      description: `Investment in ${plan.name}`,
      reference_id: referenceId,
      investment_id: investment.id,
    })

    if (transactionError) {
      throw new Error(transactionError.message)
    }

    const { data: portfolio, error: portfolioError } = await db
      .from('portfolios')
      .select('total_invested, current_value')
      .eq('user_id', input.userId)
      .maybeSingle()

    if (portfolioError) {
      throw new Error(portfolioError.message)
    }

    if (portfolio) {
      const { error: portfolioUpdateError } = await db
        .from('portfolios')
        .update({
          total_invested: Number(portfolio.total_invested ?? 0) + amount,
          current_value: Number(portfolio.current_value ?? 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', input.userId)

      if (portfolioUpdateError) {
        throw new Error(portfolioUpdateError.message)
      }
    } else {
      const { error: portfolioInsertError } = await db.from('portfolios').insert({
        user_id: input.userId,
        total_invested: amount,
        current_value: amount,
      })

      if (portfolioInsertError) {
        throw new Error(portfolioInsertError.message)
      }
    }

    const nextInvestorCount = Number(plan.investor_count ?? 0) + 1
    await db
      .from('investment_plans')
      .update({ investor_count: nextInvestorCount })
      .eq('id', input.planId)

    await notifyInvestmentCreated(input.userId, String(plan.name), amount, referenceId)

    await markReferralActiveOnFirstActivity(input.userId)

    let investorTierUpgraded: string | undefined
    try {
      const tierSync = await syncInvestorTierFromActivePlans(input.userId, db)
      if (tierSync.upgraded && tierSync.investorTier) {
        investorTierUpgraded = tierSync.investorTier
      }
    } catch {
      // Tier sync is best-effort; investment already succeeded.
    }

    return {
      success: true,
      investmentId: investment.id as string,
      referenceId,
      investorTierUpgraded,
    }
  } catch (err) {
    if (walletDebited) {
      try {
        await creditInvestorWallet(input.userId, amount)
      } catch {
        // Best-effort rollback; original error is more important for the user.
      }
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Investment failed. Please try again.',
    }
  }
}
