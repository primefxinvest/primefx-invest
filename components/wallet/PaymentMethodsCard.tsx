'use client'

import { toast } from 'sonner'
import { Bitcoin, Building2, CreditCard, Wallet } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { ListSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchPaymentMethods } from '@/lib/data/queries'
import { cn } from '@/lib/utils'

const methodIcons = {
  bank: Building2,
  crypto: Bitcoin,
  card: CreditCard,
}

const badgeStyles = {
  Primary: 'bg-[#0052ff] text-white',
  Active: 'bg-emerald-100 text-emerald-700',
}

export default function PaymentMethodsCard() {
  const { data: paymentMethods = [], loading, error, reload } = useAsyncData(
    () => fetchPaymentMethods(),
    []
  )

  const handleManage = () => {
    toast.info('Payment methods', {
      description: 'Payment method management will open here.',
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Payment Methods</h2>
        <button
          type="button"
          onClick={handleManage}
          className="text-xs font-semibold text-[#0052ff] hover:underline"
        >
          Manage Methods
        </button>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        errorTitle="Could not load payment methods"
        isEmpty={paymentMethods.length === 0}
        emptyTitle="No payment methods"
        emptyDescription="Add a PrimeFx Card or crypto wallet to deposit and withdraw."
        skeleton={<ListSkeleton rows={3} />}
        compact
      >
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon =
              method.type === 'crypto' && method.label.includes('USDT')
                ? Wallet
                : methodIcons[method.type]

            return (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{method.label}</p>
                    <p className="text-[11px] text-gray-500">{method.detail}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                    badgeStyles[method.badge]
                  )}
                >
                  {method.badge}
                </span>
              </div>
            )
          })}
        </div>
      </AsyncState>
    </div>
  )
}
