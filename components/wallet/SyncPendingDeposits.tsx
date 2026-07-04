'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { syncPendingDeposits } from '@/lib/payments/actions'

type SyncPendingDepositsProps = {
  onSynced?: () => void
}

export function SyncPendingDeposits({ onSynced }: SyncPendingDepositsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ranRef = useRef(false)
  const onSyncedRef = useRef(onSynced)

  useEffect(() => {
    onSyncedRef.current = onSynced
  }, [onSynced])

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const fromDepositReturn = searchParams.get('deposit') === 'success'

    void syncPendingDeposits()
      .then((result) => {
        if (result.completed > 0) {
          toast.success('Deposit confirmed', {
            description: `${result.completed} deposit${result.completed === 1 ? '' : 's'} added to your balance.`,
          })
          router.refresh()
          onSyncedRef.current?.()
          return
        }

        if (fromDepositReturn && result.checked > 0) {
          toast.info('Payment received — confirming deposit', {
            description:
              'Your payment is still being confirmed. Balance will update automatically in a moment.',
          })
        }
      })
      .catch(() => {
        // Non-blocking: webhooks may still complete the deposit later.
      })
  }, [router, searchParams])

  return null
}
