import { Suspense } from 'react'
import { SyncPendingDeposits } from '@/components/wallet/SyncPendingDeposits'

export default function TransactionsSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SyncPendingDeposits />
      </Suspense>
      {children}
    </>
  )
}
