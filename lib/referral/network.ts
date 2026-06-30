import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

function getDb(): SupabaseClient | null {
  return createAdminSupabaseClient()
}

async function getReferrerChain(admin: SupabaseClient, startUserId: string, maxDepth = 4) {
  const chain: string[] = []
  let currentId: string | null = startUserId

  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (!currentId) break

    const { data } = await admin
      .from('referrals')
      .select('referrer_id')
      .eq('referred_user_id', currentId)
      .maybeSingle()

    const referrerId = data?.referrer_id as string | undefined
    if (!referrerId) break

    chain.push(referrerId)
    currentId = referrerId
  }

  return chain
}

export async function buildReferralNetworkForUser(referredUserId: string, directReferrerId: string) {
  const admin = getDb()
  if (!admin) return

  const ancestors = [directReferrerId, ...(await getReferrerChain(admin, directReferrerId, 3))]

  const rows = ancestors.slice(0, 4).map((ancestorId, index) => ({
    ancestor_id: ancestorId,
    descendant_id: referredUserId,
    depth: index + 1,
  }))

  if (rows.length === 0) return

  await admin.from('referral_network').upsert(rows, {
    onConflict: 'ancestor_id,descendant_id',
    ignoreDuplicates: true,
  })

  for (const ancestorId of ancestors) {
    await refreshUserReferralStats(ancestorId)
  }
}

export async function refreshUserReferralStats(userId: string) {
  const admin = getDb()
  if (!admin) return

  const { count: totalCount } = await admin
    .from('referral_network')
    .select('*', { count: 'exact', head: true })
    .eq('ancestor_id', userId)

  const { data: activeRows } = await admin
    .from('referral_network')
    .select('descendant_id')
    .eq('ancestor_id', userId)

  let activeCount = 0
  if (activeRows?.length) {
    const ids = activeRows.map((row) => row.descendant_id as string)
    const { count } = await admin
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .in('referred_user_id', ids)
      .eq('status', 'Active')

    activeCount = count ?? 0
  }

  const { resolveReferralRank } = await import('@/lib/referral/program-config')
  const rank = resolveReferralRank(activeCount)

  await admin.from('user_referral_stats').upsert(
    {
      user_id: userId,
      rank_key: rank.current.key,
      active_member_count: activeCount,
      total_member_count: totalCount ?? 0,
      updated_at: new Date().toISOString(),
      rank_achieved_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  await ensureRankRewardRecord(userId, rank.current.key, rank.current.cashBonusUsd, rank.current.perks)
}

async function ensureRankRewardRecord(
  userId: string,
  rankKey: string,
  cashBonusUsd: number,
  perks: readonly string[]
) {
  const admin = getDb()
  if (!admin || cashBonusUsd <= 0) return

  const { data: existing } = await admin
    .from('referral_rank_rewards')
    .select('id')
    .eq('user_id', userId)
    .eq('rank_key', rankKey)
    .maybeSingle()

  if (existing) return

  await admin.from('referral_rank_rewards').insert({
    user_id: userId,
    rank_key: rankKey,
    cash_bonus_usd: cashBonusUsd,
    perks: [...perks],
    status: 'pending',
  })
}

export async function getReferralAncestors(userId: string, maxLevel = 4) {
  const admin = getDb()
  if (!admin) return []

  const { data } = await admin
    .from('referral_network')
    .select('ancestor_id, depth')
    .eq('descendant_id', userId)
    .lte('depth', maxLevel)
    .order('depth', { ascending: true })

  return (data ?? []).map((row) => ({
    referrerId: row.ancestor_id as string,
    level: Number(row.depth),
  }))
}
