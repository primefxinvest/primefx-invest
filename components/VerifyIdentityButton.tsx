'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type VerifyIdentityButtonProps = {
  isVerified?: boolean
  verificationStatus?: 'pending' | 'approved' | 'declined' | 'expired' | string
  className?: string
  size?: 'default' | 'sm'
}

export function VerifyIdentityButton({
  isVerified = false,
  verificationStatus = 'pending',
  className,
  size = 'default',
}: VerifyIdentityButtonProps) {
  const t = useTranslations('verification')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)

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
      : verificationStatus === 'expired'
        ? t('restartVerification')
        : t('verifyIdentity')

  const handleClick = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/verify/start', { method: 'POST' })
      const payload = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? 'Could not start verification')
      }

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
        'inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70',
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
