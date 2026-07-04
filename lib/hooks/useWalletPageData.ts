'use client'

import { useEffect } from 'react'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useUserWalletRealtime } from '@/lib/hooks/useTransactionsRealtime'
import { useLiveTransactions } from '@/lib/hooks/useLiveTransactions'
import { fetchWalletData, fetchWalletTransactions } from '@/lib/data/queries'

export function useWalletPageData() {
  const user = useSessionUser()
  const walletQuery = useAsyncData(() => fetchWalletData(), [])
  const transactionsQuery = useLiveTransactions(() => fetchWalletTransactions(), {
    userId: user.id,
    variant: 'wallet',
  })

  useUserWalletRealtime({
    userId: user.id,
    enabled: Boolean(user.id),
    onUpdate: () => {
      void walletQuery.reload({ silent: true })
    },
  })

  useEffect(() => {
    const reloadWallet = () => {
      void walletQuery.reload({ silent: true })
    }

    window.addEventListener('primefx:wallet-updated', reloadWallet)
    return () => window.removeEventListener('primefx:wallet-updated', reloadWallet)
  }, [walletQuery.reload])

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
