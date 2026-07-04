'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { syncPendingDeposits } from '@/lib/payments/actions'

const POLL_INTERVAL_MS = 12_000
const POLL_INTERVAL_AFTER_RETURN_MS = 8_000
const MAX_POLL_ATTEMPTS = 40

type SyncPendingDepositsProps = {
  onSynced?: () => void
}

export function SyncPendingDeposits({ onSynced }: SyncPendingDepositsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const onSyncedRef = useRef(onSynced)
  const attemptsRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onSyncedRef.current = onSynced
  }, [onSynced])

  const fromDepositReturn = searchParams.get('deposit') === 'success'
  const pollInterval = fromDepositReturn ? POLL_INTERVAL_AFTER_RETURN_MS : POLL_INTERVAL_MS

  const runSync = useCallback(async (): Promise<boolean> => {
    try {
      const result = await syncPendingDeposits()

      if (result.completed > 0) {
        toast.success('Deposit confirmed', {
          description: `${result.completed} deposit${result.completed === 1 ? '' : 's'} added to your balance.`,
        })
        router.refresh()
        onSyncedRef.current?.()
        window.dispatchEvent(new Event('primefx:transactions-updated'))
        return false
      }

      if (result.checked > 0) {
        window.dispatchEvent(new Event('primefx:transactions-updated'))
      }

      if (fromDepositReturn && result.checked > 0 && attemptsRef.current === 0) {
        const statusHint =
          result.results.find((item) => item.providerStatus)?.message ??
          'Your payment is being confirmed with NOWPayments.'
        toast.info('Payment received — confirming deposit', {
          description: `${statusHint} We check status automatically every few seconds.`,
        })
      }

      return result.stillPending > 0 && result.checked > 0
    } catch {
      return false
    }
  }, [fromDepositReturn, router])

  useEffect(() => {
    attemptsRef.current = 0

    const scheduleNext = (shouldContinue: boolean) => {
      if (!shouldContinue || attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        return
      }

      timerRef.current = setTimeout(() => {
        attemptsRef.current += 1
        void runSync().then((shouldContinue) => {
          if (!shouldContinue && !fromDepositReturn) return
          scheduleNext(shouldContinue || fromDepositReturn)
        })
      }, pollInterval)
    }

    void runSync().then((shouldContinue) => {
      if (!shouldContinue && !fromDepositReturn) return
      scheduleNext(shouldContinue || fromDepositReturn)
    })

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [fromDepositReturn, pollInterval, runSync])

  return null
}
