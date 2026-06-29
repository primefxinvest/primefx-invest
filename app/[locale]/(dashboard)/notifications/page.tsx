'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Bell, CheckCheck, Wallet, Shield, TrendingUp, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { NotificationListSkeleton, PageHeaderSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchNotifications } from '@/lib/data/queries'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/actions'
import type { NotificationItem } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const typeIcons: Record<string, typeof Bell> = {
  wallet: Wallet,
  investment: TrendingUp,
  security: Shield,
  reward: Gift,
  general: Bell,
}

export default function NotificationsPage() {
  const { data: fetched = [], loading, error, reload } = useAsyncData(
    () => fetchNotifications(),
    []
  )
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    setItems(fetched)
  }, [fetched])

  const unreadCount = items.filter((n) => !n.read).length

  const markAllRead = async () => {
    const result = await markAllNotificationsRead()
    if (result.success) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
      window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
    }
  }

  const markRead = async (id: string) => {
    const result = await markNotificationRead(id)
    if (result.success) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <NotificationListSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
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
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        ) : null}
      </div>

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
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = typeIcons[item.type] ?? Bell
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item.id)}
                className={cn(
                  'w-full rounded-xl border p-4 text-left shadow-sm transition-colors hover:bg-gray-50',
                  item.read ? 'border-gray-200 bg-white' : 'border-[#0052ff]/20 bg-blue-50/40'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      item.read ? 'bg-gray-100 text-gray-500' : 'bg-[#0052ff]/10 text-[#0052ff]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      {!item.read ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#0052ff]" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-400">{item.time}</p>
                      {(item.type === 'wallet' || item.type === 'investment') && (
                        <Link
                          href="/transactions"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-[#0052ff] hover:underline"
                        >
                          View transactions
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </AsyncState>
    </div>
  )
}
