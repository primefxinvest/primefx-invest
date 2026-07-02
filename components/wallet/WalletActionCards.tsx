'use client'

import { Link } from '@/i18n/navigation'
import {
  CreditCard,
  Download,
  RefreshCw,
  Send,
  Upload,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

const actionIds = ['deposit', 'withdraw', 'transfer', 'convert', 'payment'] as const

const actionConfig = {
  deposit: { icon: Download, iconBg: 'bg-emerald-500', href: '/wallet/deposit' },
  withdraw: { icon: Upload, iconBg: 'bg-orange-500', href: '/wallet/withdraw' },
  transfer: { icon: Send, iconBg: 'bg-[#0052ff]', href: '/wallet/transfer' },
  convert: { icon: RefreshCw, iconBg: 'bg-purple-500', href: null },
  payment: { icon: CreditCard, iconBg: 'bg-[#0052ff]', href: null },
} as const

export default function WalletActionCards() {
  const t = useTranslations('wallet.actions')

  const handleStub = (label: string) => {
    toast.info(t('flow', { label }), {
      description: t('comingSoon', { label }),
    })
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {actionIds.map((id) => {
        const config = actionConfig[id]
        const Icon = config.icon
        const label = t(id)
        const description = t(`${id}Desc`)

        const content = (
          <>
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBg} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          </>
        )

        if (config.href) {
          return (
            <Link
              key={id}
              href={config.href}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {content}
            </Link>
          )
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => handleStub(label)}
            className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
