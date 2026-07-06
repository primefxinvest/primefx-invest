'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import PrimeFxAssistanceWidget from '@/components/assistance/PrimeFxAssistanceWidget'
import { SupportHubShell } from '@/components/support/SupportHubShell'
import { FAQ_KEYS, type FaqKey } from '@/components/support/constants'
import { Link } from '@/i18n/navigation'
import { openPrimeFxAssistance } from '@/lib/assistance/events'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

export function ContactContent() {
  const t = useTranslations('support')
  const { isAuthenticated, loginHref, signupHref, signupLabel } = useAuthEntry()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<FaqKey | null>(null)

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredFaqKeys = useMemo(() => {
    if (!normalizedSearch) return FAQ_KEYS
    return FAQ_KEYS.filter((key) => {
      const question = t(`faq.${key}`).toLowerCase()
      const answer = t(`faq.a${key.slice(1)}`).toLowerCase()
      return question.includes(normalizedSearch) || answer.includes(normalizedSearch)
    })
  }, [normalizedSearch, t])

  return (
    <>
      <div className="px-4 py-8 sm:px-6 lg:py-12">
        <SupportHubShell
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLiveChat={() => {
            if (isAuthenticated) {
              openPrimeFxAssistance()
            }
          }}
          showLiveChat={isAuthenticated}
          footer={
            !isAuthenticated ? (
              <section className="rounded-2xl border border-border bg-card p-6 text-center">
                <h2 className="text-lg font-bold text-foreground">{t('contactSignInTitle')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('contactSignInDesc')}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Link
                    href={loginHref}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {t('contactSignIn')}
                  </Link>
                  <Link
                    href={signupHref}
                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50"
                  >
                    {signupLabel}
                  </Link>
                </div>
              </section>
            ) : null
          }
        >
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('tabFaq')}
            </h2>
            <div className={cn(dashboardCardClass, 'rounded-2xl')}>
              {filteredFaqKeys.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('faqNoResults')}</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredFaqKeys.map((key) => {
                    const isOpen = expandedFaq === key
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isOpen ? null : key)}
                          className="flex w-full items-center justify-between gap-3 py-4 text-left"
                          aria-expanded={isOpen}
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {t(`faq.${key}`)}
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </button>
                        {isOpen ? (
                          <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
                            {t(`faq.a${key.slice(1)}`)}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </SupportHubShell>
      </div>
      {isAuthenticated ? <PrimeFxAssistanceWidget /> : null}
    </>
  )
}
