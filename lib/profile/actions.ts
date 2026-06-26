import { getCurrentUser, supabase } from '@/lib/supabase'
import { getUser, createUserActivityLog, getUserActivityLogs } from '@/lib/db/supabase'
import { normalizePlanTier, planTierOrder } from '@/lib/invest/upgrade'
import { getMfaStatus } from '@/lib/auth/mfa'
import { getDefaultAvatarUrl, isDataUrl } from './avatar'
import { resolveUserDisplayName, formatPersonName } from './display-name'
import type { ProfileActivity, UpdateProfileInput, UserProfile } from './types'

const emptyProfile: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  avatarUrl: getDefaultAvatarUrl('user'),
  tier: 'Investor',
  kycStatus: 'Pending',
  twoFactorEnabled: false,
  memberSince: '—',
  emailVerified: false,
}

const PROFILE_STORAGE_PREFIX = 'primefx_profile_'
const ACTIVITY_STORAGE_PREFIX = 'primefx_profile_activity_'

function formatTierLabel(tier?: string | null) {
  const key = normalizePlanTier(tier)
  const match = planTierOrder.find((plan) => plan.key === key)
  return match ? `${match.shortName} Investor` : 'Investor'
}

function formatMemberSince(date?: string | null) {
  if (!date) return 'January 15, 2023'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatActivityTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`
}

function getLocalProfile(userId: string): Partial<UserProfile> | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Partial<UserProfile>
  } catch {
    return null
  }
}

function saveLocalProfile(userId: string, profile: Partial<UserProfile>) {
  if (typeof window === 'undefined') return
  const existing = getLocalProfile(userId) ?? {}
  localStorage.setItem(
    `${PROFILE_STORAGE_PREFIX}${userId}`,
    JSON.stringify({ ...existing, ...profile })
  )
}

function getLocalActivity(userId: string): ProfileActivity[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(`${ACTIVITY_STORAGE_PREFIX}${userId}`)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ProfileActivity[]
  } catch {
    return []
  }
}

function saveLocalActivity(userId: string, activities: ProfileActivity[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${ACTIVITY_STORAGE_PREFIX}${userId}`, JSON.stringify(activities))
}

export async function logProfileActivity(userId: string, action: string, device: string) {
  const createdAt = new Date().toISOString()

  const { data, error } = await createUserActivityLog({
    user_id: userId,
    action,
    device,
  })

  if (!error && data) {
    return [
      {
        id: data.id as string,
        action: data.action as string,
        device: (data.device as string | null) ?? device,
        time: 'Just now',
        createdAt: (data.created_at as string) ?? createdAt,
      },
    ]
  }

  const entry: ProfileActivity = {
    id: crypto.randomUUID(),
    action,
    device,
    time: 'Just now',
    createdAt,
  }
  const existing = getLocalActivity(userId)
  const updated = [entry, ...existing].slice(0, 20)
  saveLocalActivity(userId, updated)
  return updated.map((item) => ({
    ...item,
    time: item.id === entry.id ? 'Just now' : formatActivityTime(item.createdAt),
  }))
}

export function getStoredProfileAvatar(userId: string): string | null {
  return getLocalProfile(userId)?.avatarUrl ?? null
}

export function getStoredProfileFullName(userId: string): string | null {
  return getLocalProfile(userId)?.fullName ?? null
}

export async function getUserProfile(): Promise<UserProfile> {
  const { data: authUser } = await getCurrentUser()

  if (!authUser) {
    return emptyProfile
  }

  const { data: dbUser } = await getUser(authUser.id)
  const local = getLocalProfile(authUser.id)
  const metadata = authUser.user_metadata ?? {}

  const tier =
    (dbUser?.investor_tier as string | undefined) ??
    (metadata.investor_tier as string | undefined) ??
    (metadata.tier as string | undefined) ??
    'Prime'

  const kycRaw =
    (dbUser?.kyc_status as string | undefined) ??
    (metadata.kyc_status as string | undefined) ??
    'Pending'

  const kycStatus =
    kycRaw === 'Verified' || kycRaw === 'Rejected' || kycRaw === 'Pending'
      ? kycRaw
      : 'Pending'

  const mfaStatus = await getMfaStatus()

  return {
    id: authUser.id,
    fullName: resolveUserDisplayName({
      dbName: dbUser?.full_name as string | undefined,
      metadataName: metadata.full_name as string | undefined,
      localName: local?.fullName,
      email: authUser.email,
    }),
    email: authUser.email ?? '',
    phone:
      local?.phone ??
      (dbUser?.phone_number as string | undefined) ??
      (metadata.phone as string | undefined) ??
      '',
    dateOfBirth:
      local?.dateOfBirth ??
      (metadata.date_of_birth as string | undefined) ??
      '',
    address:
      local?.address ?? (metadata.address as string | undefined) ?? '',
    avatarUrl:
      local?.avatarUrl ??
      (dbUser?.avatar_url as string | undefined) ??
      (metadata.avatar_url as string | undefined) ??
      getDefaultAvatarUrl(authUser.id),
    tier: formatTierLabel(tier),
    kycStatus,
    twoFactorEnabled: mfaStatus.enabled,
    memberSince: formatMemberSince(
      (dbUser?.created_at as string | undefined) ?? authUser.created_at
    ),
    emailVerified: Boolean(authUser.email_confirmed_at),
  }
}

export async function updateUserProfile(
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  const { data: authUser } = await getCurrentUser()

  if (!authUser) {
    return { success: false, error: 'You must be logged in to update your profile.' }
  }

  const fullName = formatPersonName(input.fullName.trim())
  const avatarUrl =
    input.avatarUrl?.trim() || getDefaultAvatarUrl(fullName)
  const avatarForMetadata = isDataUrl(avatarUrl) ? undefined : avatarUrl

  try {
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone: input.phone.trim(),
        date_of_birth: input.dateOfBirth.trim(),
        address: input.address.trim(),
        ...(avatarForMetadata ? { avatar_url: avatarForMetadata } : {}),
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    const { error: dbError } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        phone_number: input.phone.trim(),
        ...(avatarForMetadata ? { avatar_url: avatarForMetadata } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)

    saveLocalProfile(authUser.id, {
      fullName,
      phone: input.phone.trim(),
      dateOfBirth: input.dateOfBirth.trim(),
      address: input.address.trim(),
      avatarUrl,
    })

    await logProfileActivity(authUser.id, 'Profile Updated', 'Profile Settings')

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
    }

    const profile = await getUserProfile()

    if (dbError) {
      return { success: true, profile }
    }

    return { success: true, profile }
  } catch {
    saveLocalProfile(authUser.id, {
      fullName,
      phone: input.phone.trim(),
      dateOfBirth: input.dateOfBirth.trim(),
      address: input.address.trim(),
      avatarUrl,
    })
    await logProfileActivity(authUser.id, 'Profile Updated', 'Profile Settings')

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
    }

    const profile = await getUserProfile()
    return { success: true, profile }
  }
}

export async function getProfileActivity(): Promise<ProfileActivity[]> {
  const { data: authUser } = await getCurrentUser()
  if (!authUser) return []

  const { data, error } = await getUserActivityLogs(authUser.id)

  if (!error && data?.length) {
    return data.map((row) => ({
      id: row.id as string,
      action: row.action as string,
      device: (row.device as string | null) ?? '—',
      createdAt: row.created_at as string,
      time: formatActivityTime(row.created_at as string),
    }))
  }

  const local = getLocalActivity(authUser.id)
  return local.map((item) => ({
    ...item,
    time: formatActivityTime(item.createdAt),
  }))
}
