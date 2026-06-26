'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'es', label: 'Spanish', short: 'ES' },
  { value: 'fr', label: 'French', short: 'FR' },
  { value: 'de', label: 'German', short: 'DE' },
] as const

const LOCALE_STORAGE_KEY = 'primefx-locale'

export function NavbarLanguageMenu() {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState('en')
  const rootRef = useRef<HTMLDivElement>(null)

  const active = LANGUAGES.find((item) => item.value === language) ?? LANGUAGES[0]

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && LANGUAGES.some((item) => item.value === stored)) {
      setLanguage(stored)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleSelect = (value: string) => {
    setLanguage(value)
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe className="size-4 shrink-0" />
        <span className="text-xs font-semibold md:hidden">{active.short}</span>
        <span className="hidden text-sm font-medium md:inline">{active.label}</span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
          {LANGUAGES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary',
                language === item.value && 'bg-primary/5 text-primary'
              )}
            >
              <span>{item.label}</span>
              {language === item.value ? <Check className="size-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
