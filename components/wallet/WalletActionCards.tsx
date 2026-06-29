'use client'

import Link from 'next/link'
import {
  CreditCard,
  Download,
  RefreshCw,
  Send,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

const actions = [
  {
    id: 'deposit',
    label: 'Deposit',
    description: 'Add funds to wallet',
    icon: Download,
    iconBg: 'bg-emerald-500',
    href: '/wallet/deposit',
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    description: 'Withdraw your funds',
    icon: Upload,
    iconBg: 'bg-orange-500',
    href: '/wallet/withdraw',
  },
  {
    id: 'transfer',
    label: 'Transfer',
    description: 'Transfer to another user',
    icon: Send,
    iconBg: 'bg-[#0052ff]',
    href: '/wallet/transfer',
  },
  {
    id: 'convert',
    label: 'Convert',
    description: 'Convert currency',
    icon: RefreshCw,
    iconBg: 'bg-purple-500',
    href: null,
  },
  {
    id: 'payment',
    label: 'Payment',
    description: 'Make a payment',
    icon: CreditCard,
    iconBg: 'bg-[#0052ff]',
    href: null,
  },
]

export default function WalletActionCards() {
  const handleStub = (label: string) => {
    toast.info(`${label} flow`, {
      description: `${label} will be available in a future release.`,
    })
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map((action) => {
        const Icon = action.icon
        const content = (
          <>
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${action.iconBg} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{action.label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{action.description}</p>
          </>
        )

        if (action.href) {
          return (
            <Link
              key={action.id}
              href={action.href}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {content}
            </Link>
          )
        }

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => handleStub(action.label)}
            className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
