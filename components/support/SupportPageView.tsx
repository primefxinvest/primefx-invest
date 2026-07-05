'use client'

import { useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { TableSkeleton } from '@/components/shared/skeletons'
import { SupportCreateTicketModal } from '@/components/support/SupportCreateTicketModal'
import { SupportEmptyIllustration, SupportHeroSection } from '@/components/support/SupportHeroSection'
import {
  SupportContactMethods,
  SupportQuickHelpPanel,
  SupportSystemStatusCard,
  SupportTrustFooter,
} from '@/components/support/SupportPanels'
import { SupportStatsRow } from '@/components/support/SupportStatsRow'
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
import {
  fetchSupportTickets,
  fetchSupportTicketStats,
} from '@/lib/data/queries'
import { submitSupportTicket } from '@/lib/support/actions'
import { gridGapClass, pageStackClass } from '@/lib/layout/spacing'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type SupportTab = 'tickets' | 'faq' | 'help'

export function SupportPageView() {
  const t = useTranslations('support')
  const [tab, setTab] = useState<SupportTab>('tickets')
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
  const { data: stats, reload: reloadStats } = useAsyncData(
    () => fetchSupportTicketStats(),
    []
  )

  const openCount = (stats?.open ?? 0) + (stats?.inProgress ?? 0)
  const closedCount = stats?.resolved ?? 0

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

  const openCreateTicketModal = (preset?: { subject?: string; description?: string }) => {
    setSubject(preset?.subject ?? '')
    setDescription(preset?.description ?? '')
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
    reloadStats()
    setTab('tickets')
  }

  const handleSelectFaq = (faqKey: FaqKey) => {
    setTab('faq')
    setExpandedFaq(faqKey)
    requestAnimationFrame(() => {
      faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleViewAllFaqs = () => {
    setTab('faq')
    setExpandedFaq(null)
    requestAnimationFrame(() => {
      faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim() && tab === 'tickets' && tickets.length === 0) {
      setTab('faq')
    }
  }

  const tabs: { id: SupportTab; label: string }[] = [
    { id: 'tickets', label: t('tabTickets') },
    { id: 'faq', label: t('tabFaq') },
    { id: 'help', label: t('tabHelpCenter') },
  ]

  return (
    <div className={pageStackClass}>
      <SupportHeroSection
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onNewTicket={() => openCreateTicketModal()}
      />

      <SupportStatsRow openCount={openCount} closedCount={closedCount} loading={loading && !stats} />

      <div className={cn('grid grid-cols-1', gridGapClass, 'xl:grid-cols-[minmax(0,1fr)_300px]')}>
        <div className="min-w-0 space-y-4">
          <div className="flex gap-1 overflow-x-auto border-b border-border scrollbar-none">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'shrink-0 px-4 py-3 text-sm font-semibold transition-colors',
                  tab === item.id
                    ? 'border-b-2 border-[#0052ff] text-[#0052ff]'
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
                <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                  <SupportEmptyIllustration />
                  <h3 className="mt-6 text-base font-bold text-foreground">{t('emptyTitle')}</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('emptyDescription')}</p>
                  <button
                    type="button"
                    onClick={() => openCreateTicketModal()}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    {t('createNewTicket')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
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

                  {filteredTickets.length > 0 &&
                  openTicketItems.length === 0 &&
                  closedTicketItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                      {t('searchNoTickets')}
                    </div>
                  ) : null}
                </div>
              )}
            </AsyncState>
          ) : null}

          {tab === 'faq' ? (
            <div ref={faqRef} className={cn(dashboardCardClass, 'scroll-mt-6')}>
              {filteredFaqKeys.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-foreground">{t('faqNoResults')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('faqNoResultsDescription')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFaqKeys.map((key) => {
                    const isOpen = expandedFaq === key
                    return (
                      <div key={key} className="border-b border-border/60 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isOpen ? null : key)}
                          className="flex w-full items-center justify-between gap-3 py-4 text-left"
                        >
                          <span className="text-sm font-semibold text-foreground sm:text-base">
                            {t(`faq.${key}`)}
                          </span>
                          <span
                            className={cn(
                              'text-muted-foreground transition-transform',
                              isOpen && 'rotate-180'
                            )}
                          >
                            ▼
                          </span>
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
                  onClick={() => handleSelectFaq(key)}
                  className={cn(
                    dashboardCardClass,
                    'text-left transition-transform hover:-translate-y-0.5'
                  )}
                >
                  <p className="text-sm font-bold text-foreground">{t(`faq.${key}`)}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {t(`faq.a${key.slice(1)}`)}
                  </p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-[#0052ff]">
                    {t('readArticle')} →
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SupportQuickHelpPanel onSelectFaq={handleSelectFaq} onViewAllFaqs={handleViewAllFaqs} />
          <SupportSystemStatusCard />
        </aside>
      </div>

      <SupportContactMethods
        onLiveChat={() =>
          openCreateTicketModal({
            subject: t('liveChatTicketSubject'),
            description: t('liveChatTicketDescription'),
          })
        }
        onScheduleCall={() =>
          openCreateTicketModal({
            subject: t('scheduleCallTicketSubject'),
            description: t('scheduleCallTicketDescription'),
          })
        }
      />

      <SupportTrustFooter />

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
          onSent={() => {
            reload()
            reloadStats()
          }}
        />
      ) : null}
    </div>
  )
}
