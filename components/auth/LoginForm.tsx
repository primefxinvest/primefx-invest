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

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t('enterEmailForReset'))
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (resetError) {
      setError(resetError.message)
      return
    }

    toast.success(t('passwordResetSent'), {
      description: t('passwordResetSentDescription', { email }),
    })
  }

  const handleGoogleSignIn = () => {
    setError('')
    setGoogleLoading(true)
    signInWithGoogle(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || password.length < 6) {
        setError(t('invalidCredentials'))
        setLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || t('loginFailedCredentials'))
        setLoading(false)
        return
      }

      if (!data.user) {
        setError(t('loginFailed'))
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
    } catch {
      setError(t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || googleLoading

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
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {displayError}
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
          onChange={setEmail}
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
