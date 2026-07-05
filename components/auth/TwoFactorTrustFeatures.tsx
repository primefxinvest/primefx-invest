'use client'

import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const TRUST_KEYS = [
  'mfaTrustEncryption',
  'mfaTrustDevice',
  'mfaTrustSession',
  'mfaTrustFraud',
] as const

export function TwoFactorTrustFeatures({ className }: { className?: string }) {
  const t = useTranslations('auth')

  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-muted/30 px-4 py-4 sm:px-5',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground sm:text-[13px]">
          {t('mfaTrustTitle')}
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {TRUST_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2 text-xs text-muted-foreground sm:text-sm">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TwoFactorSecureBadge() {
  const t = useTranslations('auth')

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
      <Lock className="h-3.5 w-3.5" aria-hidden />
      {t('mfaSecureBadge')}
    </span>
  )
}
