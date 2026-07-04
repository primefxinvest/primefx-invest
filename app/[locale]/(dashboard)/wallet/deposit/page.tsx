import { DepositPageView } from '@/components/wallet/DepositPageView'
import { fetchPaymentProviderOptionsServer } from '@/lib/payments/options-server'

export const dynamic = 'force-dynamic'

export default async function WalletDepositPage() {
  const paymentOptions = await fetchPaymentProviderOptionsServer()

  return <DepositPageView initialPaymentOptions={paymentOptions} />
}
