'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/data/format'
import type { NotificationItem } from '@/lib/data/types'

async function requireUserId() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

function mapNotification(row: Record<string, unknown>): NotificationItem {
  const type = String(row.type ?? 'general')
  const notificationType: NotificationItem['type'] =
    type === 'wallet' || type === 'investment' || type === 'security' || type === 'reward'
      ? type
      : 'general'

  return {
    id: row.id as string,
    title: row.title as string,
    message: row.message as string,
    time: formatRelativeTime(row.created_at as string),
    read: Boolean(row.read_at),
    type: notificationType,
    createdAt: row.created_at as string,
  }
}

export async function fetchUserNotifications(limit = 50): Promise<NotificationItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data?.length) return []

  return data.map((row) => mapNotification(row as Record<string, unknown>))
}

export async function getUnreadNotificationCount(): Promise<number> {
  const userId = await requireUserId()
  if (!userId) return 0

  const supabase = await createServerSupabaseClient()
  const { count, error } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) return 0
  return count ?? 0
}

export async function markNotificationRead(notificationId: string) {
  const userId = await requireUserId()
  if (!userId) return { success: false as const }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (!error) {
    revalidatePath('/notifications')
  }

  return { success: !error }
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId()
  if (!userId) return { success: false as const }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (!error) {
    revalidatePath('/notifications')
  }

  return { success: !error }
}
