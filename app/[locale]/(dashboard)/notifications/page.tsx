'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Bell, CheckCheck, Wallet, Shield, TrendingUp, Gift, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { NotificationListSkeleton, PageHeaderSkeleton } from '@/components/shared/skeletons'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchNotifications } from '@/lib/data/queries'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/actions'
import {
  getNotificationActionLabel,
  getNotificationHref,
  groupNotificationsByDate,
} from '@/lib/notifications/routes'
import { invalidateAsyncCache } from '@/lib/hooks/async-cache'
import type { NotificationItem } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const typeIcons: Record<string, typeof Bell> = {
  wallet: Wallet,
  investment: TrendingUp,
  payout: TrendingUp,
  security: Shield,
  reward: Gift,
  market: TrendingUp,
  general: Bell,
}

export default function NotificationsPage() {
  const router = useRouter()
  const { data: fetched, loading, error, reload } = useAsyncData(
    () => fetchNotifications(),
    []
  )
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    if (fetched) {
      setItems(fetched)
    }
  }, [fetched])

  const unreadCount = items.filter((n) => !n.read).length
  const groupedItems = useMemo(() => groupNotificationsByDate(items), [items])

  const markAllRead = async () => {
    const result = await markAllNotificationsRead()
    if (result.success) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      invalidateAsyncCache('user-notifications')
      toast.success('All notifications marked as read')
      window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
    }
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      const result = await markNotificationRead(item.id)
      if (result.success) {
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
        invalidateAsyncCache('user-notifications')
        window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
      }
    }

    const href = getNotificationHref(item)
    if (href) {
      router.push(href)
    }
  }

  if (loading && !fetched) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <NotificationListSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className={pageStackClass}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        ) : null}
      </header>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={items.length === 0}
        emptyTitle="No notifications yet"
        emptyDescription="Deposits, withdrawals, investments, and security updates will appear here."
        skeleton={<NotificationListSkeleton />}
        compact
      >
        <div className="space-y-8">
          {groupedItems.map((group) => (
            <section key={group.key} aria-label={group.label} className={sectionStackClass}>
              <SectionHeading>{group.label}</SectionHeading>
              <div className="space-y-3">
                {group.items.map((item) => {
                  const Icon = typeIcons[item.type] ?? Bell
                  const href = getNotificationHref(item)
                  const actionLabel = getNotificationActionLabel(item)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      aria-label={`${item.read ? '' : 'Unread: '}${item.title}`}
                      className={cn(
                        'group w-full rounded-xl border p-4 text-left shadow-sm transition-colors sm:p-5',
                        item.read
                          ? 'border-gray-200 bg-white hover:bg-gray-50'
                          : 'border-[#0052ff]/25 bg-blue-50/50 hover:bg-blue-50/70'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            item.read ? 'bg-gray-100 text-gray-500' : 'bg-[#0052ff]/10 text-[#0052ff]'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm text-gray-900',
                                item.read ? 'font-medium' : 'font-semibold'
                              )}
                            >
                              {item.title}
                            </p>
                            {!item.read ? (
                              <span
                                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0052ff]"
                                aria-hidden="true"
                              />
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.message}</p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-gray-400">{item.time}</p>
                            {href && actionLabel ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052ff] group-hover:underline">
                                {actionLabel}
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}
