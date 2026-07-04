'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Shield,
  Lock,
  TrendingUp,
  Users,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { bootstrapUserProfile } from '@/lib/auth/bootstrap-profile'
import { formatGoogleAuthError, isGoogleAuthEnabled, signInWithGoogle } from '@/lib/auth/google-oauth'
import Logo from '@/components/shared/Logo'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { RegistrationStepper } from '@/components/onboarding/RegistrationStepper'
import { persistReferralCode, readReferralCodeFromCookie } from '@/lib/referral/client'
import { useResetOnPageShow } from '@/lib/hooks/useResetOnPageShow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TRUST_STATS = [
  { icon: Users, value: '12K+', labelKey: 'benefitAccess' as const },
  { icon: TrendingUp, value: '98%', labelKey: 'benefitSupport' as const },
  { icon: Shield, value: '256-bit', labelKey: 'benefitEncryption' as const },
]

function SignupForm() {
  const t = useTranslations('auth')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')?.trim() || null
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tier: 'Starter',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const resetOAuthLoading = useCallback(() => {
    setGoogleLoading(false)
    setLoading(false)
  }, [])

  useResetOnPageShow(resetOAuthLoading)

  useEffect(() => {
    setGoogleLoading(false)
  }, [])

  useEffect(() => {
    if (referralCode) {
      persistReferralCode(referralCode)
    }
  }, [referralCode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGoogleSignUp = () => {
    if (!agreedToTerms) {
      setError(t('agreeTermsGoogleRequired'))
      return
    }

    setError('')
    if (referralCode) {
      persistReferralCode(referralCode)
    }
    setGoogleLoading(true)
    signInWithGoogle('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.password) {
      setError(t('fillAllFields'))
      return
    }

    if (formData.password.length < 6) {
      setError(t('passwordMinLength'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'))
      return
    }

    if (!agreedToTerms) {
      setError(t('agreeTermsRequired'))
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            investor_tier: formData.tier,
          },
        },
      })

      if (authError) {
        setError(authError.message || t('registerFailed'))
        return
      }

      if (authData.user) {
        const profile = await bootstrapUserProfile({
          userId: authData.user.id,
          email: formData.email,
          fullName: formData.name,
          investorTier: formData.tier,
          referralCode: referralCode ?? readReferralCodeFromCookie(),
        })

        if (!profile.success) {
          setError(profile.error ?? t('profileCreationFailed'))
          return
        }

        if (authData.session) {
          router.refresh()
          router.push('/dashboard')
          return
        }

        router.push('/login?registered=1')
      }
    } catch {
      setError(t('registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors'

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Trust panel */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:flex">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.35) 0%, transparent 40%)',
              }}
            />
            <div className="relative">
              <div className="mb-8 flex items-center gap-3">
                <Logo showText={false} size={44} />
                <div>
                  <p className="text-lg font-bold tracking-tight">PrimeFx Invest</p>
                  <p className="text-xs text-primary-foreground/80">{t('signUpTitle')}</p>
                </div>
              </div>

              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {t('starterInvestorNote')}
              </div>

              <h2 className="max-w-xs text-2xl font-bold leading-tight">
                {t('signUpTitle')}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/85">
                {t('benefitAccess')}
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {TRUST_STATS.map(({ icon: Icon, value, labelKey }) => (
                  <div
                    key={labelKey}
                    className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm"
                  >
                    <Icon className="mb-2 h-4 w-4 text-primary-foreground/90" />
                    <p className="text-base font-bold">{value}</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-primary-foreground/75">
                      {t(labelKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative space-y-2.5 border-t border-white/15 pt-6">
              {[t('benefitEncryption'), t('benefitSupport'), t('benefitAccess')].map((text) => (
                <div key={text} className="flex items-start gap-2 text-sm text-primary-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Form panel */}
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
              <div className="flex items-center gap-2.5">
                <Logo showText={false} size={40} />
                <div>
                  <p className="text-base font-bold text-foreground">PrimeFx Invest</p>
                  <p className="text-xs text-muted-foreground">{t('signUpTitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                <Lock className="h-3 w-3" />
                Secure
              </div>
            </div>

            <RegistrationStepper activeStep={1} className="mb-5 sm:mb-6" />

            {referralCode ? (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
                {t('referralInvited', { code: referralCode })} {t('referralLinked')}
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-foreground">
                    {t('fullNameLabel')}
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={inputClass}
                    disabled={loading || googleLoading}
                    autoComplete="name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-foreground">
                    {t('emailLabel')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={inputClass}
                    disabled={loading || googleLoading}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-foreground">
                    {t('passwordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('passwordCreatePlaceholder')}
                      className={cn(inputClass, 'pr-10')}
                      disabled={loading || googleLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    {t('confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('confirmPasswordPlaceholder')}
                      className={cn(inputClass, 'pr-10')}
                      disabled={loading || googleLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border"
                  disabled={loading || googleLoading}
                />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {t('agreeTermsPrefix')}{' '}
                  <Link href="/terms" className="font-medium text-primary hover:underline">
                    {t('termsOfService')}
                  </Link>{' '}
                  {t('and')}{' '}
                  <Link href="/privacy" className="font-medium text-primary hover:underline">
                    {t('privacyPolicy')}
                  </Link>
                </span>
              </label>

              <Button
                type="submit"
                disabled={loading || googleLoading || !agreedToTerms}
                className="h-11 w-full text-sm font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tCommon('loading')}
                  </>
                ) : (
                  t('signUp')
                )}
              </Button>
            </form>

            {isGoogleAuthEnabled() ? (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
                  </div>
                </div>

                <GoogleSignInButton
                  disabled={loading || googleLoading}
                  onClick={handleGoogleSignUp}
                  label={googleLoading ? t('redirectingToGoogle') : t('signUpWithGoogle')}
                />
              </>
            ) : null}

            <p className="mt-5 text-center text-xs text-muted-foreground">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                {tNav('signin')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[320px] max-w-5xl items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
