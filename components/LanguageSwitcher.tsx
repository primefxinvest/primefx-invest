'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

const LANGUAGES: { value: AppLocale; label: string; short: string; flag: string }[] = [
  { value: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { value: 'es', label: 'Spanish', short: 'ES', flag: '🇪🇸' },
  { value: 'de', label: 'German', short: 'DE', flag: '🇩🇪' },
  { value: 'fr', label: 'French', short: 'FR', flag: '🇫🇷' },
]

type LanguageSwitcherProps = {
  className?: string
  variant?: 'navbar' | 'compact'
}

export function LanguageSwitcher({ className, variant = 'navbar' }: LanguageSwitcherProps) {
  const t = useTranslations('common')
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)

  const active = LANGUAGES.find((item) => item.value === locale) ?? LANGUAGES[0]

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

  const handleSelect = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      setOpen(false)
      return
    }

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
      setOpen(false)
    })
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {LANGUAGES.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={pending}
            onClick={() => handleSelect(item.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
              locale === item.value
                ? 'border-[#0052ff] bg-blue-50 text-[#0052ff]'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <span>{item.flag}</span>
            {item.short}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground disabled:opacity-70"
        aria-label={t('language')}
        aria-expanded={open}
      >
        <Globe className="size-4 shrink-0" />
        <span className="text-xs font-semibold sm:hidden">
          {active.flag} {active.short}
        </span>
        <span className="hidden text-sm font-medium sm:inline">
          {active.flag} {active.short}
        </span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
          {LANGUAGES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary',
                locale === item.value && 'bg-primary/5 text-primary'
              )}
            >
              <span className="flex items-center gap-2">
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </span>
              {locale === item.value ? <Check className="size-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
