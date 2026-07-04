import { getUserTransactions } from '@/lib/db/supabase'

type TransactionRow = Record<string, unknown>

const CACHE_TTL_MS = 30_000
const cache = new Map<string, { data: TransactionRow[]; fetchedAt: number }>()
const inflight = new Map<string, Promise<TransactionRow[]>>()
let invalidationBound = false

function bindInvalidationListener() {
  if (invalidationBound || typeof window === 'undefined') return
  invalidationBound = true
  window.addEventListener('primefx:transactions-updated', () => {
    invalidateUserTransactionsCache()
  })
}

export function invalidateUserTransactionsCache(userId?: string) {
  if (userId) {
    cache.delete(userId)
    inflight.delete(userId)
    return
  }
  cache.clear()
  inflight.clear()
}

export async function getCachedUserTransactions(userId: string): Promise<TransactionRow[]> {
  bindInvalidationListener()

  const cached = cache.get(userId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  const pending = inflight.get(userId)
  if (pending) return pending

  const promise = getUserTransactions(userId)
    .then(({ data }) => {
      const rows = (data ?? []) as TransactionRow[]
      cache.set(userId, { data: rows, fetchedAt: Date.now() })
      inflight.delete(userId)
      return rows
    })
    .catch((err) => {
      inflight.delete(userId)
      throw err
    })

  inflight.set(userId, promise)
  return promise
}
