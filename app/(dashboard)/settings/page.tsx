'use client'

import { useCallback, useEffect, useState } from 'react'
import { Globe, Moon, DollarSign, Lock, Bell, Eye, Smartphone, LogOut, ChevronRight, Loader2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase'
import { getMfaStatus, type MfaStatus } from '@/lib/auth/mfa'
import TwoFactorModal from '@/components/settings/TwoFactorModal'
import ChangePasswordModal from '@/components/settings/ChangePasswordModal'
import { CustomSelect } from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
]

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'auto', label: 'Auto' },
  { value: 'dark', label: 'Dark' },
]

const CURRENCY_OPTIONS = [
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'jpy', label: 'JPY' },
]

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'friends', label: 'Friends Only' },
]

export default function SettingsPage() {
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>({ enabled: false, provider: null })
  const [userEmail, setUserEmail] = useState('')
  const [loadingMfa, setLoadingMfa] = useState(true)
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('auto')
  const [currency, setCurrency] = useState('usd')
  const [profileVisibility, setProfileVisibility] = useState('public')

  const loadMfaStatus = useCallback(async () => {
    setLoadingMfa(true)
    const { data: user } = await getCurrentUser()
    setUserEmail(user?.email ?? '')
    const status = await getMfaStatus()
    setMfaStatus(status)
    setLoadingMfa(false)
  }, [])

  useEffect(() => {
    loadMfaStatus()
    window.addEventListener('primefx:profile-updated', loadMfaStatus)
    return () => window.removeEventListener('primefx:profile-updated', loadMfaStatus)
  }, [loadMfaStatus])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Customize your account preferences and security settings.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">General Settings</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Globe className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Language</p>
                <p className="text-sm text-muted-foreground">Choose your preferred language</p>
              </div>
            </div>
            <CustomSelect
              value={language}
              onValueChange={setLanguage}
              options={LANGUAGE_OPTIONS}
              placeholder="Language"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Moon className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">Light or dark mode</p>
              </div>
            </div>
            <CustomSelect
              value={theme}
              onValueChange={setTheme}
              options={THEME_OPTIONS}
              placeholder="Theme"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <DollarSign className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Currency</p>
                <p className="text-sm text-muted-foreground">Default display currency</p>
              </div>
            </div>
            <CustomSelect
              value={currency}
              onValueChange={setCurrency}
              options={CURRENCY_OPTIONS}
              placeholder="Currency"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Security Settings</h2>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            disabled={!userEmail}
            className="flex w-full items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <Lock className="mt-1 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password securely</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => setTwoFactorOpen(true)}
            disabled={loadingMfa}
            className="flex w-full items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <Smartphone className="mt-1 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {mfaStatus.enabled
                    ? 'Protected with an authenticator app'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            {loadingMfa ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <span
                className={cn(
                  'inline-block rounded-full px-3 py-1 text-xs font-semibold',
                  mfaStatus.enabled
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {mfaStatus.enabled ? 'Active' : 'Off'}
              </span>
            )}
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
          >
            <div className="flex items-start gap-3">
              <Eye className="mt-1 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your login sessions</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Notification Preferences</h2>
        <div className="space-y-4">
          {[
            { label: 'Email Notifications', desc: 'Receive updates via email' },
            { label: 'Push Notifications', desc: 'Browser push notifications' },
            { label: 'Investment Alerts', desc: 'Alerts for investment updates' },
            { label: 'Security Alerts', desc: 'Important account security alerts' },
          ].map((notif) => (
            <div key={notif.label} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-semibold text-foreground">{notif.label}</p>
                <p className="text-sm text-muted-foreground">{notif.desc}</p>
              </div>
              <input type="checkbox" className="h-5 w-5" defaultChecked />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Privacy Controls</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Profile Visibility</p>
              <p className="text-sm text-muted-foreground">Show profile in community</p>
            </div>
            <CustomSelect
              value={profileVisibility}
              onValueChange={setProfileVisibility}
              options={VISIBILITY_OPTIONS}
              placeholder="Visibility"
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Data Collection</p>
              <p className="text-sm text-muted-foreground">Allow analytics and improvements</p>
            </div>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-red-500 bg-red-50 p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-red-600">Danger Zone</h2>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
        >
          <LogOut className="h-4 w-4" />
          Delete Account
        </button>
        <p className="mt-3 text-sm text-red-600">
          This action cannot be undone. All your data will be permanently deleted.
        </p>
      </div>

      <TwoFactorModal
        open={twoFactorOpen}
        onClose={() => setTwoFactorOpen(false)}
        onStatusChange={setMfaStatus}
        userEmail={userEmail}
        initialEnabled={mfaStatus.enabled}
      />

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        userEmail={userEmail}
      />
    </div>
  )
}
