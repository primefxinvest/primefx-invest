'use client'

import { ChevronLeft, Headphones, Minus, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { AssistanceSession } from '@/lib/assistance/types'

type AssistanceHeaderProps = {
  isHumanMode: boolean
  session: AssistanceSession | null
  showBack?: boolean
  onBack?: () => void
  onMinimize: () => void
  onClose: () => void
}

export function AssistanceHeader({
  isHumanMode,
  session,
  showBack,
  onBack,
  onMinimize,
  onClose,
}: AssistanceHeaderProps) {
  const t = useTranslations('assistance')

  return (
    <header className="relative shrink-0 overflow-hidden">
      <div
        className={cn(
          'absolute inset-0',
          isHumanMode
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800'
            : 'bg-gradient-to-br from-[#0052ff] via-[#1d4ed8] to-[#1e3a8a]'
        )}
      />
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 left-4 h-16 w-16 rounded-full bg-white/5 blur-xl" />

      <div className="relative px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {showBack && onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/10"
                aria-label={t('tabs.home')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-lg',
                'bg-white/15 ring-1 ring-white/20 backdrop-blur-sm'
              )}
            >
              {isHumanMode ? (
                <Headphones className="h-5 w-5 text-white" aria-hidden />
              ) : (
                <Sparkles className="h-5 w-5 text-white" aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold text-white">
                {isHumanMode ? t('humanTitle') : t('title')}
              </h2>
              <p className="truncate text-[11px] text-white/75">
                {isHumanMode ? t('humanSubtitle') : t('subtitle')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={onMinimize}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('minimize')}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {isHumanMode ? t('agentOnline') : t('statusOnline')}
          </span>
          {session?.ticketNumber ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] text-white/90 ring-1 ring-white/15">
              {session.ticketNumber}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  )
}
