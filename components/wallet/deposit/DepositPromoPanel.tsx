'use client'

import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const PROMO_KEYS = ['promoCryptoCount', 'promoAutoConvert', 'promoRates', 'promoSecure'] as const

export function DepositPromoPanel() {
  const t = useTranslations('wallet.deposit')

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm'
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {t('promoEyebrow')}
      </p>
      <h2 className="mt-1.5 text-base font-semibold leading-snug text-foreground">{t('promoTitle')}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('promoSubtitle')}</p>
      <ul className="mt-4 space-y-2">
        {PROMO_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2 text-xs text-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
