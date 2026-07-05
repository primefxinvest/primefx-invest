'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'primefx-academy-learning-reminder'

export type LearningReminderSettings = {
  enabled: boolean
  time: string
}

const DEFAULT_SETTINGS: LearningReminderSettings = {
  enabled: true,
  time: '19:00',
}

function readSettings(): LearningReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<LearningReminderSettings>
    return {
      enabled: Boolean(parsed.enabled),
      time: typeof parsed.time === 'string' && /^\d{2}:\d{2}$/.test(parsed.time) ? parsed.time : DEFAULT_SETTINGS.time,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useLearningReminder() {
  const [settings, setSettings] = useState<LearningReminderSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSettings(readSettings())
    setHydrated(true)
  }, [])

  const setEnabled = useCallback(
    (enabled: boolean) => {
      setSettings((current) => {
        const next = { ...current, enabled }
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        }
        return next
      })
    },
    []
  )

  const setTime = useCallback((time: string) => {
    setSettings((current) => {
      const next = { ...current, time }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  return {
    settings,
    hydrated,
    setEnabled,
    setTime,
  }
}
