'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { formatGoogleAuthError, isGoogleAuthEnabled, signInWithGoogle } from '@/lib/auth/google-oauth'
import { needsMfaChallenge } from '@/lib/auth/mfa'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'
import Logo from '@/components/shared/Logo'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { useResetOnPageShow } from '@/lib/hooks/useResetOnPageShow'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

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
      ? 'Google sign-in failed. Try again or use email and password.'
      : oauthError === 'oauth_missing_code'
        ? 'Google sign-in was cancelled or interrupted.'
        : '')

  const finishLogin = () => {
    router.refresh()
    router.push(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
  }

  const redirectToMfaVerify = () => {
    const params = new URLSearchParams({
      redirect: redirectTo.startsWith('/') ? redirectTo : '/dashboard',
    })
    router.push(`${MFA_VERIFY_ROUTE}?${params.toString()}`)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first to reset your password.')
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (resetError) {
      setError(resetError.message)
      return
    }

    toast.success('Password reset email sent', {
      description: `Check ${email} for reset instructions.`,
    })
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      await signInWithGoogle(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
    } catch (err) {
      setError(formatGoogleAuthError(err))
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || password.length < 6) {
        setError('Please enter a valid email and password (min 6 characters)')
        setLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      const mfa = await needsMfaChallenge()
      if (mfa.required) {
        redirectToMfaVerify()
        setLoading(false)
        return
      }

      finishLogin()
    } catch {
      setError('Login failed. Please try again.')
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
        <p className="text-muted-foreground text-sm mt-1">Welcome back</p>
      </div>

      {displayError && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
            disabled={loading || googleLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border border-border w-4 h-4 cursor-pointer"
              disabled={loading || googleLoading}
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-primary hover:underline"
            disabled={loading || googleLoading}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading || !email || !password}
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Logging in...
            </>
          ) : (
            'Sign In'
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
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="mb-6">
            <GoogleSignInButton
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
              label={googleLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
            />
          </div>
        </>
      ) : null}

      <p className="text-center text-muted-foreground text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline font-semibold">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
