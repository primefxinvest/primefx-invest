'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Calendar, CheckCircle, Edit2, Shield, AlertCircle } from 'lucide-react'
import EditProfileModal from '@/components/profile/EditProfileModal'
import { VerifyIdentityButton } from '@/components/VerifyIdentityButton'
import { DiditVerificationPanel } from '@/components/verification/DiditVerificationPanel'
import { UserTransferIdsCard } from '@/components/profile/UserTransferIdsCard'
import { ErrorState } from '@/components/shared/data-state'
import { ProfileSkeleton } from '@/components/shared/skeletons'
import { ScrollTable } from '@/components/shared/ScrollTable'
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
  const t = useTranslations('profile')
  const tVerification = useTranslations('verification')
  const tCommon = useTranslations('common')
  const locale = useLocale()
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
      setError(err instanceof Error ? err.message : t('loadProfileFailed'))
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
        title={t('loadErrorTitle')}
        description={error ?? tCommon('tryAgain')}
        onRetry={loadProfile}
      />
    )
  }

  const isVerified = profile.isVerified || profile.kycStatus === 'Verified'

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('description')}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Edit2 className="h-4 w-4" />
          {t('editProfile')}
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-8">
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
                  {tVerification('identityVerified')}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    {tVerification('verificationPending')}
                  </div>
                  <VerifyIdentityButton
                    userId={profile.id}
                    isVerified={profile.isVerified}
                    verificationStatus={profile.verificationStatus}
                    size="sm"
                  />
                </>
              )}
              {profile.twoFactorEnabled && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  <Shield className="h-4 w-4" />
                  {t('twoFactorEnabled')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DiditVerificationPanel profile={profile} />

      <UserTransferIdsCard userId={profile.id} />

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('personalInformation')}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">{t('fullName')}</label>
            <p className="mt-2 text-foreground">{profile.fullName}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">{t('emailAddress')}</label>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-foreground">{profile.email}</p>
              {profile.emailVerified && <CheckCircle className="h-4 w-4 text-emerald-500" />}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">{t('phoneNumber')}</label>
            <p className="mt-2 text-foreground">{profile.phone || '—'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground">{t('dateOfBirth')}</label>
            <p className="mt-2 text-foreground">{profile.dateOfBirth || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-muted-foreground">{t('address')}</label>
            <p className="mt-2 text-foreground">{profile.address || '—'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('accountStatus')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">{t('accountType')}</p>
              <p className="text-sm text-muted-foreground">{profile.tier}</p>
            </div>
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {t('active')}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">{t('kycVerification')}</p>
              <p className="text-sm text-muted-foreground">{t('kycVerificationStatus')}</p>
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
              <p className="font-semibold text-foreground">{t('memberSince')}</p>
              <p className="text-sm text-muted-foreground">{profile.memberSince}</p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground sm:mb-6">{t('activityHistory')}</h2>
        <ScrollTable>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left">
                <th className="px-4 py-3 font-semibold text-muted-foreground">{t('action')}</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">{t('source')}</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">{t('date')}</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">{t('time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    {t('noActivity')}
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="transition-colors hover:bg-secondary/50">
                    <td className="px-4 py-3 font-semibold text-foreground">{activity.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{activity.device}</td>
                    <td className="px-4 py-3 text-foreground">
                      {new Intl.DateTimeFormat(locale, {
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
        </ScrollTable>
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
