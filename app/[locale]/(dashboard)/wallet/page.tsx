'use client'

import { Link } from '@/i18n/navigation'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import WalletBalanceCards from '@/components/wallet/WalletBalanceCards'
import WalletActionCards from '@/components/wallet/WalletActionCards'
import { WalletBalanceDonut } from '@/components/wallet/WalletCharts.lazy'
import WalletHealthCard from '@/components/wallet/WalletHealthCard'
import WalletPrimeAIInsight from '@/components/wallet/WalletPrimeAIInsight'
import WalletTransactionTable from '@/components/wallet/WalletTransactionTable'
import WalletActivitySummary from '@/components/wallet/WalletActivitySummary'
import PaymentMethodsCard from '@/components/wallet/PaymentMethodsCard'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { pageStackClass, gridGapClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

export default function WalletPage() {
  const t = useTranslations('wallet.overview')
  const tTx = useTranslations('wallet.transactions')

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <WalletPageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
            {t('settings')}
          </Link>
        }
      />

      <KycFinancialBanner />

      <section aria-label={t('title')} className="space-y-4">
        <WalletBalanceCards />
        <WalletActionCards />
      </section>

      <section
        aria-label={t('title')}
        className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', gridGapClass)}
      >
        <WalletBalanceDonut />
        <WalletHealthCard />
        <div className="sm:col-span-2 lg:col-span-1">
          <WalletPrimeAIInsight />
        </div>
      </section>

      <section aria-label={tTx('tableTitle')}>
        <WalletTransactionTable />
      </section>

      <section aria-label="Wallet activity and payment methods" className={cn('grid grid-cols-1 xl:grid-cols-[1fr_min(380px,100%)]', gridGapClass)}>
        <WalletActivitySummary />
        <PaymentMethodsCard />
      </section>
    </div>
  )
}
