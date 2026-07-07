'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'primefx:market-watchlist'

function readWatchlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function useMarketWatchlist() {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setFavorites(new Set(readWatchlist()))
    setReady(true)
  }, [])

  const persist = useCallback((next: Set<string>) => {
    setFavorites(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
    }
  }, [])

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(favorites)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persist(next)
    },
    [favorites, persist]
  )

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  return { favorites, toggle, isFavorite, ready }
}
