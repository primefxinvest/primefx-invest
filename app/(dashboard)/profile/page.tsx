'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, CheckCircle, Edit2, Shield, AlertCircle } from 'lucide-react'
import EditProfileModal from '@/components/profile/EditProfileModal'
import { KycSubmissionPanel } from '@/components/kyc/KycSubmissionPanel'
import { ErrorState } from '@/components/shared/data-state'
import { ProfileSkeleton } from '@/components/shared/skeletons'
import { getProfileActivity, getUserProfile, logProfileActivity } from '@/lib/profile/actions'
import type { ProfileActivity, UserProfile } from '@/lib/profile/types'
import { getCurrentUser } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function detectDevice() {
  if (typeof navigator === 'undefined') return 'Web Browser'
  const ua = navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) return 'Safari on iPhone'
  if (/Mac/i.test(ua)) return 'Chrome on MacOS'
  if (/Windows/i.test(ua)) return 'Chrome on Windows'
  return 'Web Browser'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activities, setActivities] = useState<ProfileActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const loadProfile = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
    }
    setError(null)
    try {
      const [profileData, activityData] = await Promise.all([
        getUserProfile(),
        getProfileActivity(),
      ])
      setProfile(profileData)
      setActivities(activityData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let active = true

    async function init() {
      const { data: authUser } = await getCurrentUser()
      if (authUser) {
        const sessionKey = `primefx_login_logged_${authUser.id}`
        if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, '1')
          void logProfileActivity(authUser.id, 'Login', detectDevice())
        }
      }
      await loadProfile()
    }

    init()

    const handleUpdate = () => {
      loadProfile({ silent: true })
    }

    window.addEventListener('primefx:profile-updated', handleUpdate)
    const handleOpenEdit = () => setEditOpen(true)
    window.addEventListener('primefx:open-edit-profile', handleOpenEdit)
    return () => {
      active = false
      window.removeEventListener('primefx:profile-updated', handleUpdate)
      window.removeEventListener('primefx:open-edit-profile', handleOpenEdit)
    }
  }, [loadProfile])

  if (loading) {
    return <ProfileSkeleton />
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="Could not load profile"
        description={error ?? 'Please try again.'}
        onRetry={loadProfile}
      />
    )
  }

  const isVerified = profile.kycStatus === 'Verified'

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your account and personal information.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="h-24 w-24 rounded-full border border-border bg-gray-50 object-cover"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">{profile.fullName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{profile.tier}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isVerified ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  Identity Verified
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  Verification Pending
                </div>
              )}
              {profile.twoFactorEnabled && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  <Shield className="h-4 w-4" />
                  2FA Enabled
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <KycSubmissionPanel profile={profile} />

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Personal Information</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Full Name</label>
            <p className="mt-2 text-foreground">{profile.fullName}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Email Address</label>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-foreground">{profile.email}</p>
              {profile.emailVerified && <CheckCircle className="h-4 w-4 text-emerald-500" />}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Phone Number</label>
            <p className="mt-2 text-foreground">{profile.phone || '—'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Date of Birth</label>
            <p className="mt-2 text-foreground">{profile.dateOfBirth || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-muted-foreground">Address</label>
            <p className="mt-2 text-foreground">{profile.address || '—'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Account Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Account Type</p>
              <p className="text-sm text-muted-foreground">{profile.tier}</p>
            </div>
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">KYC Verification</p>
              <p className="text-sm text-muted-foreground">Identity verification status</p>
            </div>
            <span
              className={cn(
                'inline-block rounded-full px-3 py-1 text-sm font-semibold',
                isVerified
                  ? 'bg-emerald-100 text-emerald-700'
                  : profile.kycStatus === 'Rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              )}
            >
              {profile.kycStatus}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">Member Since</p>
              <p className="text-sm text-muted-foreground">{profile.memberSince}</p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Activity History</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left">
                <th className="px-4 py-3 font-semibold text-muted-foreground">Action</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Source</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="transition-colors hover:bg-secondary/50">
                    <td className="px-4 py-3 font-semibold text-foreground">{activity.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{activity.device}</td>
                    <td className="px-4 py-3 text-foreground">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(activity.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{activity.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditProfileModal
        profile={profile}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => {
          setProfile(updated)
          getProfileActivity().then(setActivities)
        }}
      />
    </div>
  )
}
