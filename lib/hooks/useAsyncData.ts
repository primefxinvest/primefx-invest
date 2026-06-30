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
    reload()
  }, [initialData, reload])

  return { data, loading, error, reload }
}
