'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Gift, Loader2, Lock, Mail, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isGoogleAuthEnabled, signInWithGoogle } from '@/lib/auth/google-oauth'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthFormShell } from '@/components/auth/AuthFormShell'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthSecurityNotice } from '@/components/auth/AuthSecurityNotice'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { persistReferralCode, readReferralCodeFromCookie } from '@/lib/referral/client'
import { useResetOnPageShow } from '@/lib/hooks/useResetOnPageShow'
import { Button } from '@/components/ui/button'
import { ensureErrorMessage, mapSignupErrorMessage } from '@/lib/auth/signup-errors'
import { saveVerificationPending } from '@/lib/auth/verification-pending'

type SignupApiResponse = {
  success: boolean
  message?: string
  data?: { userId?: string }
  error?: { code?: string; detail?: string; message?: string }
}

async function postSignupJson(url: string, body: Record<string, unknown>): Promise<SignupApiResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    console.error('[signup] non-json response', { url, status: response.status, contentType })
    throw new Error(
      response.ok
        ? 'Signup service is temporarily unavailable. Please try again.'
        : `Signup service is temporarily unavailable. Please try again (HTTP ${response.status}).`
    )
  }

  const payload = (await response.json()) as SignupApiResponse
  return payload
}

function messageFromApi(payload: SignupApiResponse, fallback: string): string {
  return ensureErrorMessage(
    payload.message ?? payload.error?.detail ?? payload.error?.message ?? payload.error,
    fallback
  )
}

