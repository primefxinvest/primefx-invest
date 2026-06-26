'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeftRight,
  CreditCard,
  Download,
  RefreshCw,
  Send,
  Upload,
} from 'lucide-react'
import DepositModal from '@/components/wallet/DepositModal'
import WithdrawModal from '@/components/wallet/WithdrawModal'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'

const FINANCIAL_ACTIONS = new Set(['deposit', 'withdraw', 'transfer', 'convert', 'payment'])

const actions = [
  {
    id: 'deposit',
    label: 'Deposit',
    description: 'Add funds to wallet',
    icon: Download,
    iconBg: 'bg-emerald-500',
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    description: 'Withdraw your funds',
    icon: Upload,
    iconBg: 'bg-orange-500',
  },
  {
    id: 'transfer',
    label: 'Transfer',
    description: 'Transfer to another user',
    icon: Send,
    iconBg: 'bg-[#0052ff]',
  },
  {
    id: 'convert',
    label: 'Convert',
    description: 'Convert currency',
    icon: RefreshCw,
    iconBg: 'bg-purple-500',
  },
  {
    id: 'payment',
    label: 'Payment',
    description: 'Make a payment',
    icon: CreditCard,
    iconBg: 'bg-[#0052ff]',
  },
]

export default function WalletActionCards() {
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const kyc = useFinancialKycAccess()

  const ensureKyc = (actionId: string, label: string) => {
    if (kyc.loading || kyc.verified) return true

    showKycRequiredToast({
      status: kyc.status === 'rejected' ? 'rejected' : 'pending',
      action:
        actionId === 'withdraw'
          ? 'withdrawal'
          : actionId === 'deposit'
            ? 'deposit'
            : actionId === 'transfer'
              ? 'transfer'
              : actionId === 'convert'
                ? 'convert'
                : 'payment',
      fallback: kyc.summary ?? `Complete KYC before using ${label.toLowerCase()}.`,
      actionButton: {
        label: 'View profile',
        onClick: () => {
          window.location.href = '/profile'
        },
      },
    })
    return false
  }

  const handleAction = (id: string, label: string) => {
    if (FINANCIAL_ACTIONS.has(id) && !ensureKyc(id, label)) {
      return
    }

    if (id === 'deposit') {
      setDepositOpen(true)
      return
    }
    if (id === 'withdraw') {
      setWithdrawOpen(true)
      return
    }

    toast.info(`${label} flow`, {
      description: `${label} will be available in a future release.`,
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action.id, action.label)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${action.iconBg} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{action.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{action.description}</p>
            </button>
          )
        })}
      </div>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  )
}
