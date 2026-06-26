'use client'

import { Globe, Moon, DollarSign, Lock, Bell, Eye, Smartphone, LogOut } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Customize your account preferences and security settings.</p>
      </div>

      {/* General Settings */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">General Settings</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold text-foreground">Language</p>
                <p className="text-sm text-muted-foreground">Choose your preferred language</p>
              </div>
            </div>
            <select className="rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none">
              <option selected>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Moon className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">Light or dark mode</p>
              </div>
            </div>
            <select className="rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none">
              <option>Light</option>
              <option selected>Auto</option>
              <option>Dark</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold text-foreground">Currency</p>
                <p className="text-sm text-muted-foreground">Default display currency</p>
              </div>
            </div>
            <select className="rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none">
              <option selected>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>JPY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Security Settings</h2>
        <div className="space-y-4">
          <button className="flex w-full items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary transition-colors">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary mt-1" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your password</p>
              </div>
            </div>
          </button>

          <button className="flex w-full items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary transition-colors">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-primary mt-1" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Enabled via authenticator app</p>
              </div>
            </div>
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Active
            </span>
          </button>

          <button className="flex w-full items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary transition-colors">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-1" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your login sessions</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Notification Preferences</h2>
        <div className="space-y-4">
          {[
            { label: 'Email Notifications', desc: 'Receive updates via email' },
            { label: 'Push Notifications', desc: 'Browser push notifications' },
            { label: 'Investment Alerts', desc: 'Alerts for investment updates' },
            { label: 'Security Alerts', desc: 'Important account security alerts' },
          ].map((notif, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-semibold text-foreground">{notif.label}</p>
                <p className="text-sm text-muted-foreground">{notif.desc}</p>
              </div>
              <input type="checkbox" className="h-5 w-5" defaultChecked />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Privacy Controls</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Profile Visibility</p>
              <p className="text-sm text-muted-foreground">Show profile in community</p>
            </div>
            <select className="rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none">
              <option selected>Public</option>
              <option>Private</option>
              <option>Friends Only</option>
            </select>
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

      {/* Danger Zone */}
      <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950 p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        <button className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 transition-colors">
          <LogOut className="h-4 w-4" />
          Delete Account
        </button>
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">This action cannot be undone. All your data will be permanently deleted.</p>
      </div>
    </div>
  )
}
