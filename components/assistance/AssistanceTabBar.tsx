'use client'

import { BookOpen, Home, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type AssistanceTab = 'home' | 'messages' | 'help'

type AssistanceTabBarProps = {
  activeTab: AssistanceTab
  onChange: (tab: AssistanceTab) => void
  messageBadge?: boolean
}

export function AssistanceTabBar({ activeTab, onChange, messageBadge }: AssistanceTabBarProps) {
  const t = useTranslations('assistance')

  const tabs: { id: AssistanceTab; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: t('tabs.home') },
    { id: 'messages', icon: MessageCircle, label: t('tabs.messages') },
    { id: 'help', icon: BookOpen, label: t('tabs.help') },
  ]

  return (
    <nav
      className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md"
      aria-label={t('tabs.navLabel')}
    >
      <div className="grid grid-cols-3">
        {tabs.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} aria-hidden />
                {id === 'messages' && messageBadge ? (
                  <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                ) : null}
              </span>
              <span>{label}</span>
              {active ? (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              ) : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
