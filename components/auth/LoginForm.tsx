'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { formatGoogleAuthError, isGoogleAuthEnabled, signInWithGoogle } from '@/lib/auth/google-oauth'
import { needsMfaChallenge } from '@/lib/auth/mfa'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'
import { sanitizeRedirectPath } from '@/lib/auth/session'
import { setRememberSessionPreference } from '@/lib/auth/remember-session-client'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthFormShell } from '@/components/auth/AuthFormShell'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthSecurityNotice } from '@/components/auth/AuthSecurityNotice'
import { useResetOnPageShow } from '@/lib/hooks/useResetOnPageShow'
import { Button } from '@/components/ui/button'
import { ensureErrorMessage } from '@/lib/auth/signup-errors'
import { saveVerificationPending } from '@/lib/auth/verification-pending'

type UnverifiedHintResponse = {
  success: boolean
  data?: { unverified?: boolean; userId?: string; email?: string }
}

async function checkUnverifiedHint(email: string): Promise<UnverifiedHintResponse['data'] | null> {
  try {
    const response = await fetch('/api/auth/unverified-login-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return null
    const payload = (await response.json()) as UnverifiedHintResponse
    return payload.data ?? null
  } catch {
    return null
  }
}

function LoginForm() {
  const t = useTranslations('auth')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirect'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const resetOAuthLoading = useCallback(() => {
    setGoogleLoading(false)
    setLoading(false)
  }, [])

  useResetOnPageShow(resetOAuthLoading)

  useEffect(() => {
    setGoogleLoading(false)
  }, [])

  const oauthError = searchParams.get('error')
  const oauthMessage = searchParams.get('message')
  const displayError =
    error ||
    (oauthMessage ? formatGoogleAuthError({ message: oauthMessage }) : '') ||
    (oauthError === 'oauth_failed'
      ? t('oauthFailed')
      : oauthError === 'oauth_missing_code'
        ? t('oauthCancelled')
        : '')

  const finishLogin = () => {
    router.refresh()
    router.push(redirectTo)
  }

  const redirectToMfaVerify = () => {
    const params = new URLSearchParams({ redirect: redirectTo })
    router.push(`${MFA_VERIFY_ROUTE}?${params.toString()}`)
  }

  const markUnverified = (value: string, userId?: string) => {
    const normalized = value.trim().toLowerCase()
    setUnverifiedEmail(normalized)
    setError("Your email hasn't been verified yet.\nPlease verify your email first.")
    if (userId) {
      saveVerificationPending({ userId, email: normalized })
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t('enterEmailForReset'))
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (resetError) {
      setError(ensureErrorMessage(resetError.message, t('loginFailed')))
      return
    }

    toast.success(t('passwordResetSent'), {
      description: t('passwordResetSentDescription', { email }),
    })
  }

  const handleGoogleSignIn = () => {
    setError('')
    setUnverifiedEmail(null)
    setGoogleLoading(true)
    signInWithGoogle(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
  }

  const handleResendFromLogin = async () => {
    if (!unverifiedEmail || resending) return
    setResending(true)
    try {
      const hint = await checkUnverifiedHint(unverifiedEmail)
      if (!hint?.unverified || !hint.userId) {
        setError('We could not resend the verification email. Please open Confirm Email.')
        return
      }

      saveVerificationPending({ userId: hint.userId, email: unverifiedEmail })
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: hint.userId, email: unverifiedEmail }),
      })
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        setError('We could not resend the verification email. Please try again.')
        return
      }
      const payload = (await response.json()) as {
        success: boolean
        message?: string
      }
      if (!payload.success) {
        setError(ensureErrorMessage(payload.message, 'We could not resend the verification email.'))
        return
      }
      toast.success('Verification email sent', {
        description: `Check ${unverifiedEmail} for the confirmation link.`,
      })
    } catch (err) {
      setError(ensureErrorMessage(err, 'We could not resend the verification email.'))
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUnverifiedEmail(null)
    setLoading(true)

    try {
      if (!email || password.length < 6) {
        setError(t('invalidCredentials'))
        setLoading(false)
        return
      }

      const normalizedEmail = email.trim().toLowerCase()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (authError) {
        const lower = (authError.message || '').toLowerCase()
        const looksUnverified =
          lower.includes('email not confirmed') ||
          lower.includes('not confirmed') ||
          lower.includes('confirm your email')

        if (looksUnverified) {
          const hint = await checkUnverifiedHint(normalizedEmail)
          markUnverified(normalizedEmail, hint?.userId)
          setLoading(false)
          return
        }

        // Supabase often returns "Invalid login credentials" for unverified accounts.
        if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
          const hint = await checkUnverifiedHint(normalizedEmail)
          if (hint?.unverified) {
            markUnverified(normalizedEmail, hint.userId)
            setLoading(false)
            return
          }
        }

        setError(
          ensureErrorMessage(
            authError.message,
            'Incorrect email or password. Please try again.'
          )
        )
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('We could not sign you in. Please try again.')
        setLoading(false)
        return
      }

      if (!data.user.email_confirmed_at) {
        markUnverified(normalizedEmail, data.user.id)
        await supabase.auth.signOut({ scope: 'local' })
        setLoading(false)
        return
      }

      const mfa = await needsMfaChallenge()
      if (mfa.required) {
        setRememberSessionPreference(rememberMe)
        redirectToMfaVerify()
        setLoading(false)
        return
      }

      setRememberSessionPreference(rememberMe)
      finishLogin()
    } catch (err) {
      setError(ensureErrorMessage(err, 'We could not sign you in. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || googleLoading || resending
  const confirmEmailHref = unverifiedEmail
    ? `/auth/confirm-email?email=${encodeURIComponent(unverifiedEmail)}`
    : '/auth/confirm-email'

  return (
    <AuthFormShell
      title={t('signInTitle')}
      subtitle={
        <>
          {t('dontHaveAccount')}{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            {tNav('signup')}
          </Link>
        </>
      }
      footer={
        <AuthSecurityNotice
          securityText={t('securityNotice')}
          showSupport
          needHelpText={t('needHelp')}
          contactSupportText={t('contactSupport')}
        />
      }
    >
      {displayError ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive whitespace-pre-line"
        >
          {displayError}
          {unverifiedEmail ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-destructive/30 bg-white text-destructive hover:bg-destructive/5"
                disabled={busy}
                onClick={() => void handleResendFromLogin()}
              >
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Resend email
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={busy}
                onClick={() => {
                  window.location.assign(confirmEmailHref)
                }}
              >
                Go to Confirm Email
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isGoogleAuthEnabled() ? (
        <GoogleSignInButton
          disabled={busy}
          onClick={handleGoogleSignIn}
          label={googleLoading ? t('redirectingToGoogle') : t('continueWithGoogle')}
        />
      ) : null}

      {isGoogleAuthEnabled() ? <AuthDivider label={t('continueWithEmail')} /> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          id="email"
          label={t('emailAddressLabel')}
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value)
            setUnverifiedEmail(null)
          }}
          placeholder={t('emailPlaceholder')}
          icon={<Mail className="h-4 w-4" />}
          disabled={busy}
          autoComplete="email"
        />

        <AuthInput
          id="password"
          label={t('passwordLabel')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder={t('passwordPlaceholder')}
          icon={<Lock className="h-4 w-4" />}
          disabled={busy}
          autoComplete="current-password"
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

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-border"
              disabled={busy}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>{t('rememberMe')}</span>
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="min-h-11 font-medium text-primary hover:underline"
            disabled={busy}
          >
            {t('forgotPassword')}
          </button>
        </div>

        <Button type="submit" disabled={busy || !email || !password} className="h-11 w-full text-sm font-semibold">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tCommon('loading')}
            </>
          ) : (
            t('signIn')
          )}
        </Button>
      </form>
    </AuthFormShell>
  )
}

export function LoginFormClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
