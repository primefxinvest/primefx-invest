export type PaymentProviderId = 'binance_pay' | 'now_payments'

export type PaymentType = 'deposit' | 'withdrawal'

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'confirming'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'cancelled'

export interface PaymentRecord {
  id: string
  investor_id: string
  provider: PaymentProviderId
  provider_payment_id: string | null
  order_id: string
  type: PaymentType
  status: PaymentStatus
  amount_usd: number
  pay_amount: number | null
  pay_currency: string | null
  pay_address: string | null
  fee_amount: number | null
  metadata: Record<string, unknown>
  transaction_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface CreateDepositResult {
  success: boolean
  paymentId?: string
  orderId?: string
  provider?: PaymentProviderId
  checkoutUrl?: string
  qrCodeLink?: string
  payAddress?: string
  payAmount?: number
  payCurrency?: string
  error?: string
}

export interface CreateWithdrawalResult {
  success: boolean
  paymentId?: string
  orderId?: string
  availableAt?: string
  noticeDays?: number
  error?: string
  code?: string
}

export type PaymentProviderOptions = {
  depositCurrencies: { value: string; label: string; provider: PaymentProviderId }[]
  withdrawalCurrencies: { value: string; label: string }[]
  binancePayEnabled: boolean
  nowPaymentsEnabled: boolean
}
