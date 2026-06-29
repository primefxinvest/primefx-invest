'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { bootstrapUserProfile } from '@/lib/auth/bootstrap-profile'
import { formatGoogleAuthError, isGoogleAuthEnabled, signInWithGoogle } from '@/lib/auth/google-oauth'
import Logo from '@/components/shared/Logo'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { RegistrationStepper } from '@/components/onboarding/RegistrationStepper'
import { persistReferralCode, readReferralCodeFromCookie } from '@/lib/referral/client'

import { useResetOnPageShow } from '@/lib/hooks/useResetOnPageShow'

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
    setFormData(prev => ({ ...prev, [name]: value }))
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
    
    // Validation
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
      // Create Supabase account
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

      // Create user profile in database
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
    } catch (err) {
      setError(t('registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo showText={false} size={64} />
        </div>
        <h1 className="text-2xl font-bold">PrimeFx Invest</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('signUpTitle')}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t('starterInvestorNote')}</p>
      </div>

      <RegistrationStepper activeStep={1} className="mb-8" />

      {referralCode ? (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {t('referralInvited', { code: referralCode })} {t('referralLinked')}
        </div>
      ) : null}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            {t('fullNameLabel')}
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
            disabled={loading || googleLoading}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            {t('emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
            disabled={loading || googleLoading}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
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
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
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
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Terms Checkbox */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="rounded border border-border w-4 h-4 mt-1 cursor-pointer"
            disabled={loading || googleLoading}
          />
          <span className="text-sm text-muted-foreground">
            {t('agreeTermsPrefix')}{' '}
            <Link href="/terms" className="text-primary hover:underline">
              {t('termsOfService')}
            </Link>
            {' '}{t('and')}{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              {t('privacyPolicy')}
            </Link>
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || googleLoading || !agreedToTerms}
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {tCommon('loading')}
            </>
          ) : (
            t('signUp')
          )}
        </button>
      </form>

      {isGoogleAuthEnabled() ? (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">{t('orContinueWith')}</span>
            </div>
          </div>

          <GoogleSignInButton
            disabled={loading || googleLoading}
            onClick={handleGoogleSignUp}
            label={googleLoading ? t('redirectingToGoogle') : t('signUpWithGoogle')}
          />
        </>
      ) : null}

      {/* Benefits */}
      <div className="mt-6 space-y-2 p-4 bg-primary/5 rounded-lg">
        <div className="flex gap-2 text-sm">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <span>{t('benefitEncryption')}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <span>{t('benefitSupport')}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <span>{t('benefitAccess')}</span>
        </div>
      </div>

      {/* Sign In Link */}
      <p className="text-center text-muted-foreground text-sm mt-6">
        {t('alreadyHaveAccount')}{' '}
        <Link href="/login" className="text-primary hover:underline font-semibold">
          {tNav('signin')}
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-card p-8 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
