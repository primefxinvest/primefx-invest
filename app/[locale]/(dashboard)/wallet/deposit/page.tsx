import { DepositPageView } from '@/components/wallet/DepositPageView'
import { fetchPaymentProviderOptionsServer } from '@/lib/payments/options-server'

export default async function WalletDepositPage() {
  const paymentOptions = await fetchPaymentProviderOptionsServer()

  return <DepositPageView initialPaymentOptions={paymentOptions} />
}
