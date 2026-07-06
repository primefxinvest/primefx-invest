'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, MessageCircle, Search, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FAQ_KEYS, type FaqKey } from '@/components/support/constants'
import { cn } from '@/lib/utils'

type AssistanceHelpTabProps = {
  initialSearch?: string
  onAskAi: (query: string) => void
}

export function AssistanceHelpTab({ initialSearch = '', onAskAi }: AssistanceHelpTabProps) {
  const t = useTranslations('assistance')
  const tSupport = useTranslations('support')
  const [search, setSearch] = useState(initialSearch)
  const [expanded, setExpanded] = useState<FaqKey | null>(null)

  const filteredKeys = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return FAQ_KEYS
    return FAQ_KEYS.filter((key) => {
      const question = tSupport(`faq.${key}`).toLowerCase()
      const answer = tSupport(`faq.a${key.slice(1)}`).toLowerCase()
      return question.includes(term) || answer.includes(term)
    })
  }, [search, tSupport])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('help.searchPlaceholder')}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {filteredKeys.length === FAQ_KEYS.length
            ? t('help.articleCount', { count: FAQ_KEYS.length })
            : t('help.resultsCount', { count: filteredKeys.length })}
        </p>
      </div>

      <div className="primefx-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
        {filteredKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">{t('help.noResults')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('help.noResultsDesc')}</p>
            <button
              type="button"
              onClick={() => onAskAi(search || t('help.fallbackQuery'))}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0052ff] to-[#2563eb] px-4 py-2 text-xs font-semibold text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('help.askAi')}
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredKeys.map((key) => {
              const isOpen = expanded === key
              const answerKey = `a${key.slice(1)}` as `a${string}`
              return (
                <li
                  key={key}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="flex w-full items-start gap-2 p-3.5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                      {tSupport(`faq.${key}`)}
                    </span>
                    <ChevronDown
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border px-3.5 pb-3.5 pt-2">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {tSupport(`faq.${answerKey}`)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onAskAi(
                            `${tSupport(`faq.${key}`)} — ${tSupport(`faq.${answerKey}`).slice(0, 120)}`
                          )
                        }
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {t('help.stillNeedHelp')}
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
