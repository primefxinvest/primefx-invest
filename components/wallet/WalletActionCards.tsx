'use client'

import { Link } from '@/i18n/navigation'
import { Download, Send, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { statusCardSurfaceClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const actionIds = ['deposit', 'withdraw', 'transfer'] as const

const actionConfig = {
  deposit: { icon: Download, iconBg: 'bg-emerald-500', href: '/wallet/deposit' },
  withdraw: { icon: Upload, iconBg: 'bg-orange-500', href: '/wallet/withdraw' },
  transfer: { icon: Send, iconBg: 'bg-[#0052ff]', href: '/wallet/transfer' },
} as const

export default function WalletActionCards() {
  const t = useTranslations('wallet.actions')

  return (
    <div
      className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4"
      aria-label="Wallet actions"
    >
      {actionIds.map((id) => {
        const config = actionConfig[id]
        const Icon = config.icon

        return (
          <Link
            key={id}
            href={config.href}
            className={cn(
              statusCardSurfaceClass,
              'group flex h-full min-h-[4.5rem] items-center gap-3 p-3.5 transition-colors hover:border-primary/20 sm:min-h-[5rem] sm:p-4'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-[1.02]',
                config.iconBg
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t(id)}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t(`${id}Desc`)}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
