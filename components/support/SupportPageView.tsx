'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { TableSkeleton } from '@/components/shared/skeletons'
import { SupportCreateTicketModal } from '@/components/support/SupportCreateTicketModal'
import { SupportEmptyIllustration } from '@/components/support/SupportHeroSection'
import { SupportHubShell } from '@/components/support/SupportHubShell'
import { SupportInsightsSection } from '@/components/support/SupportInsightsSection'
import {
  CLOSED_STATUSES,
  FAQ_KEYS,
  isOpenTicket,
  type FaqKey,
} from '@/components/support/constants'
import {
  SupportTicketCard,
  SupportTicketThreadModal,
} from '@/components/support/SupportTicketViews'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchSupportTickets } from '@/lib/data/queries'
import { submitSupportTicket } from '@/lib/support/actions'
import { openPrimeFxAssistance } from '@/lib/assistance/events'
import { pageStackClass } from '@/lib/layout/spacing'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type SupportTab = 'tickets' | 'faq' | 'help'

export function SupportPageView() {
  const t = useTranslations('support')
  const [tab, setTab] = useState<SupportTab>('faq')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [expandedFaq, setExpandedFaq] = useState<FaqKey | null>(null)
  const faqRef = useRef<HTMLDivElement>(null)

  const { data: tickets = [], loading, error, reload } = useAsyncData(
    () => fetchSupportTickets(),
    []
  )

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredTickets = useMemo(() => {
    if (!normalizedSearch) return tickets
    return tickets.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(normalizedSearch) ||
        ticket.description.toLowerCase().includes(normalizedSearch) ||
        ticket.id.toLowerCase().includes(normalizedSearch)
    )
  }, [tickets, normalizedSearch])

  const filteredFaqKeys = useMemo(() => {
    if (!normalizedSearch) return FAQ_KEYS
    return FAQ_KEYS.filter((key) => {
      const question = t(`faq.${key}`).toLowerCase()
      const answer = t(`faq.a${key.slice(1)}`).toLowerCase()
      return question.includes(normalizedSearch) || answer.includes(normalizedSearch)
    })
  }, [normalizedSearch, t])

  const openTicketItems = filteredTickets.filter((ticket) => isOpenTicket(ticket.status))
  const closedTicketItems = filteredTickets.filter((ticket) =>
    CLOSED_STATUSES.has(ticket.status.toLowerCase())
  )

  const openCreateTicketModal = () => {
    setSubject('')
    setDescription('')
    setPriority('medium')
    setModalOpen(true)
  }

  const handleSubmitTicket = async () => {
    setSubmitting(true)
    const result = await submitSupportTicket({ subject, description, priority })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(t('ticketFailed'), { description: result.error })
      return
    }

    toast.success(t('ticketCreated'))
    setModalOpen(false)
    setSubject('')
    setDescription('')
    setPriority('medium')
    reload()
    setTab('tickets')
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim() && (tab === 'tickets' || tab === 'help')) {
      setTab('faq')
    }
  }

  const tabs: { id: SupportTab; label: string }[] = [
    { id: 'faq', label: t('tabFaq') },
    { id: 'help', label: t('tabHelpCenter') },
    { id: 'tickets', label: t('tabTickets') },
  ]

  return (
    <div className={pageStackClass}>
      <SupportHubShell
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onLiveChat={() => openPrimeFxAssistance()}
      >
        <section className="space-y-4">
          <div className="flex gap-1 overflow-x-auto border-b border-border scrollbar-none">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'shrink-0 px-4 py-3 text-sm font-semibold transition-colors',
                  tab === item.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'tickets' ? (
            <AsyncState
              loading={loading}
              error={error}
              onRetry={reload}
              isEmpty={false}
              skeleton={<TableSkeleton rows={3} cols={1} showHeader={false} />}
            >
              {!loading && !error && filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                  <SupportEmptyIllustration />
                  <h3 className="mt-6 text-base font-bold text-foreground">{t('emptyTitle')}</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('emptyDescription')}</p>
                  <button
                    type="button"
                    onClick={openCreateTicketModal}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    {t('createNewTicket')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={openCreateTicketModal}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/50"
                    >
                      <Plus className="h-4 w-4" />
                      {t('newTicket')}
                    </button>
                  </div>
                  {openTicketItems.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">{t('openTickets')}</h3>
                      {openTicketItems.map((ticket) => (
                        <SupportTicketCard
                          key={ticket.ticketId}
                          ticket={ticket}
                          onOpen={setActiveTicketId}
                        />
                      ))}
                    </div>
                  ) : null}
                  {closedTicketItems.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">{t('closedTickets')}</h3>
                      {closedTicketItems.map((ticket) => (
                        <SupportTicketCard
                          key={ticket.ticketId}
                          ticket={ticket}
                          onOpen={setActiveTicketId}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </AsyncState>
          ) : null}

          {tab === 'faq' ? (
            <div ref={faqRef} className={cn(dashboardCardClass, 'scroll-mt-6 rounded-2xl')}>
              {filteredFaqKeys.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-foreground">{t('faqNoResults')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('faqNoResultsDescription')}</p>
                </div>
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
                          <span className="text-sm font-semibold text-foreground sm:text-base">
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
          ) : null}

          {tab === 'help' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FAQ_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab('faq')
                    setExpandedFaq(key)
                  }}
                  className={cn(
                    dashboardCardClass,
                    'rounded-2xl text-left transition-all hover:border-primary/30 hover:shadow-md'
                  )}
                >
                  <p className="text-sm font-bold text-foreground">{t(`faq.${key}`)}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {t(`faq.a${key.slice(1)}`)}
                  </p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-primary">
                    {t('readArticle')} →
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      </SupportHubShell>

      <SupportInsightsSection
        onSelectFaq={(key) => {
          setTab('faq')
          setExpandedFaq(key)
          faqRef.current?.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      <SupportCreateTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        subject={subject}
        description={description}
        priority={priority}
        submitting={submitting}
        onSubjectChange={setSubject}
        onDescriptionChange={setDescription}
        onPriorityChange={setPriority}
        onSubmit={handleSubmitTicket}
      />

      {activeTicketId ? (
        <SupportTicketThreadModal
          ticketId={activeTicketId}
          onClose={() => setActiveTicketId(null)}
          onSent={reload}
        />
      ) : null}
    </div>
  )
}
