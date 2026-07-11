#!/usr/bin/env node
/**
 * One-time / idempotent backfill for missing 2% investment referral commissions.
 * Safe to re-run: skips source users that already have commission_type=investment.
 *
 * Usage: node scripts/backfill-investment-commissions.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '..')
const RATE = 0.02

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(ROOT, file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function refId() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `REF-${y}${m}${day}-${randomBytes(4).toString('hex').toUpperCase()}`
}

loadEnv()
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: refs, error: refsError } = await db
  .from('referrals')
  .select('id, referrer_id, referred_user_id, status, bonus_earned')

if (refsError) {
  console.error(refsError.message)
  process.exit(1)
}

const results = []

for (const ref of refs ?? []) {
  const { data: existing } = await db
    .from('referral_commissions')
    .select('id, status')
    .eq('source_user_id', ref.referred_user_id)
    .eq('commission_type', 'investment')
    .in('status', ['pending', 'paid', 'paying'])
    .limit(1)
    .maybeSingle()

  if (existing) {
    results.push({ sourceUserId: ref.referred_user_id, status: 'skipped_exists', commissionId: existing.id })
    continue
  }

  const { data: txs } = await db
    .from('transactions')
    .select('id, type, amount, reference_id, status, created_at')
    .eq('user_id', ref.referred_user_id)
    .in('type', ['deposit', 'investment'])
    .eq('status', 'Completed')
    .order('created_at', { ascending: true })
    .limit(1)

  if (!txs?.length) {
    results.push({ sourceUserId: ref.referred_user_id, status: 'skipped_no_qualifying_tx' })
    continue
  }

  const tx = txs[0]
  const amountUsd = Number(tx.amount)
  const commission = round2(amountUsd * RATE)
  if (commission <= 0) {
    results.push({ sourceUserId: ref.referred_user_id, status: 'skipped_zero' })
    continue
  }

  const eventDate = new Date().toISOString().slice(0, 10)
  const payoutReferenceId = refId()
  const trigger = tx.type === 'deposit' ? 'deposit' : 'investment'

  const { data: inserted, error: insertError } = await db
    .from('referral_commissions')
    .insert({
      referrer_id: ref.referrer_id,
      source_user_id: ref.referred_user_id,
      level: 1,
      gross_profit_usd: amountUsd,
      commission_rate: RATE,
      commission_usd: commission,
      period_start: eventDate,
      period_end: eventDate,
      commission_type: 'investment',
      status: 'pending',
      reference_id: payoutReferenceId,
    })
    .select('id')
    .single()

  if (insertError) {
    results.push({ sourceUserId: ref.referred_user_id, status: 'insert_failed', error: insertError.message })
    continue
  }

  await db
    .from('referrals')
    .update({
      bonus_earned: round2(Number(ref.bonus_earned ?? 0) + commission),
      status: 'Active',
    })
    .eq('id', ref.id)

  const { data: claimedRows, error: claimError } = await db
    .from('referral_commissions')
    .update({ status: 'paying', reference_id: payoutReferenceId })
    .eq('id', inserted.id)
    .eq('status', 'pending')
    .gt('commission_usd', 0)
    .select('id')
    .maybeSingle()

  if (claimError || !claimedRows) {
    results.push({
      sourceUserId: ref.referred_user_id,
      status: 'claim_failed_left_pending',
      commissionId: inserted.id,
      error: claimError?.message ?? 'not claimed',
    })
    continue
  }

  const { error: creditError } = await db.rpc('atomic_credit_wallet', {
    p_user_id: ref.referrer_id,
    p_amount: commission,
  })

  if (creditError) {
    await db
      .from('referral_commissions')
      .update({ status: 'pending', reference_id: null })
      .eq('id', inserted.id)
      .eq('status', 'paying')
    results.push({
      sourceUserId: ref.referred_user_id,
      status: 'credit_failed_reset_pending',
      error: creditError.message,
    })
    continue
  }

  await db.from('transactions').insert({
    user_id: ref.referrer_id,
    type: 'referral',
    amount: commission,
    status: 'Completed',
    description: `Referral investment commission 2% (${trigger}) [backfill]`,
    reference_id: payoutReferenceId,
  })

  await db
    .from('referral_commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      reference_id: payoutReferenceId,
    })
    .eq('id', inserted.id)
    .eq('status', 'paying')

  const { data: stats } = await db
    .from('user_referral_stats')
    .select('lifetime_commission_usd')
    .eq('user_id', ref.referrer_id)
    .maybeSingle()

  await db.from('user_referral_stats').upsert(
    {
      user_id: ref.referrer_id,
      lifetime_commission_usd: Number(stats?.lifetime_commission_usd ?? 0) + commission,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  await db.from('financial_audit_logs').insert({
    event_type: 'referral.investment_commission_accrued',
    user_id: ref.referrer_id,
    reference_id: payoutReferenceId,
    amount_usd: commission,
    metadata: {
      sourceUserId: ref.referred_user_id,
      trigger,
      backfill: true,
      grossAmountUsd: amountUsd,
      commissionId: inserted.id,
    },
  })

  results.push({
    sourceUserId: ref.referred_user_id,
    referrerId: ref.referrer_id,
    status: 'paid',
    commissionUsd: commission,
    referenceId: payoutReferenceId,
    trigger,
    amountUsd,
  })
}

console.log(JSON.stringify({ paid: results.filter((r) => r.status === 'paid'), results }, null, 2))
fs.writeFileSync(path.join(ROOT, 'BACKFILL_INVESTMENT_COMMISSIONS.json'), JSON.stringify(results, null, 2))
