'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrimeFxId } from '@/lib/wallet/primefx-id'
import { cn } from '@/lib/utils'

interface UserTransferIdsCardProps {
  userId: string
  className?: string
}

export function UserTransferIdsCard({ userId, className }: UserTransferIdsCardProps) {
  const t = useTranslations('profile.transferIds')

  const primeFxId = useMemo(() => (userId ? formatPrimeFxId(userId) : ''), [userId])

  if (!primeFxId) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(primeFxId)
      toast.success(t('primeFxIdCopied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card p-6 shadow-sm', className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-secondary/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">{t('primeFxIdLabel')}</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">{primeFxId}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <Copy className="h-3.5 w-3.5" />
            {t('copyPrimeFxId')}
          </button>
        </div>
      </div>
    </div>
  )
}
