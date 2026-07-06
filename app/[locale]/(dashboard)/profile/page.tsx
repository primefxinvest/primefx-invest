'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Calendar,
  CheckCircle,
  Edit2,
  Shield,
  ChevronRight,
} from 'lucide-react'
import EditProfileModal from '@/components/profile/EditProfileModal'
import { DiditVerificationPanel } from '@/components/verification/DiditVerificationPanel'
import { EmailVerificationSection } from '@/components/profile/EmailVerificationSection'
import { UserTransferIdsCard } from '@/components/profile/UserTransferIdsCard'
import { ErrorState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { ProfileSkeleton } from '@/components/shared/skeletons'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { getProfileActivity, getUserProfile, logProfileActivity } from '@/lib/profile/actions'
import type { ProfileActivity, UserProfile, UserVerificationStatus } from '@/lib/profile/types'
import { getCurrentUser } from '@/lib/supabase'
import { useUserVerificationRealtime } from '@/lib/hooks/useVerificationRealtime'
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
  const tCommon = useTranslations('common')
  const tSettings = useTranslations('settings')
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
  }, [t])

  useEffect(() => {
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
    window.addEventListener('primefx:verification-updated', handleUpdate)
    window.addEventListener('primefx:email-verified', handleUpdate)
    const handleOpenEdit = () => setEditOpen(true)
    window.addEventListener('primefx:open-edit-profile', handleOpenEdit)
    return () => {
      window.removeEventListener('primefx:profile-updated', handleUpdate)
      window.removeEventListener('primefx:verification-updated', handleUpdate)
      window.removeEventListener('primefx:email-verified', handleUpdate)
      window.removeEventListener('primefx:open-edit-profile', handleOpenEdit)
    }
  }, [loadProfile])

  useUserVerificationRealtime({
    userId: profile?.id,
    onUpdate: (update) => {
      setProfile((current) => {
        if (!current) return current

        const verificationStatus = update.verificationStatus as UserVerificationStatus
        const isVerified = update.isVerified || verificationStatus === 'approved'

        return {
          ...current,
          isVerified,
          verificationStatus,
          kycStatus: isVerified
            ? 'Verified'
            : verificationStatus === 'declined'
              ? 'Rejected'
              : 'Pending',
          verifiedAt: isVerified && !current.verifiedAt ? new Date().toISOString() : current.verifiedAt,
        }
      })
    },
  })

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


  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Edit2 className="h-4 w-4" />
          {t('editProfile')}
        </button>
      </header>

      <section aria-label="Profile overview" className={cn(cardSurfaceClass, 'sm:p-8')}>
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="h-20 w-20 shrink-0 rounded-full border border-border bg-gray-50 object-cover sm:h-24 sm:w-24"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">{profile.fullName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{profile.tier}</p>
            <p className="mt-1 text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </section>

      <section aria-label="Identity verification" className={sectionStackClass}>
        <DiditVerificationPanel profile={profile} />
      </section>

      <section aria-label="Security" className={sectionStackClass}>
        <SectionHeading>Security</SectionHeading>
        <div className={cardSurfaceClass}>
          <div
            className={cn(
              'rounded-xl border p-4',
              profile.twoFactorEnabled ? 'border-blue-200 bg-blue-50/50' : 'border-border bg-background'
            )}
          >
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{tSettings('twoFactor')}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.twoFactorEnabled
                    ? tSettings('twoFactorActive')
                    : tSettings('twoFactorInactive')}
                </p>
                <span
                  className={cn(
                    'mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    profile.twoFactorEnabled
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {profile.twoFactorEnabled ? tSettings('active') : tSettings('off')}
                </span>
              </div>
            </div>
            <Link
              href="/settings"
              className="mt-3 flex items-center gap-1 pl-8 text-xs font-semibold text-primary hover:underline"
            >
              Manage security
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <UserTransferIdsCard userId={profile.id} />

      <EmailVerificationSection />

      <section aria-label="Personal information" className={sectionStackClass}>
        <SectionHeading>{t('personalInformation')}</SectionHeading>
        <div className={cardSurfaceClass}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('fullName')}
              </label>
              <p className="mt-2 text-sm text-foreground">{profile.fullName}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('emailAddress')}
              </label>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-sm text-foreground">{profile.email}</p>
                {profile.emailVerified ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                ) : null}
                {profile.emailVerified ? (
                  <span className="sr-only">Verified</span>
                ) : null}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('phoneNumber')}
              </label>
              <p className="mt-2 text-sm text-foreground">{profile.phone || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('dateOfBirth')}
              </label>
              <p className="mt-2 text-sm text-foreground">{profile.dateOfBirth || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('address')}
              </label>
              <p className="mt-2 text-sm text-foreground">{profile.address || '—'}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Account status" className={sectionStackClass}>
        <SectionHeading>{t('accountStatus')}</SectionHeading>
        <div className={cardSurfaceClass}>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">{t('accountType')}</p>
                <p className="text-sm text-muted-foreground">{profile.tier}</p>
              </div>
              <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {t('active')}
              </span>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">{t('memberSince')}</p>
                <p className="text-sm text-muted-foreground">{profile.memberSince}</p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Activity history" className={sectionStackClass}>
        <SectionHeading>{t('activityHistory')}</SectionHeading>
        <div className={cardSurfaceClass}>
          <ScrollTable ariaLabel={t('activityHistory')}>
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary text-left">
                  <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">{t('action')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">{t('source')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">{t('date')}</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-muted-foreground">{t('time')}</th>
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
      </section>

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
