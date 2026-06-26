'use client'

import { User, Mail, Phone, MapPin, Calendar, Shield, CheckCircle, AlertCircle, Edit2 } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your account and personal information.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex items-start gap-6">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=john"
            alt="Profile"
            className="h-24 w-24 rounded-full"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">John Doe</h2>
            <p className="mt-1 text-sm text-muted-foreground">Elite Investor</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                Identity Verified
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Shield className="h-4 w-4" />
                2FA Enabled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Personal Information</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Full Name</label>
            <p className="mt-2 text-foreground">John Doe</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Email Address</label>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-foreground">john.doe@example.com</p>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Phone Number</label>
            <p className="mt-2 text-foreground">+1 (555) 123-4567</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Date of Birth</label>
            <p className="mt-2 text-foreground">January 15, 1990</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-muted-foreground">Address</label>
            <p className="mt-2 text-foreground">123 Main Street, New York, NY 10001</p>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Account Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Account Type</p>
              <p className="text-sm text-muted-foreground">Elite Investor Tier</p>
            </div>
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">KYC Verification</p>
              <p className="text-sm text-muted-foreground">Identity verification status</p>
            </div>
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Verified
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Member Since</p>
              <p className="text-sm text-muted-foreground">January 15, 2023</p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Activity History</h2>
        <div className="space-y-3">
          {[
            { action: 'Login', device: 'Chrome on MacOS', time: '2 hours ago' },
            { action: 'Profile Updated', device: 'Settings', time: '1 day ago' },
            { action: 'Password Changed', device: 'Security Settings', time: '5 days ago' },
            { action: 'Login', device: 'Safari on iPhone', time: '1 week ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.device}</p>
              </div>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
