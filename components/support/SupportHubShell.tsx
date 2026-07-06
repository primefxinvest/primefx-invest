'use client'

import { Headphones, Mail, MessageCircle, Search, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SupportHubShellProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  onLiveChat: () => void
  onEmail?: () => void
  showLiveChat?: boolean
  children: ReactNode
  footer?: ReactNode
}

export function SupportHubShell({
  searchQuery,
  onSearchChange,
  onLiveChat,
  onEmail,
  showLiveChat = true,
  children,
  footer,
}: SupportHubShellProps) {
  const t = useTranslations('support')

  const handleEmail = onEmail ?? (() => {
    window.location.href = `mailto:${t('supportEmail')}`
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0052ff]/5 via-background to-violet-500/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#0052ff]/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-md">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {t('heroBadge')}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('description')}
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <label htmlFor="support-hub-search" className="text-sm font-semibold text-foreground">
          {t('searchLabel')}
        </label>
        <div className="relative mt-2.5">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="support-hub-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={cn(
              'w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none',
              'transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10'
            )}
          />
        </div>
      </section>

      {/* Contact channels */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {showLiveChat ? (
          <button
            type="button"
            onClick={onLiveChat}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb]">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {t('fastest')}
              </span>
            </div>
            <h2 className="mt-4 text-base font-bold text-foreground">{t('liveChat')}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('liveChatDesc')}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {t('responseTime')}:{' '}
              <span className="font-medium text-foreground">{t('liveChatResponse')}</span>
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {t('startChat')}
            </span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleEmail}
          className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h2 className="mt-4 text-base font-bold text-foreground">{t('emailSupport')}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('emailSupportDesc')}</p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t('responseTime')}:{' '}
            <span className="font-medium text-foreground">{t('emailResponse')}</span>
          </p>
          <span className="mt-4 text-sm font-semibold text-primary">{t('sendEmail')}</span>
        </button>
      </section>

      {children}

      {footer}
    </div>
  )
}
