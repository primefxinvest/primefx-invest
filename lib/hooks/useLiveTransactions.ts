'use client'

import { useCallback, useRef } from 'react'
import { mapDbTransactionToItem, type TransactionMapVariant } from '@/lib/data/transaction-map'
import type { TransactionItem } from '@/lib/data/types'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import {
  useUserTransactionsRealtime,
  type TransactionRealtimeRow,
} from '@/lib/hooks/useTransactionsRealtime'

export function useLiveTransactions(
  loader: () => Promise<TransactionItem[]>,
  options: {
    userId?: string
    variant: TransactionMapVariant
    limit?: number
  }
) {
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const stableLoader = useCallback(
    () => loaderRef.current(),
    []
  )

  const { data, loading, error, reload, setData } = useAsyncData(stableLoader, [options.userId])

  const applyRow = useCallback(
    (row: TransactionRealtimeRow, eventType: 'INSERT' | 'UPDATE') => {
      const item = mapDbTransactionToItem(row, options.variant)
      setData((current) => {
        const list = current ?? []

        if (eventType === 'UPDATE') {
          if (list.some((tx) => tx.id === item.id)) {
            return list.map((tx) => (tx.id === item.id ? item : tx))
          }
        }

        const next = [item, ...list.filter((tx) => tx.id !== item.id)]
        return options.limit ? next.slice(0, options.limit) : next
      })
    },
    [options.limit, options.variant, setData]
  )

  useUserTransactionsRealtime({
    userId: options.userId,
    enabled: Boolean(options.userId),
    onInsert: (row) => applyRow(row, 'INSERT'),
    onUpdate: (row) => applyRow(row, 'UPDATE'),
  })

  return { data, loading, error, reload }
}
