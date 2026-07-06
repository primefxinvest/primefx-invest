'use client'

import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FAQ_KEYS, QUICK_HELP_ITEMS, type FaqKey } from '@/components/support/constants'
import { SupportSystemStatusCard } from '@/components/support/SupportPanels'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type SupportInsightsSectionProps = {
  onSelectFaq: (key: FaqKey) => void
}

export function SupportInsightsSection({ onSelectFaq }: SupportInsightsSectionProps) {
  const t = useTranslations('support')

  const recentArticles = FAQ_KEYS.slice(0, 4)
  const trendingIssues = QUICK_HELP_ITEMS.slice(0, 4)

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={cn(dashboardCardClass, 'rounded-2xl lg:col-span-1')}>
        <h3 className="text-sm font-bold text-foreground">{t('recentArticles')}</h3>
        <ul className="mt-3 space-y-2">
          {recentArticles.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelectFaq(key)}
                className="group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted/50"
              >
                <span className="line-clamp-1 text-xs font-medium text-foreground sm:text-sm">
                  {t(`faq.${key}`)}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={cn(dashboardCardClass, 'rounded-2xl lg:col-span-1')}>
        <h3 className="text-sm font-bold text-foreground">{t('trendingIssues')}</h3>
        <ul className="mt-3 space-y-2">
          {trendingIssues.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectFaq(item.faqKey)}
                className="group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted/50"
              >
                <span className="text-xs font-medium text-foreground sm:text-sm">
                  {t(`quickHelp.${item.id}`)}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-1">
        <SupportSystemStatusCard />
      </div>
    </section>
  )
}
