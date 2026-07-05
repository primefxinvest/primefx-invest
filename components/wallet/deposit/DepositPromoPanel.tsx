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
        'relative overflow-hidden rounded-2xl border border-[#0052ff]/20 bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#0052ff]/30 p-5 text-white shadow-lg'
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#0052ff]/30 blur-2xl"
        aria-hidden
      />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#60a5fa]">
          {t('promoEyebrow')}
        </p>
        <h2 className="mt-1.5 text-base font-bold leading-snug">{t('promoTitle')}</h2>
        <p className="mt-1 text-xs text-white/70">{t('promoSubtitle')}</p>
        <ul className="mt-4 space-y-2">
          {PROMO_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-xs text-white/85">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
