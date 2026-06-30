import 'server-only'

import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { REFERRAL_COOKIE_NAME } from '@/lib/referral/constants'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeReferralCode(raw: string | null | undefined): string {
  return (raw ?? '').trim()
}

export function generateReferralCode(length = 8): string {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export async function ensureUniqueReferralCode(
  admin: SupabaseClient,
  seed?: { fullName?: string | null; userId?: string }
): Promise<string> {
  const namePart =
    seed?.fullName?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() ?? ''
  const idPart = seed?.userId?.replace(/-/g, '').slice(0, 4).toUpperCase() ?? ''

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const random = generateReferralCode(6)
    const candidate = `${namePart || 'PF'}${idPart || random}${attempt > 0 ? random.slice(0, 2) : ''}`
      .slice(0, 16)
      .toUpperCase()

    const { data } = await admin
      .from('users')
      .select('id')
      .eq('referral_code', candidate)
      .maybeSingle()

    if (!data) return candidate
  }

  return generateReferralCode(10)
}

export async function resolveReferrerIdByCode(
  admin: SupabaseClient,
  rawCode: string
): Promise<string | null> {
  const code = normalizeReferralCode(rawCode)
  if (!code) return null

  const { data: byCode } = await admin
    .from('users')
    .select('id')
    .eq('referral_code', code.toUpperCase())
    .maybeSingle()

  if (byCode?.id) return byCode.id

  const { data: byCodeInsensitive } = await admin
    .from('users')
    .select('id')
    .ilike('referral_code', code)
    .maybeSingle()

  if (byCodeInsensitive?.id) return byCodeInsensitive.id

  if (code.length >= 8 && /^[0-9a-f-]+$/i.test(code)) {
    const { data: byIdPrefix } = await admin
      .from('users')
      .select('id')
      .ilike('id', `${code}%`)
      .limit(2)

    if (byIdPrefix?.length === 1) return byIdPrefix[0].id
  }

  const slug = code.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!slug) return null

  const { data: users } = await admin.from('users').select('id, full_name')
  const matches =
    users?.filter(
      (user) => user.full_name?.toLowerCase().replace(/[^a-z0-9]/g, '') === slug
    ) ?? []

  if (matches.length === 1) return matches[0].id

  return null
}

export async function readPendingReferralCode(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(REFERRAL_COOKIE_NAME)?.value
  return value ? normalizeReferralCode(decodeURIComponent(value)) : null
}

export async function recordReferralForNewUser(
  referredUserId: string,
  referralCode?: string | null
): Promise<{ success: boolean; referrerId?: string }> {
  const admin = createAdminSupabaseClient()
  if (!admin) return { success: false }

  const code = normalizeReferralCode(referralCode) || (await readPendingReferralCode())
  if (!code) return { success: false }

  const referrerId = await resolveReferrerIdByCode(admin, code)
  if (!referrerId || referrerId === referredUserId) {
    return { success: false }
  }

  const { data: existing } = await admin
    .from('referrals')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .maybeSingle()

  if (existing) {
    return { success: true, referrerId }
  }

  const { error } = await admin.from('referrals').insert({
    referrer_id: referrerId,
    referred_user_id: referredUserId,
    bonus_earned: 0,
    status: 'Pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { success: true, referrerId }
    }
    console.error('[referral] insert failed:', error.message)
    return { success: false }
  }

  const { buildReferralNetworkForUser } = await import('@/lib/referral/network')
  await buildReferralNetworkForUser(referredUserId, referrerId)

  return { success: true, referrerId }
}

export async function ensureUserReferralCode(
  userId: string,
  fullName?: string | null
): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  if (!admin) return null

  const { data: user } = await admin
    .from('users')
    .select('referral_code')
    .eq('id', userId)
    .maybeSingle()

  if (user?.referral_code) return user.referral_code

  const referralCode = await ensureUniqueReferralCode(admin, { fullName, userId })
  const { error } = await admin
    .from('users')
    .update({ referral_code: referralCode, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[referral] code update failed:', error.message)
    return null
  }

  return referralCode
}
