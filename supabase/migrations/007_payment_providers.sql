-- Payment provider integration (Binance Pay + NOWPayments)

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(40) NOT NULL CHECK (provider IN ('binance_pay', 'now_payments')),
  provider_payment_id VARCHAR(120),
  order_id VARCHAR(120) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  status VARCHAR(40) NOT NULL DEFAULT 'created',
  amount_usd DECIMAL(15, 2) NOT NULL,
  pay_amount DECIMAL(20, 8),
  pay_currency VARCHAR(30),
  pay_address TEXT,
  fee_amount DECIMAL(15, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(40) NOT NULL,
  payment_id VARCHAR(120),
  event_type VARCHAR(80),
  payload JSONB NOT NULL,
  signature_valid BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_investor_id ON public.payments(investor_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_status ON public.payments(provider, status);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_provider ON public.payment_webhook_logs(provider);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Investors read own payments" ON public.payments;
CREATE POLICY "Investors read own payments" ON public.payments
  FOR SELECT USING (auth.uid() = investor_id);

-- Webhook logs are server-only (service role bypasses RLS)
