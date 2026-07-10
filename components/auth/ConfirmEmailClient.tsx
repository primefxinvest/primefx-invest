'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  HelpCircle,
  Inbox,
  Loader2,
  Lock,
  Mail,
  Pencil,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/shared/Logo'
import { ensureErrorMessage } from '@/lib/auth/signup-errors'
import {
  clearVerificationPending,
  readVerificationPending,
  saveVerificationPending,
  updateVerificationPendingEmail,
} from '@/lib/auth/verification-pending'
import { cn } from '@/lib/utils'

type ApiResponse = {
  success: boolean
  message?: string
  data?: {
    verified?: boolean
    email?: string
    emailConfirmedAt?: string | null
    email_verified_at?: string | null
    retryAfterSeconds?: number
  }
  error?: { code?: string; detail?: string; message?: string }
}

const POLL_INTERVAL_MS = 5000
const RESEND_COOLDOWN_SECONDS = 60
const SUCCESS_REDIRECT_MS = 1000

type ProviderId = 'gmail' | 'outlook' | 'yahoo' | 'apple' | 'inbox'

type MailProvider = {
  id: ProviderId
  label: string
  href: string
  external: boolean
}

async function postJson(url: string, body: Record<string, unknown>): Promise<ApiResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      response.ok
        ? 'Verification service is temporarily unavailable. Please try again.'
        : `Verification service is temporarily unavailable (HTTP ${response.status}).`
    )
  }

  return (await response.json()) as ApiResponse
}

function apiMessage(payload: ApiResponse, fallback: string): string {
  return ensureErrorMessage(
    payload.message ?? payload.error?.detail ?? payload.error?.message ?? payload.error,
    fallback
  )
}

