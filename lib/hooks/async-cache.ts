type CacheEntry = {
  data: unknown
  fetchedAt: number
}

const resultCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

export const DEFAULT_ASYNC_CACHE_TTL_MS = 30_000

export function getAsyncCacheEntry<T>(key: string, ttlMs: number): T | undefined {
  const entry = resultCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.fetchedAt > ttlMs) {
    resultCache.delete(key)
    return undefined
  }
  return entry.data as T
}

export function setAsyncCacheEntry(key: string, data: unknown) {
  resultCache.set(key, { data, fetchedAt: Date.now() })
}

export function invalidateAsyncCache(key?: string) {
  if (key) {
    resultCache.delete(key)
    inflight.delete(key)
    return
  }
  resultCache.clear()
  inflight.clear()
}

export async function loadWithAsyncCache<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const cached = getAsyncCacheEntry<T>(key, ttlMs)
  if (cached !== undefined) return cached

  const pending = inflight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const promise = loader()
    .then((data) => {
      setAsyncCacheEntry(key, data)
      inflight.delete(key)
      return data
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

/** Returns cached data if present and younger than maxStaleMs (may be past fresh TTL). */
export function getStaleAsyncCacheEntry<T>(key: string, maxStaleMs: number): T | undefined {
  const entry = resultCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.fetchedAt > maxStaleMs) {
    resultCache.delete(key)
    return undefined
  }
  return entry.data as T
}

/**
 * Stale-while-revalidate: serve cached data immediately when stale but within maxStaleMs,
 * then refresh in the background.
 */
export async function loadWithStaleWhileRevalidate<T>(
  key: string,
  loader: () => Promise<T>,
  freshTtlMs: number,
  staleTtlMs: number,
  onUpdated?: (data: T) => void
): Promise<T> {
  const entry = resultCache.get(key)
  const now = Date.now()

  if (entry) {
    const age = now - entry.fetchedAt
    const cached = entry.data as T

    if (age <= freshTtlMs) {
      return cached
    }

    if (age <= staleTtlMs) {
      if (!inflight.has(key)) {
        const promise = loader()
          .then((data) => {
            setAsyncCacheEntry(key, data)
            inflight.delete(key)
            onUpdated?.(data)
            return data
          })
          .catch(() => {
            inflight.delete(key)
          })
        inflight.set(key, promise as Promise<T>)
      }
      return cached
    }
  }

  return loadWithAsyncCache(key, loader, freshTtlMs)
}
