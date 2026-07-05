'use client'

import { CheckCircle2, Clock, FolderOpen, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type SupportStatsRowProps = {
  openCount: number
  closedCount: number
  loading: boolean
}

function StatSkeleton() {
  return (
    <div className={cn(dashboardCardClass, 'min-h-[6.5rem] animate-pulse')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-6 w-10 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
        <div className="h-9 w-9 rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export function SupportStatsRow({ openCount, closedCount, loading }: SupportStatsRowProps) {
  const t = useTranslations('support')

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: t('openTickets'),
      value: String(openCount),
      caption: openCount === 0 ? t('openTicketsEmpty') : t('openTicketsActive'),
      icon: FolderOpen,
      iconClass: 'bg-blue-50 text-[#0052ff]',
      valueClass: 'text-[#0052ff]',
    },
    {
      label: t('closedTickets'),
      value: String(closedCount),
      caption: closedCount === 0 ? t('closedTicketsEmpty') : t('closedTicketsDone'),
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-emerald-600',
    },
    {
      label: t('avgResponse'),
      value: t('avgResponseValue'),
      caption: t('avgResponseCaption'),
      icon: Clock,
      iconClass: 'bg-violet-50 text-violet-600',
      valueClass: 'text-violet-600',
    },
    {
      label: t('customerSatisfaction'),
      value: t('satisfactionScore'),
      caption: t('satisfactionCaption'),
      icon: Star,
      iconClass: 'bg-amber-50 text-amber-500',
      valueClass: 'text-foreground',
      stars: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={cn(
              dashboardCardClass,
              'flex min-h-[6.5rem] flex-col justify-between transition-transform hover:-translate-y-0.5'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
                  {card.label}
                </p>
                {card.stars ? (
                  <div className="mt-1.5 flex items-center gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          'h-3.5 w-3.5 sm:h-4 sm:w-4',
                          index < 5 ? 'fill-amber-400 text-amber-400' : 'text-muted'
                        )}
                      />
                    ))}
                  </div>
                ) : null}
                <p
                  className={cn(
                    'mt-1 text-xl font-bold tracking-tight sm:text-2xl',
                    card.valueClass
                  )}
                >
                  {card.value}
                </p>
                <p className="mt-1 line-clamp-2 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                  {card.caption}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  card.iconClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
