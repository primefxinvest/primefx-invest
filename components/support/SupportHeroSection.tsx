'use client'

import { Inbox, Plus, Search, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type SupportHeroSectionProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  onNewTicket: () => void
}

export function SupportHeroSection({
  searchQuery,
  onSearchChange,
  onNewTicket,
}: SupportHeroSectionProps) {
  const t = useTranslations('support')

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('title')}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#0052ff] sm:text-xs">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              {t('heroBadge')}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('description')}
          </p>
        </div>

        <button
          type="button"
          onClick={onNewTicket}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {t('newTicket')}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <label htmlFor="support-search" className="text-sm font-semibold text-foreground">
          {t('searchLabel')}
        </label>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="support-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className={cn(
              'w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none',
              'transition-colors placeholder:text-muted-foreground focus:border-[#0052ff]/40 focus:ring-2 focus:ring-[#0052ff]/10'
            )}
          />
        </div>
      </div>
    </section>
  )
}

export function SupportEmptyIllustration() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100 to-violet-100" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-lg">
        <Inbox className="h-9 w-9 text-white" aria-hidden />
      </div>
    </div>
  )
}
