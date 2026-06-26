'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { NotificationListSkeleton, PageHeaderSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchNotifications } from '@/lib/data/queries'
import type { NotificationItem } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const { data: fetched = [], loading, error, reload } = useAsyncData(
    () => fetchNotifications(),
    []
  )
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    if (fetched.length) setItems(fetched)
    else if (!loading) setItems([])
  }, [fetched, loading])

  const unreadCount = items.filter((n) => !n.read).length

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
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
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={items.length === 0}
        emptyTitle="No notifications yet"
        emptyDescription="Activity from your account — deposits, investments, and updates — will appear here."
        skeleton={<NotificationListSkeleton />}
        compact
      >
        <div className="space-y-3">
          {items.map((item) => (
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
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#0052ff]" />}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}
