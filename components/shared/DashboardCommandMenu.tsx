'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Search, X } from 'lucide-react'
import { INVESTOR_NAV_ITEMS } from '@/lib/investor/navigation'
import { cn } from '@/lib/utils'

interface SearchItem {
  href: string
  label: string
  group: string
  keywords?: string[]
}

const EXTRA_SEARCH_ITEMS: SearchItem[] = [
  { href: '/settings', label: 'Settings', group: 'Account', keywords: ['preferences', 'security', 'password'] },
  { href: '/profile', label: 'Profile', group: 'Account', keywords: ['avatar', 'account'] },
  { href: '/notifications', label: 'Notifications', group: 'Account', keywords: ['alerts', 'updates'] },
  { href: '/legal', label: 'Legal Center', group: 'Help', keywords: ['terms', 'privacy', 'policy'] },
  { href: '/contact', label: 'Contact Support', group: 'Help', keywords: ['help', 'support'] },
]

const SEARCH_ITEMS: SearchItem[] = [
  ...INVESTOR_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: item.label,
    group: 'Pages',
    keywords: [item.href.replace('/', '')],
  })),
  ...EXTRA_SEARCH_ITEMS,
]

interface DashboardCommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardCommandMenu({ open, onOpenChange }: DashboardCommandMenuProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return SEARCH_ITEMS.slice(0, 8)

    return SEARCH_ITEMS.filter((item) => {
      const haystack = [item.label, item.group, ...(item.keywords ?? [])].join(' ').toLowerCase()
      return haystack.includes(normalized)
    }).slice(0, 8)
  }, [query])

  const close = useCallback(() => {
    onOpenChange(false)
    setQuery('')
    setActiveIndex(0)
  }, [onOpenChange])

  const navigate = useCallback(
    (href: string) => {
      close()
      router.push(href)
    },
    [close, router]
  )

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
      }

      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault()
        navigate(results[activeIndex].href)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, close, navigate, open, results])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close search"
        onClick={close}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, plans, insights..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matching pages found.
            </p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.href}
                type="button"
                onClick={() => navigate(item.href)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors',
                  index === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                )}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.group}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>Use ↑↓ to navigate, Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}

export function useDashboardCommandMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return { open, setOpen }
}
