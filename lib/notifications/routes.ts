import type { NotificationItem } from '@/lib/data/types'

type AppHref =
  | '/wallet'
  | '/transactions'
  | '/portfolio'
  | '/invest'
  | '/rewards'
  | '/referral'
  | '/settings'
  | '/profile'
  | '/market-insights'
  | '/notifications'

function haystack(item: NotificationItem) {
  return `${item.title} ${item.message}`.toLowerCase()
}

/** Client-side deep link from notification type and content — no API changes. */
export function getNotificationHref(item: NotificationItem): AppHref | null {
  const text = haystack(item)

  if (item.type === 'wallet') {
    if (text.includes('deposit') || text.includes('withdraw')) return '/wallet'
    return '/transactions'
  }

  if (item.type === 'investment' || item.type === 'payout') {
    if (text.includes('plan') || text.includes('invest')) return '/invest'
    return '/portfolio'
  }

  if (item.type === 'reward') {
    if (text.includes('referral')) return '/referral'
    return '/rewards'
  }

  if (item.type === 'security') {
    if (text.includes('kyc') || text.includes('verif') || text.includes('identity')) return '/profile'
    return '/settings'
  }

  if (item.type === 'market') return '/market-insights'

  if (text.includes('deposit') || text.includes('withdraw') || text.includes('wallet')) return '/wallet'
  if (text.includes('transaction')) return '/transactions'
  if (text.includes('invest') || text.includes('portfolio') || text.includes('payout')) return '/portfolio'
  if (text.includes('referral')) return '/referral'
  if (text.includes('reward') || text.includes('bonus')) return '/rewards'
  if (text.includes('kyc') || text.includes('verif')) return '/profile'
  if (text.includes('password') || text.includes('security') || text.includes('2fa')) return '/settings'

  return null
}

export function getNotificationActionLabel(item: NotificationItem): string | null {
  const href = getNotificationHref(item)
  if (!href) return null

  switch (href) {
    case '/wallet':
      return 'View wallet'
    case '/transactions':
      return 'View transactions'
    case '/portfolio':
      return 'View portfolio'
    case '/invest':
      return 'View investments'
    case '/rewards':
      return 'View rewards'
    case '/referral':
      return 'View referral'
    case '/settings':
      return 'Security settings'
    case '/profile':
      return 'View profile'
    case '/market-insights':
      return 'View market insights'
    default:
      return 'View details'
  }
}

export type NotificationDateGroup = 'today' | 'yesterday' | 'thisWeek' | 'earlier'

export function getNotificationDateGroup(createdAt?: string): NotificationDateGroup {
  if (!createdAt) return 'earlier'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'earlier'

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  if (date >= startOfToday) return 'today'
  if (date >= startOfYesterday) return 'yesterday'
  if (date >= startOfWeek) return 'thisWeek'
  return 'earlier'
}

const GROUP_ORDER: NotificationDateGroup[] = ['today', 'yesterday', 'thisWeek', 'earlier']

export const NOTIFICATION_GROUP_LABELS: Record<NotificationDateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  earlier: 'Earlier',
}

export function groupNotificationsByDate(items: NotificationItem[]) {
  const groups = new Map<NotificationDateGroup, NotificationItem[]>()

  for (const item of items) {
    const group = getNotificationDateGroup(item.createdAt)
    const list = groups.get(group) ?? []
    list.push(item)
    groups.set(group, list)
  }

  return GROUP_ORDER.filter((key) => groups.has(key)).map((key) => ({
    key,
    label: NOTIFICATION_GROUP_LABELS[key],
    items: groups.get(key)!,
  }))
}
