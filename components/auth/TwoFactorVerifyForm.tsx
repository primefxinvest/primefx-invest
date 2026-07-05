'use client'

import { Suspense, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Check, KeyRound, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { OtpInput } from '@/components/auth/OtpInput'
import {
  TwoFactorSecureBadge,
  TwoFactorTrustFeatures,
} from '@/components/auth/TwoFactorTrustFeatures'
import { logout } from '@/lib/auth/logout'
import { needsMfaChallenge, verifyMfaLogin } from '@/lib/auth/mfa'
import { getCurrentUser } from '@/lib/supabase'
import { sanitizeRedirectPath } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

function TwoFactorVerifyFormInner() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirect'))
  const [mfaCode, setMfaCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        const { data: user } = await getCurrentUser()
        if (!active) return

        if (!user) {
          router.replace('/login')
          return
        }

        const mfa = await Promise.race([
          needsMfaChallenge(),
          new Promise<{ required: boolean }>((resolve) =>
            setTimeout(() => resolve({ required: false }), 10_000)
          ),
        ])
        if (!active) return

        if (!mfa.required) {
          router.replace(redirectTo)
          return
        }

        setChecking(false)
      } catch {
        if (active) setChecking(false)
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [router, redirectTo])

  const finishVerification = () => {
    toast.success(t('mfaVerificationSuccess'), {
      description: t('mfaWelcomeBack'),
    })
    router.refresh()
    router.push(redirectTo)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await verifyMfaLogin(mfaCode)
      if (!result.success) {
        setError(result.error ?? t('mfaInvalidCode'))
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      finishVerification()
    } catch {
      setError(t('mfaVerificationFailed'))
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    await logout()
  }

  if (checking) {
    return (
      <div
        className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border/80 bg-card p-10 shadow-xl shadow-black/[0.04]"
        aria-busy="true"
        aria-label={t('mfaCheckingSession')}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isComplete = mfaCode.length === 6

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl shadow-black/[0.04] sm:p-8">
        {/* Header */}
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/10">
            <Shield className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            {t('mfaTitle')}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t('mfaSubtitle')}
          </p>
          <div className="mt-4 flex justify-center">
            <TwoFactorSecureBadge />
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Authenticator info card */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('mfaAuthenticatorTitle')}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t('mfaAuthenticatorHelp')}
                </p>
              </div>
            </div>
          </div>

          {/* OTP */}
          <div className="space-y-3">
            <p id="mfa-otp-label" className="text-center text-sm font-medium text-foreground">
              {t('mfaCodeLabel')}
            </p>
            <OtpInput
              value={mfaCode}
              onChange={(next) => {
                setMfaCode(next)
                if (error) setError('')
              }}
              disabled={loading || success}
              error={Boolean(error)}
              success={success}
              aria-label={t('mfaCodeLabel')}
            />
          </div>

          {/* Primary button */}
          <button
            type="submit"
            disabled={loading || success || !isComplete}
            className={cn(
              'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-lg transition-all',
              'bg-gradient-to-r from-[#0052ff] to-[#2563eb] hover:opacity-95 active:scale-[0.99]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('mfaVerifying')}
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                {t('mfaVerified')}
              </>
            ) : (
              t('mfaVerifyContinue')
            )}
          </button>
        </form>

        {/* Secondary actions */}
        <div className="mt-6 space-y-3 border-t border-border/60 pt-5 text-center text-sm">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="min-h-11 w-full font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {t('mfaSignOutDifferent')}
          </button>
          <p className="text-muted-foreground">
            {t('mfaLostAuthenticator')}{' '}
            <Link
              href="/contact"
              className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              {t('mfaContactSupport')}
            </Link>
          </p>
        </div>
      </div>

      <TwoFactorTrustFeatures className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150" />
    </div>
  )
}

function TwoFactorVerifyFallback() {
  const tCommon = useTranslations('common')

  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border/80 bg-card p-10 shadow-xl shadow-black/[0.04]">
      <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
    </div>
  )
}

export function TwoFactorVerifyForm() {
  return (
    <Suspense fallback={<TwoFactorVerifyFallback />}>
      <TwoFactorVerifyFormInner />
    </Suspense>
  )
}
