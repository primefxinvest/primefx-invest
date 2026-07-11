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
    const { countActiveNetworkInvestors } = await import('@/lib/referral/team-metrics')
    activeCount = await countActiveNetworkInvestors(ids)
  }

  const { REFERRAL_RANK_TIERS, resolveReferralRank } = await import('@/lib/referral/program-config')
  const memberCount = totalCount ?? 0
  const rank = resolveReferralRank(activeCount)

  const { data: previous } = await admin
    .from('user_referral_stats')
    .select('rank_key')
    .eq('user_id', userId)
    .maybeSingle()

  const previousIndex = previous?.rank_key
    ? REFERRAL_RANK_TIERS.findIndex((tier) => tier.key === previous.rank_key)
    : -1
  const newIndex = rank.achieved
    ? REFERRAL_RANK_TIERS.findIndex((tier) => tier.key === rank.achieved!.key)
    : -1
  const rankUpgraded = newIndex > previousIndex

  await admin.from('user_referral_stats').upsert(
    {
      user_id: userId,
      rank_key: rank.achievedKey,
      active_member_count: activeCount,
      total_member_count: memberCount,
      updated_at: new Date().toISOString(),
      ...(rankUpgraded && rank.achievedKey
        ? { rank_achieved_at: new Date().toISOString() }
        : {}),
    },
    { onConflict: 'user_id' }
  )

  for (const tier of REFERRAL_RANK_TIERS) {
    if (activeCount >= tier.minMembers) {
      await ensureRankRewardRecord(userId, tier.key, tier.cashBonusUsd, tier.perks)
    }
  }
}

async function ensureRankRewardRecord(
  userId: string,
  rankKey: string,
  cashBonusUsd: number,
  perks: readonly string[]
) {
  const admin = getDb()
  if (!admin || (cashBonusUsd <= 0 && perks.length === 0)) return

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
    status: cashBonusUsd > 0 ? 'pending' : 'awaiting_fulfillment',
  })
}

/**
 * Resolve upline for commission accrual.
 * Falls back to the referrals chain and rebuilds referral_network when the
 * closure table is empty (e.g. signup succeeded but network insert failed).
 */
export async function getReferralAncestors(userId: string, maxLevel = 4) {
  const admin = getDb()
  if (!admin) return []

  const { data } = await admin
    .from('referral_network')
    .select('ancestor_id, depth')
    .eq('descendant_id', userId)
    .lte('depth', maxLevel)
    .order('depth', { ascending: true })

  if (data?.length) {
    return data.map((row) => ({
      referrerId: row.ancestor_id as string,
      level: Number(row.depth),
    }))
  }

  const { data: direct } = await admin
    .from('referrals')
    .select('referrer_id')
    .eq('referred_user_id', userId)
    .maybeSingle()

  const directReferrerId = direct?.referrer_id as string | undefined
  if (!directReferrerId) return []

  await buildReferralNetworkForUser(userId, directReferrerId)

  const { data: rebuilt } = await admin
    .from('referral_network')
    .select('ancestor_id, depth')
    .eq('descendant_id', userId)
    .lte('depth', maxLevel)
    .order('depth', { ascending: true })

  if (rebuilt?.length) {
    return rebuilt.map((row) => ({
      referrerId: row.ancestor_id as string,
      level: Number(row.depth),
    }))
  }

  const chain = [directReferrerId, ...(await getReferrerChain(admin, directReferrerId, maxLevel - 1))]
  return chain.slice(0, maxLevel).map((referrerId, index) => ({
    referrerId,
    level: index + 1,
  }))
}

export async function getReferralNetworkDescendants(userId: string, maxDepth = 4) {
  const admin = getDb()
  if (!admin) return []

  const { data } = await admin
    .from('referral_network')
    .select('descendant_id, depth')
    .eq('ancestor_id', userId)
    .lte('depth', maxDepth)
    .order('depth', { ascending: true })

  return (data ?? []).map((row) => ({
    descendantId: row.descendant_id as string,
    depth: Number(row.depth),
  }))
}
