'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { type AppLocale } from '@/i18n/routing'
import { languageOptions } from '@/lib/i18n/locale-config'
import { setStoredLocale } from '@/lib/i18n/locale-storage'
import { cn } from '@/lib/utils'

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

  const active = languageOptions.find((item) => item.value === locale) ?? languageOptions[0]

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

    setStoredLocale(nextLocale)
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
      setOpen(false)
    })
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {languageOptions.map((item) => (
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
        <div className="absolute end-0 top-[calc(100%+6px)] z-50 max-h-[min(24rem,70vh)] min-w-[12rem] overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {languageOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm transition-colors hover:bg-secondary',
                locale === item.value && 'bg-primary/5 text-primary'
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span>{item.flag}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{item.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </span>
              </span>
              {locale === item.value ? <Check className="size-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