function SignupForm() {
  const t = useTranslations('auth')
  const tNav = useTranslations('nav')
  const searchParams = useSearchParams()
  const referralFromUrl = searchParams.get('ref')?.trim() || ''
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: referralFromUrl,
    tier: 'Starter',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const activeReferralCode = useMemo(
    () => formData.referralCode.trim() || referralFromUrl || null,
    [formData.referralCode, referralFromUrl]
  )

  const resetOAuthLoading = useCallback(() => {
    setGoogleLoading(false)
    setLoading(false)
  }, [])

  useResetOnPageShow(resetOAuthLoading)

  useEffect(() => {
    setGoogleLoading(false)
  }, [])

  useEffect(() => {
    if (referralFromUrl) {
      persistReferralCode(referralFromUrl)
      setFormData((prev) => ({ ...prev, referralCode: referralFromUrl }))
    }
  }, [referralFromUrl])

  useEffect(() => {
    const code = formData.referralCode.trim()
    if (code) {
      persistReferralCode(code)
    }
  }, [formData.referralCode])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const showError = (value: unknown) => {
    const message = ensureErrorMessage(value, 'Signup failed. Please try again.')
    setError(message)
  }

  const handleGoogleSignUp = () => {
    if (!agreedToTerms) {
      setError(t('agreeTermsGoogleRequired'))
      return
    }

    setError('')
    if (activeReferralCode) {
      persistReferralCode(activeReferralCode)
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
      const email = formData.email.trim().toLowerCase()
      const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=/dashboard&verify=1`

      console.info('[signup] starting signUp', { email })

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          emailRedirectTo,
          data: {
            full_name: formData.name,
            investor_tier: formData.tier,
          },
        },
      })

      if (authError) {
        console.error('[signup] supabase.auth.signUp failed', {
          message: authError.message,
          code: authError.code,
          status: authError.status,
        })
        showError(mapSignupErrorMessage(authError.message))
        return
      }

      if (!authData.user) {
        console.error('[signup] signUp returned no user', { authData })
        showError('Signup did not return a user record. Please try again.')
        return
      }

      // Supabase returns a user with empty identities when the email is already registered.
      if (authData.user.identities?.length === 0) {
        console.error('[signup] duplicate email signup attempt', {
          email,
          userId: authData.user.id,
        })
        showError('An account with this email already exists. Please sign in instead.')
        return
      }

      console.info('[signup] auth user created', {
        userId: authData.user.id,
        hasSession: Boolean(authData.session),
        emailConfirmedAt: authData.user.email_confirmed_at,
      })

      const profile = await postSignupJson('/api/auth/bootstrap-profile', {
        userId: authData.user.id,
        email,
        fullName: formData.name,
        investorTier: formData.tier,
        referralCode: activeReferralCode ?? readReferralCodeFromCookie(),
      })

      if (!profile.success) {
        console.error('[signup] bootstrap profile failed', profile)
        showError(messageFromApi(profile, t('profileCreationFailed')))
        return
      }

      console.info('[bootstrap] profile ready', { userId: authData.user.id })

      // Option A: never keep an automatic pre-verification session.
      if (authData.session) {
        console.info('[session] signing out pre-verification session')
        await supabase.auth.signOut({ scope: 'local' })
      }

      void fetch('/api/auth/record-verification-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: authData.user.id }),
      }).catch((recordError) => {
        console.error('[signup] record-verification-sent failed (non-blocking)', recordError)
      })

      saveVerificationPending({ userId: authData.user.id, email })

      console.info('[signup] redirecting to confirm-email', { email })
      window.location.assign(
        `/auth/confirm-email?email=${encodeURIComponent(email)}`
      )
    } catch (err) {
      console.error('[signup] unexpected error', err)
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || googleLoading
  const safeError = error && error !== '{}' ? error : ''

  return (
    <AuthFormShell
      title={t('signUpTitle')}
      subtitle={
        <>
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {tNav('signin')}
          </Link>
        </>
      }
      footer={<AuthSecurityNotice securityText={t('securityNotice')} />}
    >
      {activeReferralCode ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
          {t('referralInvited', { code: activeReferralCode })} {t('referralLinked')}
        </div>
      ) : null}

      {safeError ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {safeError}
        </div>
      ) : null}

      {isGoogleAuthEnabled() ? (
        <GoogleSignInButton
          disabled={busy}
          onClick={handleGoogleSignUp}
          label={googleLoading ? t('redirectingToGoogle') : t('continueWithGoogle')}
        />
      ) : null}

      {isGoogleAuthEnabled() ? <AuthDivider label={t('continueWithEmail')} /> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          id="name"
          name="name"
          label={t('fullNameLabel')}
          value={formData.name}
          onChange={(value) => handleChange('name', value)}
          placeholder={t('fullNamePlaceholder')}
          icon={<User className="h-4 w-4" />}
          disabled={busy}
          autoComplete="name"
        />

        <AuthInput
          id="email"
          name="email"
          label={t('emailAddressLabel')}
          type="email"
          value={formData.email}
          onChange={(value) => handleChange('email', value)}
          placeholder={t('emailPlaceholder')}
          icon={<Mail className="h-4 w-4" />}
          disabled={busy}
          autoComplete="email"
        />

        <div>
          <AuthInput
            id="password"
            name="password"
            label={t('passwordLabel')}
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(value) => handleChange('password', value)}
            placeholder={t('passwordCreatePlaceholder')}
            icon={<Lock className="h-4 w-4" />}
            disabled={busy}
            autoComplete="new-password"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <PasswordStrengthMeter password={formData.password} />
        </div>

        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          label={t('confirmPasswordLabel')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
          placeholder={t('confirmPasswordPlaceholder')}
          icon={<Lock className="h-4 w-4" />}
          disabled={busy}
          autoComplete="new-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <AuthInput
          id="referralCode"
          name="referralCode"
          label={t('referralCodeLabel')}
          value={formData.referralCode}
          onChange={(value) => handleChange('referralCode', value)}
          placeholder={t('referralCodePlaceholder')}
          icon={<Gift className="h-4 w-4" />}
          disabled={busy}
          autoComplete="off"
        />

        <label className="flex min-h-11 cursor-pointer items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer rounded border-border"
            disabled={busy}
          />
          <span className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
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

        <Button type="submit" disabled={busy || !agreedToTerms} className="h-11 w-full text-sm font-semibold">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating your account…
            </>
          ) : (
            t('createAccount')
          )}
        </Button>
      </form>
    </AuthFormShell>
  )
}

export function SignupFormClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
