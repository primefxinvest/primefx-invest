'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { storeDiditSessionId, storeVerifyReturnPath } from '@/lib/didit/callback-session'
import { useOptionalEmailVerification } from '@/lib/auth/email-verification-context'
import { EMAIL_NOT_VERIFIED_CODE } from '@/lib/auth/email-verification-client'

type VerifyIdentityButtonProps = {
  userId?: string
  isVerified?: boolean
  verificationStatus?: 'pending' | 'approved' | 'declined' | 'expired' | string
  className?: string
  size?: 'default' | 'sm'
}

export function VerifyIdentityButton({
  userId,
  isVerified = false,
  verificationStatus = 'pending',
  className,
  size = 'default',
}: VerifyIdentityButtonProps) {
  const t = useTranslations('verification')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const emailVerification = useOptionalEmailVerification()

  if (isVerified || verificationStatus === 'approved') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700',
          size === 'sm' && 'px-3 py-1.5 text-xs',
          className
        )}
      >
        <CheckCircle2 className={cn('h-4 w-4', size === 'sm' && 'h-3.5 w-3.5')} />
        {t('verified')}
      </div>
    )
  }

  const label =
    verificationStatus === 'declined'
      ? t('retryVerification')
      : verificationStatus === 'expired' || verificationStatus === 'abandoned'
        ? t('restartVerification')
        : t('verifyIdentity')

  const handleClick = async () => {
    if (emailVerification && !emailVerification.requireVerifiedEmail()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userId ? { userId } : {}),
      })
      const payload = (await response.json()) as {
        url?: string
        sessionId?: string
        error?: string
        code?: string
      }

      if (!response.ok || !payload.url) {
        if (payload.code === EMAIL_NOT_VERIFIED_CODE && emailVerification) {
          emailVerification.openVerificationModal()
        }
        throw new Error(payload.error ?? 'Could not start verification')
      }

      if (payload.sessionId) {
        storeDiditSessionId(payload.sessionId)
      }

      storeVerifyReturnPath(window.location.pathname)

      window.location.href = payload.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('verificationFailed'))
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70',
        size === 'sm' && 'px-3 py-2 text-xs',
        className
      )}
    >
      {loading ? (
        <Loader2 className={cn('h-4 w-4 animate-spin', size === 'sm' && 'h-3.5 w-3.5')} />
      ) : (
        <ShieldCheck className={cn('h-4 w-4', size === 'sm' && 'h-3.5 w-3.5')} />
      )}
      {loading ? tCommon('loading') : label}
    </button>
  )
}
