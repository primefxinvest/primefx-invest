import { WithdrawPageView } from '@/components/wallet/WithdrawPageView'
import { fetchPaymentProviderOptionsServer } from '@/lib/payments/options-server'

export default async function WalletWithdrawPage() {
  const paymentOptions = await fetchPaymentProviderOptionsServer()

  return <WithdrawPageView initialPaymentOptions={paymentOptions} />
}
