import 'server-only'

import { getAdminContext } from './auth'
import { getServiceRoleKeyIssue, hasAdminServerAccess } from '@/lib/supabase/admin-server'
import {
  getPaymentMode,
  getWebhookBaseUrl,
  isBinancePayConfigured,
  isNowPaymentsConfigured,
} from '@/lib/payments/env'

export interface PlatformSettingsSnapshot {
  adminEmail: string
  adminTier: string
  isBootstrapAdmin: boolean
  serviceRoleConfigured: boolean
  serviceRoleIssue: string | null
  paymentMode: string
  webhookBaseUrl: string
  binancePay: {
    configured: boolean
    webhookUrl: string
    missing: string[]
  }
  nowPayments: {
    configured: boolean
    webhookUrl: string
    payoutWebhookUrl: string
    missing: string[]
  }
  requiredMigrations: string[]
}

function missingEnvVars(vars: Array<[string, string | undefined]>) {
  return vars.filter(([, value]) => !value?.trim()).map(([name]) => name)
}

export async function getPlatformSettingsSnapshot(): Promise<PlatformSettingsSnapshot> {
  const context = await getAdminContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  const webhookBase = getWebhookBaseUrl()
  const serviceRoleIssue = getServiceRoleKeyIssue()

  const binanceMissing = missingEnvVars([
    ['BINANCE_PAY_API_KEY', process.env.BINANCE_PAY_API_KEY],
    ['BINANCE_PAY_API_SECRET', process.env.BINANCE_PAY_API_SECRET],
  ])

  const nowMissing = missingEnvVars([
    ['NOWPAYMENTS_API_KEY', process.env.NOWPAYMENTS_API_KEY],
    ['NOWPAYMENTS_IPN_SECRET', process.env.NOWPAYMENTS_IPN_SECRET],
  ])

  if (!process.env.NOWPAYMENTS_JWT_TOKEN?.trim()) {
    if (!process.env.NOWPAYMENTS_EMAIL?.trim()) {
      nowMissing.push('NOWPAYMENTS_EMAIL')
    }
    if (!process.env.NOWPAYMENTS_PASSWORD?.trim()) {
      nowMissing.push('NOWPAYMENTS_PASSWORD')
    }
  }

  return {
    adminEmail: context.email,
    adminTier: context.roleLabel,
    isBootstrapAdmin: context.isBootstrap,
    serviceRoleConfigured: hasAdminServerAccess(),
    serviceRoleIssue: serviceRoleIssue
      ? {
          missing: 'Add SUPABASE_SERVICE_ROLE_KEY to .env',
          'same-as-anon': 'SUPABASE_SERVICE_ROLE_KEY is the anon key — use service_role secret',
          'wrong-role': 'SUPABASE_SERVICE_ROLE_KEY is not a service_role key',
          'invalid-format': 'SUPABASE_SERVICE_ROLE_KEY format looks invalid',
        }[serviceRoleIssue]
      : null,
    paymentMode: getPaymentMode(),
    webhookBaseUrl: webhookBase,
    binancePay: {
      configured: isBinancePayConfigured(),
      webhookUrl: `${webhookBase}/api/webhooks/binance-pay`,
      missing: binanceMissing,
    },
    nowPayments: {
      configured: isNowPaymentsConfigured(),
      webhookUrl: `${webhookBase}/api/webhooks/nowpayments`,
      payoutWebhookUrl: `${webhookBase}/api/webhooks/nowpayments-payout`,
      missing: nowMissing,
    },
    requiredMigrations: [
      '001_create_schema.sql',
      '004_admin_system.sql',
      '005_signup_bootstrap.sql',
      '006_rewards_tiers.sql',
      '007_payment_providers.sql',
      '008_user_mfa_admin.sql',
      '014_platform_features.sql',
    ],
  }
}
