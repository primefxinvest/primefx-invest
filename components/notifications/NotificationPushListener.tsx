'use client'

import { useEffect, useRef } from 'react'
import { fetchNotifications } from '@/lib/data/queries'
import { isPushNotificationsEnabled, showBrowserNotification } from '@/lib/notifications/push-client'

export function NotificationPushListener() {
  const seenIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)

  useEffect(() => {
    let active = true

    async function poll() {
      if (!isPushNotificationsEnabled()) return

      const items = await fetchNotifications()
      if (!active) return

      if (!initialized.current) {
        items.forEach((item) => seenIds.current.add(item.id))
        initialized.current = true
        return
      }

      for (const item of items) {
        if (seenIds.current.has(item.id) || item.read) continue
        seenIds.current.add(item.id)
        showBrowserNotification({
          title: item.title,
          body: item.message,
          tag: item.id,
          url: '/notifications',
        })
      }
    }

    poll()
    const interval = window.setInterval(poll, 45_000)
    window.addEventListener('primefx:profile-updated', poll)

    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('primefx:profile-updated', poll)
    }
  }, [])

  return null
}
