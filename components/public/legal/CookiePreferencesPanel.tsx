'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'primefx-cookie-preferences'

type CookiePrefs = {
  analytics: boolean
  preferences: boolean
}

const DEFAULT_PREFS: CookiePrefs = { analytics: true, preferences: true }

function loadPrefs(): CookiePrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function CookiePreferencesPanel() {
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPrefs(loadPrefs())
  }, [])

  const save = (next: CookiePrefs) => {
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-gray-900">Cookie Preferences</h2>
      <p className="mt-2 text-sm text-gray-600">
        Manage non-essential cookies. Essential and security cookies cannot be disabled.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Essential cookies</p>
            <p className="text-xs text-gray-500">Required for platform operation</p>
          </div>
          <span className="text-xs font-medium text-emerald-600">Always on</span>
        </div>

        {(
          [
            { key: 'analytics' as const, label: 'Analytics cookies', desc: 'Usage statistics' },
            { key: 'preferences' as const, label: 'Preference cookies', desc: 'Language & settings' },
          ] as const
        ).map(({ key, label, desc }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) => save({ ...prefs, [key]: e.target.checked })}
              className="size-4 rounded border-gray-300 text-[#0052ff] focus:ring-[#0052ff]"
            />
          </label>
        ))}
      </div>

      <p
        className={cn(
          'mt-4 flex items-center gap-1.5 text-sm text-emerald-600 transition-opacity',
          saved ? 'opacity-100' : 'opacity-0'
        )}
        role="status"
      >
        <CheckCircle2 className="size-4" aria-hidden />
        Preferences saved
      </p>
    </div>
  )
}
