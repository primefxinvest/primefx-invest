const PUSH_PREF_KEY = 'primefx_push_notifications_enabled'

export function isPushNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PUSH_PREF_KEY) === 'true'
}

export function setPushNotificationsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PUSH_PREF_KEY, enabled ? 'true' : 'false')
}

export async function requestPushPermission(): Promise<{
  granted: boolean
  error?: string
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, error: 'Push notifications are not supported in this browser.' }
  }

  if (Notification.permission === 'granted') {
    setPushNotificationsEnabled(true)
    return { granted: true }
  }

  if (Notification.permission === 'denied') {
    return {
      granted: false,
      error: 'Notifications are blocked. Enable them in your browser site settings.',
    }
  }

  const permission = await Notification.requestPermission()
  const granted = permission === 'granted'
  setPushNotificationsEnabled(granted)

  if (!granted) {
    return { granted: false, error: 'Notification permission was not granted.' }
  }

  return { granted: true }
}

export function showBrowserNotification(input: {
  title: string
  body: string
  tag?: string
  url?: string
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (!isPushNotificationsEnabled() || Notification.permission !== 'granted') return

  const notification = new Notification(input.title, {
    body: input.body,
    tag: input.tag,
    icon: '/icon.png',
  })

  notification.onclick = () => {
    window.focus()
    if (input.url) {
      window.location.href = input.url
    }
    notification.close()
  }
}
