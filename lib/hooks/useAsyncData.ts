'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_ASYNC_CACHE_TTL_MS,
  invalidateAsyncCache,
  loadWithAsyncCache,
} from '@/lib/hooks/async-cache'
import { toUserFacingError } from '@/lib/errors/user-facing'

export type UseAsyncDataOptions = {
  /** Dedupe requests and reuse results across components (e.g. notifications, wallet). */
  cacheKey?: string
  cacheTtlMs?: number
  /** Reject with timeout error after this many ms (prevents infinite skeletons). */
  timeoutMs?: number
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  initialData?: T,
  options?: UseAsyncDataOptions
) {
  const [data, setDataState] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(initialData === undefined)
  const [error, setError] = useState<string | null>(null)

  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const stableLoader = useCallback(() => loaderRef.current(), [])

  const cacheKey = options?.cacheKey
  const cacheTtlMs = options?.cacheTtlMs ?? DEFAULT_ASYNC_CACHE_TTL_MS
  const timeoutMs = options?.timeoutMs

  const runWithTimeout = useCallback(
    async () => {
      const promise = cacheKey
        ? loadWithAsyncCache(cacheKey, stableLoader, cacheTtlMs)
        : stableLoader()

      if (!timeoutMs) return promise

      return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs)
        }),
      ])
    },
    [cacheKey, cacheTtlMs, stableLoader, timeoutMs, ...deps]
  )

  const runLoader = runWithTimeout

  const setData = useCallback((value: T | undefined | ((prev: T | undefined) => T | undefined)) => {
    setDataState(value)
  }, [])

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true)
    }
    setError(null)
    if (cacheKey) {
      invalidateAsyncCache(cacheKey)
    }
    try {
      const result = await runLoader()
      setDataState(result)
    } catch (err) {
      setError(toUserFacingError(err))
    } finally {
      setLoading(false)
    }
  }, [cacheKey, runLoader])

  useEffect(() => {
    if (initialData !== undefined) return

    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await runLoader()
        if (active) setDataState(result)
      } catch (err) {
        if (active) {
          setError(toUserFacingError(err))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stableLoader keeps loader identity stable
  }, [initialData, runLoader, ...deps])

  return {
    data,
    loading: loading && data === undefined,
    isRefreshing: loading && data !== undefined,
    error,
    reload,
    setData,
  }
}