function detectPreferredProvider(email: string): ProviderId | null {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (!domain) return null
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'gmail'
  if (
    domain === 'outlook.com' ||
    domain === 'hotmail.com' ||
    domain === 'live.com' ||
    domain === 'msn.com'
  ) {
    return 'outlook'
  }
  if (domain === 'yahoo.com' || domain === 'ymail.com' || domain.endsWith('.yahoo.com')) {
    return 'yahoo'
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') return 'apple'
  return null
}

function EmailHeroIllustration({ verified }: { verified: boolean }) {
  return (
    <div className="relative mx-auto mb-8 flex h-44 w-full max-w-[300px] items-center justify-center" aria-hidden>
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-white" />
      <div className="absolute -right-1 top-3 h-20 w-20 rounded-full bg-[#3b82f6]/20 blur-2xl" />
      <div className="absolute -left-2 bottom-1 h-24 w-24 rounded-full bg-[#0a1628]/10 blur-2xl" />

      {verified ? (
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_20px_50px_-20px_rgba(16,185,129,0.85)] animate-in zoom-in-50 fade-in duration-500">
          <Check className="h-14 w-14 stroke-[3]" />
        </div>
      ) : (
        <>
          <div className="relative flex h-28 w-40 flex-col overflow-hidden rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_22px_50px_-24px_rgba(10,22,40,0.55)]">
            <div className="flex h-9 items-center gap-1.5 border-b border-[#e2e8f0] bg-[#f8fafc] px-3">
              <span className="h-2 w-2 rounded-full bg-[#f87171]" />
              <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
              <span className="h-2 w-2 rounded-full bg-[#34d399]" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2.5 px-4">
              <div className="h-2.5 w-20 rounded-full bg-[#93c5fd]" />
              <div className="h-2 w-28 rounded-full bg-[#e2e8f0]" />
              <div className="h-2 w-24 rounded-full bg-[#e2e8f0]" />
            </div>
          </div>
          <div className="absolute bottom-4 right-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a1628] text-white shadow-xl shadow-[#0a1628]/30">
            <Mail className="h-6 w-6" />
          </div>
          <div className="absolute left-5 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#3b82f6] shadow-md">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </>
      )}
    </div>
  )
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3.5 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-all text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

type ConfirmEmailClientProps = {
  initialEmail?: string
  initialStatus?: string
}

export function ConfirmEmailClient({
  initialEmail = '',
  initialStatus = '',
}: ConfirmEmailClientProps) {
  const [email, setEmail] = useState(initialEmail)
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [statusMessage, setStatusMessage] = useState(() => {
    if (initialStatus === 'expired') return 'Your verification link expired. Please resend a new email.'
    if (initialStatus === 'already_verified') {
      return 'Your email may already be verified. Use “I’ve verified my email” below.'
    }
    if (initialStatus === 'failed') return 'That verification link failed. Please resend a new email.'
    return ''
  })
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showAppleHelp, setShowAppleHelp] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [phase, setPhase] = useState<'pending' | 'success'>('pending')
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const establishingRef = useRef(false)
  const requestLockRef = useRef(false)

  useEffect(() => {
    const pending = readVerificationPending()
    if (pending) {
      setUserId(pending.userId)
      setEmail(pending.email || initialEmail)
    } else if (initialEmail) {
      setEmail(initialEmail)
    }
    setReady(true)
  }, [initialEmail])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const preferredProvider = useMemo(() => detectPreferredProvider(email), [email])

  const providers = useMemo<MailProvider[]>(() => {
    const all: MailProvider[] = [
      { id: 'gmail', label: 'Open Gmail', href: 'https://mail.google.com', external: true },
      {
        id: 'outlook',
        label: 'Open Outlook',
        href: 'https://outlook.live.com/mail/',
        external: true,
      },
      { id: 'yahoo', label: 'Open Yahoo', href: 'https://mail.yahoo.com', external: true },
      { id: 'apple', label: 'Open Apple Mail instructions', href: '#apple-mail', external: false },
      { id: 'inbox', label: 'Open Inbox', href: 'mailto:', external: true },
    ]

    if (!preferredProvider) {
      return [
        all.find((p) => p.id === 'inbox')!,
        all.find((p) => p.id === 'gmail')!,
        all.find((p) => p.id === 'outlook')!,
        all.find((p) => p.id === 'yahoo')!,
      ]
    }

    const preferred = all.find((p) => p.id === preferredProvider)!
    const rest = all.filter((p) => p.id !== preferredProvider && p.id !== 'inbox')
    return [preferred, ...rest]
  }, [preferredProvider])

  const finishVerifiedRedirect = useCallback(async (id: string, verifiedEmail: string) => {
    if (establishingRef.current) return
    establishingRef.current = true
    setPhase('success')
    setError('')
    setStatusMessage('')

    try {
      console.info('[session] creating post-verification session', { userId: id })
      const payload = await postJson('/api/auth/post-signup-session', {
        userId: id,
        email: verifiedEmail,
      })

      if (!payload.success) {
        console.error('[session] failed after verification', payload)
        setPhase('pending')
        establishingRef.current = false
        setError(
          apiMessage(
            payload,
            'Email verified, but we could not sign you in automatically. Please log in.'
          )
        )
        return
      }

      clearVerificationPending()
      console.info('[session] redirecting to dashboard after success animation')
      window.setTimeout(() => {
        window.location.assign('/dashboard')
      }, SUCCESS_REDIRECT_MS)
    } catch (err) {
      console.error('[session] unexpected error after verification', err)
      setPhase('pending')
      establishingRef.current = false
      setError(ensureErrorMessage(err, 'Email verified. Please log in to continue.'))
    }
  }, [])

  const checkVerificationStatus = useCallback(
    async (opts?: { manual?: boolean }) => {
      if (!userId || !email || establishingRef.current || requestLockRef.current) return false

      if (opts?.manual) {
        setChecking(true)
        requestLockRef.current = true
      }

      try {
        console.info('[verification] polling status', { userId, email, manual: Boolean(opts?.manual) })
        const payload = await postJson('/api/auth/verification-status', { userId, email })

        if (!payload.success) {
          if (opts?.manual) {
            setError(apiMessage(payload, 'Could not check verification status. Please try again.'))
          }
          return false
        }

        const verified = Boolean(
          payload.data?.verified ||
            payload.data?.email_verified_at ||
            payload.data?.emailConfirmedAt
        )

        if (verified) {
          setError('')
          await finishVerifiedRedirect(userId, email)
          return true
        }

        if (opts?.manual) {
          setStatusMessage('Still waiting for verification. Open your inbox and click the link.')
        }
        return false
      } catch (err) {
        console.error('[verification] poll failed', err)
        if (opts?.manual) {
          setError(ensureErrorMessage(err, 'Could not check verification status. Please try again.'))
        }
        return false
      } finally {
        if (opts?.manual) {
          setChecking(false)
          requestLockRef.current = false
        }
      }
    },
    [userId, email, finishVerifiedRedirect]
  )

  useEffect(() => {
    if (!userId || !email || phase === 'success') return

    void checkVerificationStatus()
    const interval = window.setInterval(() => {
      void checkVerificationStatus()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [userId, email, phase, checkVerificationStatus])

  const handleResend = async () => {
    if (!userId || !email || resending || cooldown > 0 || phase === 'success' || requestLockRef.current) {
      return
    }

    setResending(true)
    requestLockRef.current = true
    setError('')
    setStatusMessage('')

    try {
      const payload = await postJson('/api/auth/resend-verification', { userId, email })
      if (!payload.success) {
        setError(apiMessage(payload, 'We could not resend the verification email. Please try again.'))
        if (payload.error?.code === 'RATE_LIMIT_EXCEEDED') {
          setCooldown(payload.data?.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS)
        }
        return
      }

      setStatusMessage('Verification email sent successfully. Please check your inbox.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[verification] resend failed', err)
      setError(ensureErrorMessage(err, 'We could not resend the verification email. Please try again.'))
    } finally {
      setResending(false)
      requestLockRef.current = false
    }
  }

  const handleChangeEmail = async (event: FormEvent) => {
    event.preventDefault()
    if (!userId || !email || changingEmail || phase === 'success' || requestLockRef.current) return

    const nextEmail = newEmail.trim().toLowerCase()
    if (!nextEmail || nextEmail === email) {
      setError('Enter a different valid email address.')
      return
    }

    setChangingEmail(true)
    requestLockRef.current = true
    setError('')
    setStatusMessage('')

    try {
      const payload = await postJson('/api/auth/change-pending-email', {
        userId,
        currentEmail: email,
        newEmail: nextEmail,
      })

      if (!payload.success) {
        setError(apiMessage(payload, 'Could not change email. Please try again.'))
        if (payload.data?.email) {
          setEmail(payload.data.email)
          updateVerificationPendingEmail(payload.data.email)
        }
        return
      }

      const updated = payload.data?.email || nextEmail
      setEmail(updated)
      saveVerificationPending({ userId, email: updated })
      setShowChangeEmail(false)
      setNewEmail('')
      setStatusMessage('Email updated. A new verification link has been sent.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[verification] change email failed', err)
      setError(ensureErrorMessage(err, 'Could not change email. Please try again.'))
    } finally {
      setChangingEmail(false)
      requestLockRef.current = false
    }
  }

  const busy = resending || checking || changingEmail || phase === 'success'
  const safeError = error && error !== '{}' ? error : ''
  const missingPending = ready && !userId

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f5f7fa]">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          Preparing secure verification…
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#f5f7fa]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.14),_transparent_55%),linear-gradient(180deg,#e8eef7_0%,#f5f7fa_42%,#f8fafc_100%)]" />

      <header className="relative z-10 mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to signup
        </Link>
        <Link href="/" className="inline-flex items-center transition-opacity hover:opacity-90">
          <Logo sizeKey="authForm" />
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[520px] flex-col px-4 pb-16 pt-2 sm:px-6 sm:pt-6">
        <div
          className={cn(
            'rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_30px_80px_-40px_rgba(10,22,40,0.45)] sm:p-9',
            phase === 'success' && 'ring-2 ring-emerald-400/40'
          )}
        >
          <EmailHeroIllustration verified={phase === 'success'} />

          {phase === 'success' ? (
            <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.85rem]">
                Email verified successfully
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                Redirecting to your dashboard…
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing you in securely
              </div>
              <div className="mx-auto mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full w-full origin-left animate-pulse rounded-full bg-emerald-500" />
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.85rem]">
                  Confirm your email
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  We&apos;ve sent a verification email to
                </p>
                <p className="mt-2 break-all text-base font-semibold text-[#0a1628]">
                  {email || 'your inbox'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  Please click the link inside your inbox.
                  <br />
                  After verification you&apos;ll be taken directly to your dashboard.
                </p>
              </div>

              <div className="mt-6 grid gap-2.5">
                <StatusRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email address"
                  value={email || 'Pending'}
                />
                <StatusRow
                  icon={<Inbox className="h-4 w-4" />}
                  label="Delivery"
                  value="Sent successfully"
                />
                <StatusRow
                  icon={<Lock className="h-4 w-4" />}
                  label="Security"
                  value="Secure verification"
                />
              </div>

              {missingPending ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
                  We couldn&apos;t find your pending signup on this device. Open the link from your
                  email, or{' '}
                  <Link href="/signup" className="font-semibold underline">
                    sign up again
                  </Link>
                  .
                </div>
              ) : null}

              {safeError ? (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {safeError}
                </div>
              ) : null}

              {statusMessage ? (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              ) : null}

              <div className="mt-6 grid gap-2.5">
                <Button
                  type="button"
                  className="h-12 w-full text-sm font-semibold"
                  disabled={!userId || busy}
                  onClick={() => void checkVerificationStatus({ manual: true })}
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  I&apos;ve verified my email
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full text-sm font-semibold"
                  disabled={!userId || busy || cooldown > 0}
                  onClick={() => void handleResend()}
                >
                  {resending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Inbox className="h-4 w-4" />
                  )}
                  {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-full font-semibold text-muted-foreground"
                  disabled={!userId || busy}
                  onClick={() => setShowChangeEmail((open) => !open)}
                >
                  <Pencil className="h-4 w-4" />
                  Change email
                </Button>
              </div>

              {showChangeEmail ? (
                <form
                  onSubmit={handleChangeEmail}
                  className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/25 p-4"
                >
                  <label className="block text-sm font-medium text-foreground" htmlFor="new-email">
                    New email address
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2"
                    disabled={changingEmail || busy}
                    required
                    autoComplete="email"
                  />
                  <Button type="submit" className="h-11 w-full" disabled={changingEmail || busy}>
                    {changingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Update email & send new link
                  </Button>
                </form>
              ) : null}

              <div className="mt-7">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Open your inbox
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {providers.map((provider) => {
                    if (provider.id === 'apple') {
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setShowAppleHelp((open) => !open)}
                          className={cn(
                            'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted',
                            preferredProvider === 'apple' && 'border-[#93c5fd] bg-[#eff6ff]'
                          )}
                        >
                          <HelpCircle className="h-4 w-4 text-[#2563eb]" />
                          {provider.label}
                        </button>
                      )
                    }

                    return (
                      <a
                        key={provider.id}
                        href={provider.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted',
                          preferredProvider === provider.id && 'border-[#93c5fd] bg-[#eff6ff]'
                        )}
                      >
                        {provider.label}
                      </a>
                    )
                  })}
                </div>

                {showAppleHelp ? (
                  <div className="mt-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Open the <strong className="text-foreground">Mail</strong> app on your iPhone,
                    iPad, or Mac, then look for a message from PrimeFx Invest. Tap the verification
                    link to continue.
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/70" />
                Checking verification status every 5 seconds
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already verified?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
