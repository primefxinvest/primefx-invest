'use client'

import {
  ChevronRight,
  CreditCard,
  Gift,
  HelpCircle,
  Lock,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { QUICK_HELP_ITEMS, SYSTEM_SERVICES, type FaqKey } from '@/components/support/constants'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const quickHelpIcons: Record<string, LucideIcon> = {
  withdrawals: HelpCircle,
  referrals: Users,
  deposit: CreditCard,
  rewards: Gift,
  investments: TrendingUp,
  verification: Shield,
}

type SupportQuickHelpPanelProps = {
  onSelectFaq: (faqKey: FaqKey) => void
  onViewAllFaqs: () => void
}

export function SupportQuickHelpPanel({ onSelectFaq, onViewAllFaqs }: SupportQuickHelpPanelProps) {
  const t = useTranslations('support')

  return (
    <div className={dashboardCardClass}>
      <h3 className="text-sm font-bold text-foreground">{t('quickHelpTitle')}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t('quickHelpSubtitle')}</p>

      <ul className="mt-4 space-y-1">
        {QUICK_HELP_ITEMS.map((item) => {
          const Icon = quickHelpIcons[item.id] ?? HelpCircle
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectFaq(item.faqKey)}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0052ff] transition-transform group-hover:scale-105">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="min-w-0 flex-1 text-xs font-medium text-foreground sm:text-sm">
                  {t(`quickHelp.${item.id}`)}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={onViewAllFaqs}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:text-blue-700"
      >
        {t('viewAllFaqs')}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function SupportSystemStatusCard() {
  const t = useTranslations('support')

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e3a8a] p-5 shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0052ff]/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-sm font-bold text-white">{t('systemStatusOperational')}</p>
        </div>
        <p className="mt-1 text-xs text-slate-300">{t('systemStatusSubtitle')}</p>

        <ul className="mt-4 space-y-2">
          {SYSTEM_SERVICES.map((service) => (
            <li key={service} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{t(`systemServices.${service}`)}</span>
              <span className="font-semibold text-emerald-400">{t('operational')}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <div>
            <p className="text-slate-400">{t('uptime')}</p>
            <p className="mt-0.5 font-bold text-white">99.99%</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">{t('lastUpdated')}</p>
            <p className="mt-0.5 font-medium text-slate-200">{t('lastUpdatedValue')}</p>
          </div>
        </div>

        <div className="mt-4 h-10 overflow-hidden rounded-lg bg-white/5 px-1 py-2">
          <svg viewBox="0 0 120 24" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
            <polyline
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,18 12,16 24,17 36,15 48,16 60,14 72,15 84,13 96,14 108,12 120,13"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export function SupportTrustFooter() {
  const t = useTranslations('support')

  const badges = [
    { icon: Lock, label: t('trust.encryption') },
    { icon: Shield, label: t('trust.transactions') },
    { icon: Sparkles, label: t('trust.authentication') },
    { icon: CreditCard, label: t('trust.payments') },
    { icon: TrendingUp, label: t('trust.infrastructure') },
  ]

  return (
    <section className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {badges.map((badge) => {
          const Icon = badge.icon
          return (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs"
            >
              <Icon className="h-3.5 w-3.5 text-[#0052ff]" aria-hidden />
              {badge.label}
            </span>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground sm:text-xs">{t('trustFooter')}</p>
    </section>
  )
}

type SupportContactMethodsProps = {
  onLiveChat: () => void
}

export function SupportContactMethods({ onLiveChat }: SupportContactMethodsProps) {
  const t = useTranslations('support')

  const methods = [
    {
      id: 'liveChat',
      icon: HelpCircle,
      title: t('liveChat'),
      description: t('liveChatDesc'),
      response: t('liveChatResponse'),
      badge: t('fastest'),
      action: onLiveChat,
      actionLabel: t('startChat'),
    },
    {
      id: 'email',
      icon: Sparkles,
      title: t('emailSupport'),
      description: t('emailSupportDesc'),
      response: t('emailResponse'),
      action: () => {
        window.location.href = `mailto:${t('supportEmail')}`
      },
      actionLabel: t('sendEmail'),
    },
  ]

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">{t('contactTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('contactSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {methods.map((method) => {
          const Icon = method.icon
          return (
            <div
              key={method.id}
              className={cn(
                dashboardCardClass,
                'relative flex h-full flex-col transition-transform hover:-translate-y-0.5'
              )}
            >
              {method.badge ? (
                <span className="absolute right-4 top-4 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {method.badge}
                </span>
              ) : null}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0052ff]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">{method.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                {method.description}
              </p>
              <p className="mt-3 text-[11px] font-medium text-muted-foreground">
                {t('responseTime')}:{' '}
                <span className="text-foreground">{method.response}</span>
              </p>
              <button
                type="button"
                onClick={method.action}
                className="mt-4 w-full rounded-xl border border-[#0052ff]/30 px-4 py-2.5 text-sm font-semibold text-[#0052ff] transition-colors hover:bg-blue-50"
              >
                {method.actionLabel}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
