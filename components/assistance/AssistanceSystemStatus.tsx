'use client'

import { useTranslations } from 'next-intl'
import { SYSTEM_SERVICES } from '@/components/support/constants'

export function AssistanceSystemStatus({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('support')

  return (
    <div
      className={
        compact
          ? 'rounded-xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e3a8a] p-3.5 shadow-md'
          : 'rounded-xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e3a8a] p-4 shadow-lg'
      }
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <p className="text-xs font-bold text-white sm:text-sm">{t('systemStatusOperational')}</p>
      </div>
      {!compact ? (
        <>
          <p className="mt-1 text-[11px] text-slate-300">{t('systemStatusSubtitle')}</p>
          <ul className="mt-3 space-y-1.5">
            {SYSTEM_SERVICES.slice(0, 4).map((service) => (
              <li key={service} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">{t(`systemServices.${service}`)}</span>
                <span className="font-semibold text-emerald-400">{t('operational')}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
