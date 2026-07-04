'use client'

import { Link } from '@/i18n/navigation'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import WalletBalanceCards from '@/components/wallet/WalletBalanceCards'
import WalletActionCards from '@/components/wallet/WalletActionCards'
import WalletBalanceDonut from '@/components/wallet/WalletBalanceDonut'
import WalletHealthCard from '@/components/wallet/WalletHealthCard'
import WalletPrimeAIInsight from '@/components/wallet/WalletPrimeAIInsight'
import WalletTransactionTable from '@/components/wallet/WalletTransactionTable'
import WalletActivitySummary from '@/components/wallet/WalletActivitySummary'
import PaymentMethodsCard from '@/components/wallet/PaymentMethodsCard'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { pageStackClass } from '@/lib/layout/spacing'

export default function WalletPage() {
  const t = useTranslations('wallet.overview')
  const tTx = useTranslations('wallet.transactions')

  return (
    <div className={pageStackClass}>
      <WalletPageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
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
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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

      <section aria-label="Wallet activity and payment methods" className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_min(380px,100%)]">
        <WalletActivitySummary />
        <PaymentMethodsCard />
      </section>
    </div>
  )
}
