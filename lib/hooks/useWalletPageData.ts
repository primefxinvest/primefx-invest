'use client'

import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletData, fetchWalletTransactions } from '@/lib/data/queries'

export function useWalletPageData() {
  const walletQuery = useAsyncData(() => fetchWalletData(), [])
  const transactionsQuery = useAsyncData(() => fetchWalletTransactions(), [])

  const reloadAll = () => {
    walletQuery.reload()
    transactionsQuery.reload()
  }

  return {
    wallet: walletQuery.data,
    transactions: transactionsQuery.data ?? [],
    loading: walletQuery.loading || transactionsQuery.loading,
    error: walletQuery.error ?? transactionsQuery.error,
    reload: reloadAll,
    walletLoading: walletQuery.loading,
    walletError: walletQuery.error,
    reloadWallet: walletQuery.reload,
    transactionsLoading: transactionsQuery.loading,
    transactionsError: transactionsQuery.error,
    reloadTransactions: transactionsQuery.reload,
  }
}
