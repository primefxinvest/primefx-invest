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
