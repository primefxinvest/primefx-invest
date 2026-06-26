'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/shared/Logo'
import { logout } from '@/lib/auth/logout'
import { needsMfaChallenge, verifyMfaLogin } from '@/lib/auth/mfa'
import { getCurrentUser } from '@/lib/supabase'

function TwoFactorVerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [mfaCode, setMfaCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function checkSession() {
      const { data: user } = await getCurrentUser()
      if (!active) return

      if (!user) {
        router.replace('/login')
        return
      }

      const mfa = await needsMfaChallenge()
      if (!active) return

      if (!mfa.required) {
        router.replace(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
        return
      }

      setChecking(false)
    }

    checkSession()

    return () => {
      active = false
    }
  }, [router, redirectTo])

  const finishVerification = () => {
    toast.success('Verification successful', {
      description: 'Welcome back to PrimeFx Invest.',
    })
    router.refresh()
    router.push(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await verifyMfaLogin(mfaCode)
      if (!result.success) {
        setError(result.error ?? 'Invalid verification code.')
        setLoading(false)
        return
      }
      finishVerification()
    } catch {
      setError('Verification failed. Please try again.')
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    await logout()
  }

  if (checking) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-card p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo showText={false} size={64} />
        </div>
        <h1 className="text-2xl font-bold">Two-Factor Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the code from your authenticator app to continue.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Authenticator code</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open Google Authenticator, Authy, or your TOTP app and enter the 6-digit code for
              PrimeFx Invest.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="mfaCode" className="mb-2 block text-sm font-medium">
            Verification Code
          </label>
          <input
            id="mfaCode"
            inputMode="numeric"
            maxLength={6}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.3em] transition-colors focus:border-primary focus:outline-none"
            disabled={loading}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || mfaCode.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign out and use a different account
        </button>
        <p className="text-center text-muted-foreground">
          Lost access to your authenticator?{' '}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-lg">
          Loading...
        </div>
      }
    >
      <TwoFactorVerifyForm />
    </Suspense>
  )
}
