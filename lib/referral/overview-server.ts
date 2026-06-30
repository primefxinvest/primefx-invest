import 'server-only'

import { formatCurrency, formatDate, toNumber } from '@/lib/data/format'
import type { ReferralData } from '@/lib/data/types'
import { buildReferralProgramOverview } from '@/lib/referral/analytics'
import type { ReferralListItem } from '@/lib/referral/analytics'
import { getSiteUrl } from '@/lib/seo/site'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type ReferralProgramPageData = {
  referralData: ReferralData
  referrals: ReferralListItem[]
  overview: ReturnType<typeof buildReferralProgramOverview>
}

export async function fetchReferralProgramOverviewServer(
  userId: string
): Promise<ReferralProgramPageData> {
  const supabase = await createServerSupabaseClient()

  const [{ data: user }, { data: referrals }] = await Promise.all([
    supabase.from('users').select('referral_code').eq('id', userId).maybeSingle(),
    supabase
      .from('referrals')
      .select('id, referred_user_id, bonus_earned, status, created_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const referralRows = referrals ?? []
  const totalEarnings = referralRows.reduce((sum, row) => sum + toNumber(row.bonus_earned), 0)
  const referralCode = (user?.referral_code as string | undefined)?.trim() || userId.slice(0, 8)
  const origin = getSiteUrl()

  const referralData: ReferralData = {
    referralLink: `${origin}/signup?ref=${encodeURIComponent(referralCode)}`,
    referralCode,
    totalReferrals: referralRows.length,
    totalEarnings: formatCurrency(totalEarnings),
  }

  const referredIds = referralRows
    .map((row) => row.referred_user_id as string)
    .filter(Boolean)

  const referredUsers = new Map<string, { full_name?: string; email?: string }>()
  if (referredIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', referredIds)

    users?.forEach((profile) => {
      referredUsers.set(profile.id as string, {
        full_name: profile.full_name as string | undefined,
        email: profile.email as string | undefined,
      })
    })
  }

  const referralList: ReferralListItem[] = referralRows.map((row) => {
    const referredId = row.referred_user_id as string
    const referred = referredUsers.get(referredId)

    return {
      id: row.id as string,
      name: referred?.full_name || `Investor ${referredId.slice(0, 8)}`,
      email: referred?.email || 'Referred investor',
      status: (row.status as string) ?? 'Pending',
      commissionEarned: toNumber(row.bonus_earned),
      joinedDate: formatDate(row.created_at as string),
      tradingVolume: formatCurrency(toNumber(row.bonus_earned) * 20),
    }
  })

  return {
    referralData,
    referrals: referralList,
    overview: buildReferralProgramOverview(referralList, referralData.totalReferrals),
  }
}
