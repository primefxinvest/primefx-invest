'use client'

import { useCallback, useEffect, useState } from 'react'

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  initialData?: T
) {
  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(initialData === undefined)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await loader()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    if (initialData !== undefined) return

    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await loader()
        if (active) setData(result)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load data')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loader identity follows deps
  }, [initialData, ...deps])

  return { data, loading, error, reload }
}
