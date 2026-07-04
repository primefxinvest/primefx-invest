'use client'

import { useCallback, useEffect, useState } from 'react'

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  initialData?: T
) {
  const [data, setDataState] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(initialData === undefined)
  const [error, setError] = useState<string | null>(null)

  const setData = useCallback((value: T | undefined | ((prev: T | undefined) => T | undefined)) => {
    setDataState(value)
  }, [])

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
    }
    setError(null)
    try {
      const result = await loader()
      setDataState(result)
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
        if (active) setDataState(result)
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

  return {
    data,
    loading: loading && data === undefined,
    isRefreshing: loading && data !== undefined,
    error,
    reload,
    setData,
  }
}
