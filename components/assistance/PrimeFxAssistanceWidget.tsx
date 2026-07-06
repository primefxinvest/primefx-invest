'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Headphones, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AssistancePanel } from '@/components/assistance/AssistancePanel'
import type { AssistanceTab } from '@/components/assistance/AssistanceTabBar'
import { usePathname } from '@/i18n/navigation'
import { ASSISTANCE_OPEN_EVENT } from '@/lib/assistance/events'
import { isSupportContextPath } from '@/lib/assistance/routes'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'

type OpenOptions = {
  tab?: AssistanceTab
  helpSearch?: string
}

export default function PrimeFxAssistanceWidget() {
  const t = useTranslations('assistance')
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()
  const onSupportPage = isSupportContextPath(pathname)

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [initialTab, setInitialTab] = useState<AssistanceTab | undefined>()
  const [initialHelpSearch, setInitialHelpSearch] = useState<string | undefined>()

  useEffect(() => {
    if (!onSupportPage) {
      setOpen(false)
      setMinimized(false)
    }
  }, [onSupportPage])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OpenOptions>).detail
      setInitialTab(detail?.tab)
      setInitialHelpSearch(detail?.helpSearch)
      setOpen(true)
      setMinimized(false)
    }
    window.addEventListener(ASSISTANCE_OPEN_EVENT, handler)
    return () => window.removeEventListener(ASSISTANCE_OPEN_EVENT, handler)
  }, [])

  if (!onSupportPage) {
    return null
  }

  const panelVariants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }

  return (
    <>
      <AnimatePresence>
        {open && !minimized ? (
          <m.div
            key="assistance-panel"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={panelVariants}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl shadow-black/10',
              'inset-x-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] top-auto h-[min(78vh,680px)]',
              'xs:inset-x-3',
              'sm:inset-x-auto sm:bottom-24 sm:right-5 sm:h-[min(72vh,660px)] sm:w-[min(100vw-2rem,400px)]',
              'md:bottom-6 md:right-6 md:h-[min(80vh,720px)] md:w-[400px]',
              'lg:w-[420px]'
            )}
            role="dialog"
            aria-label={t('title')}
            aria-modal="true"
          >
            <AssistancePanel
              onClose={() => setOpen(false)}
              onMinimize={() => setMinimized(true)}
              initialTab={initialTab}
              initialHelpSearch={initialHelpSearch}
            />
          </m.div>
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          'fixed z-50 flex flex-col items-end gap-2.5',
          'bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] right-3',
          'sm:right-5',
          'md:bottom-6 md:right-6'
        )}
      >
        <AnimatePresence>
          {minimized ? (
            <m.button
              key="minimized-pill"
              initial={{ opacity: 0, x: 16, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.9 }}
              type="button"
              onClick={() => {
                setMinimized(false)
                setOpen(true)
              }}
              className="flex items-center gap-2.5 rounded-full border border-border bg-card py-2 pl-3 pr-4 text-xs font-semibold shadow-lg ring-1 ring-black/5"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              {t('title')}
            </m.button>
          ) : null}
        </AnimatePresence>

        <m.button
          type="button"
          onClick={() => {
            if (open && !minimized) {
              setOpen(false)
            } else {
              setInitialTab(undefined)
              setInitialHelpSearch(undefined)
              setOpen(true)
              setMinimized(false)
            }
          }}
          whileTap={reducedMotion ? undefined : { scale: 0.92 }}
          whileHover={reducedMotion ? undefined : { scale: 1.04 }}
          className={cn(
            'group relative flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full shadow-xl transition-shadow',
            open && !minimized
              ? 'bg-muted text-foreground shadow-black/10 ring-1 ring-border'
              : 'bg-gradient-to-br from-[#0052ff] via-[#1d4ed8] to-[#2563eb] text-white shadow-[#0052ff]/30 hover:shadow-2xl hover:shadow-[#0052ff]/35'
          )}
          aria-label={open && !minimized ? t('close') : t('open')}
          aria-expanded={open && !minimized}
        >
          {!open || minimized ? (
            <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          ) : null}
          {open && !minimized ? (
            <X className="h-6 w-6" />
          ) : (
            <Headphones className="h-6 w-6 transition-transform group-hover:scale-105" />
          )}
        </m.button>
      </div>
    </>
  )
}
