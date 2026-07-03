'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Globe, Moon, DollarSign, Lock, Eye, Smartphone, LogOut, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePathname, useRouter } from '@/i18n/navigation'
import { type AppLocale, routing } from '@/i18n/routing'
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
  const [theme, setTheme] = useState('auto')
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

  const languageOptions = routing.locales.map((value) => ({
    value,
    label:
      value === 'en'
        ? 'English'
        : value === 'es'
          ? 'Spanish'
          : value === 'de'
            ? 'German'
            : 'French',
  }))

  const themeOptions = [
    { value: 'light', label: t('themeLight') },
    { value: 'auto', label: t('themeAuto') },
    { value: 'dark', label: t('themeDark') },
  ]

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
      setTheme(prefs.theme)
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('description')}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('general')}</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Globe className="mt-1 h-5 w-5 text-primary" />
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
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Moon className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{t('theme')}</p>
                <p className="text-sm text-muted-foreground">{t('themeDescription')}</p>
              </div>
            </div>
            <CustomSelect
              value={theme}
              onValueChange={(value) => {
                setTheme(value)
                void persistPreferences({ theme: value })
              }}
              options={themeOptions}
              placeholder={t('theme')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <DollarSign className="mt-1 h-5 w-5 text-primary" />
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
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('security')}</h2>
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
                <p className="font-semibold text-foreground">{t('changePassword')}</p>
                <p className="text-sm text-muted-foreground">{t('changePasswordDescription')}</p>
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
                <p className="font-semibold text-foreground">{t('twoFactor')}</p>
                <p className="text-sm text-muted-foreground">
                  {mfaStatus.enabled ? t('twoFactorActive') : t('twoFactorInactive')}
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
                {mfaStatus.enabled ? t('active') : t('off')}
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
                <p className="font-semibold text-foreground">{t('activeSessions')}</p>
                <p className="text-sm text-muted-foreground">{t('activeSessionsDescription')}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('notifications')}</h2>
        <div className="space-y-4">
          {notificationItems.map((notif) => (
            <div key={notif.key} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-semibold text-foreground">{notif.label}</p>
                <p className="text-sm text-muted-foreground">{notif.desc}</p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={notif.enabled}
                onChange={(e) => notif.onChange?.(e.target.checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">{t('privacy')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
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
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-semibold text-foreground">{t('dataCollection')}</p>
              <p className="text-sm text-muted-foreground">{t('dataCollectionDescription')}</p>
            </div>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-red-500 bg-red-50 p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-red-600">{t('dangerZone')}</h2>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
        >
          <LogOut className="h-4 w-4" />
          {t('deleteAccount')}
        </button>
        <p className="mt-3 text-sm text-red-600">{t('deleteAccountWarning')}</p>
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
