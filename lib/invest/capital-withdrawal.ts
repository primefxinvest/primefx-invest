import 'server-only'

import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'
import { getWithdrawalAvailableDate } from '@/lib/fees/constants'
import { generatePaymentReference } from '@/lib/payments/reference'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'
import {
  isCapitalWithdrawalUnlocked,
  resolvePlanCapitalLockDays,
} from '@/lib/invest/profit-engine'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for capital withdrawals.')
  }
  return db
}

export async function requestInvestmentCapitalWithdrawal(input: {
  userId: string
  investmentId: string
  supportNote?: string
}) {
  const account = await requireActiveAccountForFinancialAction(input.userId, 'payout')
  if (!account.allowed) {
    throw new Error(account.error)
  }

  const kyc = await requireVerifiedKyc(input.userId, 'withdrawal')
  if (!kyc.allowed) {
    throw new Error(kyc.error)
  }

  const db = getDb()
  const { data: investment, error } = await db
    .from('investments')
    .select(
      'id, user_id, amount, current_value, status, created_at, capital_withdrawal_unlock_at, investment_plans(name, capital_lock_days)'
    )
    .eq('id', input.investmentId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (error || !investment) {
    throw new Error('Investment not found.')
  }

  if (String(investment.status).toLowerCase() !== 'active') {
    throw new Error('Only active investments can be withdrawn.')
  }

  const plan = investment.investment_plans as { name?: string; capital_lock_days?: number } | null
  const unlockAt =
    (investment.capital_withdrawal_unlock_at as string | null) ??
    (() => {
      const lockDays = resolvePlanCapitalLockDays(
        String(plan?.name ?? ''),
        plan?.capital_lock_days != null ? Number(plan.capital_lock_days) : null
      )
      if (lockDays <= 0) return null
      const created = new Date(investment.created_at as string)
      created.setUTCDate(created.getUTCDate() + lockDays)
      return created.toISOString()
    })()

  if (unlockAt && !isCapitalWithdrawalUnlocked(unlockAt)) {
    throw new Error(
      'Capital withdrawal is locked. Your investment must complete the minimum holding period first.'
    )
  }

  const amount = Number(investment.current_value ?? investment.amount ?? 0)
  if (amount <= 0) {
    throw new Error('No capital available to withdraw from this investment.')
  }

  const { data: pending } = await db
    .from('investment_withdrawal_requests')
    .select('id')
    .eq('investment_id', input.investmentId)
    .in('status', ['pending_notice', 'ready'])
    .maybeSingle()

  if (pending) {
    throw new Error('A capital withdrawal is already pending for this investment.')
  }

  const requestedAt = new Date()
  const availableAt = getWithdrawalAvailableDate(requestedAt)
  const referenceId = generatePaymentReference('investment')

  const { data: request, error: insertError } = await db
    .from('investment_withdrawal_requests')
    .insert({
      user_id: input.userId,
      investment_id: input.investmentId,
      amount_usd: amount,
      status: 'pending_notice',
      requested_at: requestedAt.toISOString(),
      available_at: availableAt.toISOString(),
      reference_id: referenceId,
      support_note: input.supportNote?.trim() || null,
    })
    .select('id')
    .single()

  if (insertError || !request) {
    throw new Error(insertError?.message ?? 'Failed to create capital withdrawal request.')
  }

  await db.from('transactions').insert({
    user_id: input.userId,
    type: 'investment',
    amount,
    status: 'Pending',
    description: `Capital withdrawal requested — available ${availableAt.toLocaleDateString('en-US')} (${WITHDRAWAL_NOTICE_DAYS}-day notice). Contact PrimeFx Support if you need help.`,
    reference_id: referenceId,
  })

  return {
    requestId: request.id as string,
    referenceId,
    amountUsd: amount,
    availableAt: availableAt.toISOString(),
  }
}

export async function listDueInvestmentCapitalWithdrawals(limit = 50) {
  const db = getDb()
  const now = new Date().toISOString()

  const { data, error } = await db
    .from('investment_withdrawal_requests')
    .select('*')
    .in('status', ['pending_notice', 'ready'])
    .lte('available_at', now)
    .order('available_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function processInvestmentCapitalWithdrawal(requestId: string) {
  const db = getDb()
  const { data: request } = await db
    .from('investment_withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (!request) throw new Error('Request not found.')

  const userId = request.user_id as string
  const investmentId = request.investment_id as string
  const amount = Number(request.amount_usd)
  const referenceId = request.reference_id as string

  const { creditInvestorWallet } = await import('@/lib/payments/wallet-ledger')

  await db
    .from('investments')
    .update({ status: 'Closed', current_value: 0, end_date: new Date().toISOString() })
    .eq('id', investmentId)

  const { data: portfolio } = await db
    .from('portfolios')
    .select('total_invested, current_value')
    .eq('user_id', userId)
    .maybeSingle()

  if (portfolio) {
    const invested = Math.max(0, Number(portfolio.total_invested ?? 0) - amount)
    const current = Math.max(0, Number(portfolio.current_value ?? 0) - amount)
    await db
      .from('portfolios')
      .update({
        total_invested: invested,
        current_value: current,
        profit_loss: current - invested,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }

  await creditInvestorWallet(userId, amount)

  await db
    .from('investment_withdrawal_requests')
    .update({ status: 'completed', processed_at: new Date().toISOString() })
    .eq('id', requestId)

  await db
    .from('transactions')
    .update({
      status: 'Completed',
      description: `Investment capital returned to wallet (${WITHDRAWAL_NOTICE_DAYS}-day notice completed)`,
    })
    .eq('reference_id', referenceId)

  return { userId, amount, referenceId }
}

export async function listInvestmentWithdrawalRequestsForUser(userId: string) {
  const db = getDb()
  const { data } = await db
    .from('investment_withdrawal_requests')
    .select('id, investment_id, amount_usd, status, requested_at, available_at, reference_id')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(20)

  return data ?? []
}
