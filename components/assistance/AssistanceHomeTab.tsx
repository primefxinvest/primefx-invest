'use client'

import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Headphones,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ASSISTANCE_QUICK_ACTIONS } from '@/lib/assistance/constants'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { cn } from '@/lib/utils'
import { AssistanceSystemStatus } from '@/components/assistance/AssistanceSystemStatus'

const QUICK_ACTION_ICONS = {
  deposits: ArrowDownToLine,
  withdrawals: ArrowUpFromLine,
  verification: UserCheck,
  investments: TrendingUp,
  referral: Users,
  security: Shield,
} as const

type AssistanceHomeTabProps = {
  onStartChat: (query?: string) => void
  onGoToMessages: () => void
  onGoToHelp: (search?: string) => void
  hasActiveConversation: boolean
}

export function AssistanceHomeTab({
  onStartChat,
  onGoToMessages,
  onGoToHelp,
  hasActiveConversation,
}: AssistanceHomeTabProps) {
  const t = useTranslations('assistance')
  const user = useSessionUser()

  const quickActions = ASSISTANCE_QUICK_ACTIONS.map(({ key, promptKey }) => ({
    key,
    icon: QUICK_ACTION_ICONS[key as keyof typeof QUICK_ACTION_ICONS] ?? Sparkles,
    label: t(`quickActions.${promptKey}`),
    query: t(`quickActionQueries.${promptKey}`),
  }))

  return (
    <div className="primefx-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-4 p-4">
        {/* Greeting card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {t('home.greeting', { name: user.name?.split(' ')[0] ?? 'there' })}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('home.subtitle')}</p>
          <button
            type="button"
            onClick={() => onStartChat()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0052ff] to-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0052ff]/20 transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            {t('home.startChat')}
          </button>
        </div>

        {/* Search */}
        <button
          type="button"
          onClick={() => onGoToHelp()}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('home.searchPlaceholder')}</span>
        </button>

        {/* Resume conversation */}
        {hasActiveConversation ? (
          <button
            type="button"
            onClick={onGoToMessages}
            className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t('home.resumeChat')}</p>
              <p className="text-[11px] text-muted-foreground">{t('home.resumeChatDesc')}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </button>
        ) : null}

        {/* Quick actions grid */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('home.quickActionsTitle')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ key, icon: Icon, label, query }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onStartChat(query)
                  onGoToMessages()
                }}
                className={cn(
                  'group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-left shadow-sm',
                  'transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0052ff] transition-transform group-hover:scale-105 dark:bg-blue-950/40">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System status */}
        <AssistanceSystemStatus />

        {/* Human escalation CTA */}
        <button
          type="button"
          onClick={() => {
            onStartChat(t('home.humanEscalationQuery'))
            onGoToMessages()
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">{t('escalation.connect')}</p>
            <p className="text-[11px] text-muted-foreground">{t('home.humanEscalationDesc')}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
