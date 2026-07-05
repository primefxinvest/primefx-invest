'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Globe, DollarSign, Lock, Smartphone, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { usePathname, useRouter } from '@/i18n/navigation'
import { type AppLocale, routing } from '@/i18n/routing'
import { languageOptions as localeLanguageOptions } from '@/lib/i18n/locale-config'
import { setStoredLocale } from '@/lib/i18n/locale-storage'
import { getCurrentUser } from '@/lib/supabase'
import { getMfaStatus, type MfaStatus } from '@/lib/auth/mfa'
import TwoFactorModal from '@/components/settings/TwoFactorModal'
import ChangePasswordModal from '@/components/settings/ChangePasswordModal'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  isPushNotificationsEnabled,
  requestPushPermission,
  setPushNotificationsEnabled,
} from '@/lib/notifications/push-client'
import { cn } from '@/lib/utils'
import { fetchUserPreferences, saveUserPreferences } from '@/lib/data/queries'

import { SectionHeading } from '@/components/shared/SectionHeading'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'

function SettingRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [mfaStatus, setMfaStatus] = useState<MfaStatus>({ enabled: false, provider: null })
  const [userEmail, setUserEmail] = useState('')
  const [loadingMfa, setLoadingMfa] = useState(true)
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currency, setCurrency] = useState('usd')
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [investmentAlerts, setInvestmentAlerts] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)

  const persistPreferences = useCallback(async (patch: Parameters<typeof saveUserPreferences>[0]) => {
    const result = await saveUserPreferences(patch)
    if (!result.ok) {
      toast.error(t('saveFailed'), { description: result.error })
      return
    }
    toast.success(t('saved'))
  }, [t])

  const languageOptions = localeLanguageOptions.map((item) => ({
    value: item.value,
    label: item.nativeName,
  }))

  const currencyOptions = [
    { value: 'usd', label: 'USD' },
    { value: 'eur', label: 'EUR' },
    { value: 'gbp', label: 'GBP' },
    { value: 'jpy', label: 'JPY' },
  ]

  const visibilityOptions = [
    { value: 'public', label: t('visibilityPublic') },
    { value: 'private', label: t('visibilityPrivate') },
    { value: 'friends', label: t('visibilityFriends') },
  ]

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
    setPushEnabled(isPushNotificationsEnabled())
    fetchUserPreferences().then((prefs) => {
      setCurrency(prefs.currency)
      setProfileVisibility(prefs.profileVisibility)
      setEmailNotifications(prefs.emailNotifications)
      setInvestmentAlerts(prefs.investmentAlerts)
      setSecurityAlerts(prefs.securityAlerts)
    })
    window.addEventListener('primefx:profile-updated', loadMfaStatus)
    return () => window.removeEventListener('primefx:profile-updated', loadMfaStatus)
  }, [loadMfaStatus])

  const handleLanguageChange = (nextLocale: string) => {
    if (nextLocale === locale) return
    setStoredLocale(nextLocale as AppLocale)
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale as AppLocale })
    })
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await requestPushPermission()
      if (!result.granted) {
        toast.error(t('pushUnavailable'), { description: result.error })
        setPushEnabled(false)
        return
      }
      setPushEnabled(true)
      toast.success(t('pushEnabled'))
      return
    }

    setPushNotificationsEnabled(false)
    setPushEnabled(false)
    toast.success(t('pushDisabled'))
  }

  const notificationItems = [
    {
      key: 'email',
      label: t('emailNotifications'),
      desc: t('emailNotificationsDescription'),
      enabled: emailNotifications,
      onChange: (enabled: boolean) => {
        setEmailNotifications(enabled)
        void persistPreferences({ emailNotifications: enabled })
      },
    },
    {
      key: 'push',
      label: t('pushNotifications'),
      desc: t('pushNotificationsDescription'),
      enabled: pushEnabled,
      onChange: handlePushToggle,
    },
    {
      key: 'investment',
      label: t('investmentAlerts'),
      desc: t('investmentAlertsDescription'),
      enabled: investmentAlerts,
      onChange: (enabled: boolean) => {
        setInvestmentAlerts(enabled)
        void persistPreferences({ investmentAlerts: enabled })
      },
    },
    {
      key: 'security',
      label: t('securityAlerts'),
      desc: t('securityAlertsDescription'),
      enabled: securityAlerts,
      onChange: (enabled: boolean) => {
        setSecurityAlerts(enabled)
        void persistPreferences({ securityAlerts: enabled })
      },
    },
  ]

  return (
    <div className={pageStackClass}>
      <header>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </header>

      <section aria-label="Account protection summary" className={sectionStackClass}>
        <SectionHeading>Account protection</SectionHeading>
        <div className={cn(cardSurfaceClass, 'grid grid-cols-1 gap-3 sm:grid-cols-2')}>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('twoFactor')}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {loadingMfa ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span
                  className={cn(
                    'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    mfaStatus.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {mfaStatus.enabled ? t('active') : t('off')}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {mfaStatus.enabled ? t('twoFactorActive') : t('twoFactorInactive')}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('changePassword')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t('changePasswordDescription')}</p>
            <p className="mt-2 truncate text-sm font-medium text-foreground">{userEmail || '—'}</p>
          </div>
        </div>
      </section>

      <section aria-label="Security settings" className="space-y-3">
        <SectionHeading>{t('security')}</SectionHeading>
        <div className={cn(cardSurfaceClass, 'space-y-3')}>
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            disabled={!userEmail}
            className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{t('changePassword')}</p>
                <p className="text-sm text-muted-foreground">{t('changePasswordDescription')}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => setTwoFactorOpen(true)}
            disabled={loadingMfa}
            className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{t('twoFactor')}</p>
                <p className="text-sm text-muted-foreground">
                  {mfaStatus.enabled ? t('twoFactorActive') : t('twoFactorInactive')}
                </p>
              </div>
            </div>
            {loadingMfa ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                  mfaStatus.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                )}
              >
                {mfaStatus.enabled ? t('active') : t('off')}
              </span>
            )}
          </button>
        </div>
      </section>

      <section aria-label="Notification preferences" className="space-y-3">
        <SectionHeading>{t('notifications')}</SectionHeading>
        <div className={cn(cardSurfaceClass, 'space-y-3')}>
          {notificationItems.map((notif) => {
            const inputId = `settings-notif-${notif.key}`
            return (
            <SettingRow key={notif.key}>
              <label htmlFor={inputId} className="min-w-0 cursor-pointer">
                <p className="font-semibold text-foreground">{notif.label}</p>
                <p className="text-sm text-muted-foreground">{notif.desc}</p>
              </label>
              <input
                id={inputId}
                type="checkbox"
                className="h-5 w-5 shrink-0 self-start sm:self-center"
                checked={notif.enabled}
                onChange={(e) => notif.onChange?.(e.target.checked)}
              />
            </SettingRow>
            )
          })}
        </div>
      </section>

      <section aria-label="General settings" className="space-y-3">
        <SectionHeading>{t('general')}</SectionHeading>
        <div className={cn(cardSurfaceClass, 'space-y-3')}>
          <SettingRow>
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{t('language')}</p>
                <p className="text-sm text-muted-foreground">{t('languageDescription')}</p>
              </div>
            </div>
            <CustomSelect
              value={locale}
              onValueChange={handleLanguageChange}
              options={languageOptions}
              placeholder={tCommon('language')}
              ariaLabel={t('language')}
              className="w-full sm:w-auto sm:min-w-[10rem]"
            />
          </SettingRow>

          <SettingRow>
            <div className="flex items-start gap-3">
              <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{t('currency')}</p>
                <p className="text-sm text-muted-foreground">{t('currencyDescription')}</p>
              </div>
            </div>
            <CustomSelect
              value={currency}
              onValueChange={(value) => {
                setCurrency(value)
                void persistPreferences({ currency: value })
              }}
              options={currencyOptions}
              placeholder={t('currency')}
              ariaLabel={t('currency')}
              className="w-full sm:w-auto sm:min-w-[10rem]"
            />
          </SettingRow>
        </div>
      </section>

      <section aria-label="Privacy controls" className="space-y-3">
        <SectionHeading>{t('privacy')}</SectionHeading>
        <div className={cardSurfaceClass}>
          <SettingRow>
            <div>
              <p className="font-semibold text-foreground">{t('profileVisibility')}</p>
              <p className="text-sm text-muted-foreground">{t('profileVisibilityDescription')}</p>
            </div>
            <CustomSelect
              value={profileVisibility}
              onValueChange={(value) => {
                setProfileVisibility(value)
                void persistPreferences({ profileVisibility: value })
              }}
              options={visibilityOptions}
              placeholder={t('profileVisibility')}
              ariaLabel={t('profileVisibility')}
              size="sm"
              className="w-full sm:w-auto sm:min-w-[10rem]"
            />
          </SettingRow>
        </div>
      </section>

      <section aria-label="Account deletion" className="space-y-3">
        <SectionHeading>{t('dangerZone')}</SectionHeading>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
            <div>
              <p className="font-semibold text-red-700">{t('deleteAccount')}</p>
              <p className="mt-1 text-sm text-red-600/80">{t('deleteAccountWarning')}</p>
              <p className="mt-2 text-xs font-semibold text-red-600/60">Coming Soon</p>
            </div>
          </div>
        </div>
      </section>

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
