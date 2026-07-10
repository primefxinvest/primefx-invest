import type { PaymentProviderId } from './types'

function getErrorText(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

function matchesCode(message: string, code: string) {
  return message.includes(code)
}

function normalizeMessage(message: string) {
  return message.toLowerCase().trim()
}

function isNowPaymentsAuthError(message: string) {
  const lower = normalizeMessage(message)
  return (
    lower.includes('invalid api key') ||
    lower.includes('invalid api-key') ||
    lower.includes('api key is not configured') ||
    lower.includes('unauthorized') ||
    lower.includes('authentication failed') ||
    lower.includes('invalid credentials')
  )
}

function isNowPaymentsAvailabilityError(message: string) {
  const lower = normalizeMessage(message)
  return (
    isNowPaymentsAuthError(message) ||
    lower.includes('not configured') ||
    lower.includes('jwt credentials') ||
    lower.includes('forbidden') ||
    lower.includes('access denied')
  )
}

function mapNowPaymentsDepositError(message: string) {
  const lower = normalizeMessage(message)

  if (
    lower.includes('ipn_callback_url') &&
    (lower.includes('valid uri') || lower.includes('invalid_request_params'))
  ) {
    return 'Payment webhooks are misconfigured. Set PAYMENT_WEBHOOK_BASE_URL in .env to your public app URL (e.g. https://yourdomain.com) with no trailing comma, then restart the server.'
  }
  if (lower.includes('invalid payment webhook url') || lower.includes('payment webhook url')) {
    return 'Payment webhooks are misconfigured. Set PAYMENT_WEBHOOK_BASE_URL in .env to a valid URL, then restart the server.'
  }

  if (isNowPaymentsAuthError(message) || message.includes('INVALID_API_KEY')) {
    return 'This payment method is temporarily unavailable. Please try again later or contact support.'
  }
  if (
    lower.includes('currency') &&
    (lower.includes('not supported') ||
      lower.includes('not available') ||
      lower.includes('unavailable') ||
      lower.includes('invalid_request_params'))
  ) {
    return 'This currency is not available on the payment checkout right now. You can still pay in USD and choose another coin on the payment page, or try Binance Pay for BNB/BUSD.'
  }
  if (
    lower.includes('crypto amount is less than minimal') ||
    lower.includes('less than minimal') ||
    (lower.includes('amount') && lower.includes('minimal'))
  ) {
    return 'Deposit amount is below the minimum required for this cryptocurrency. Increase your deposit amount and try again.'
  }
  if (lower.includes('amount') && (lower.includes('too low') || lower.includes('too small') || lower.includes('minimum'))) {
    return 'Deposit amount is below the minimum required for this cryptocurrency. Increase your deposit amount and try again.'
  }
  if (lower.includes('amount') && (lower.includes('too high') || lower.includes('maximum'))) {
    return 'The deposit amount exceeds the limit for this payment method. Please try a smaller amount.'
  }
  if (
    lower.includes('timeout') ||
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('econnrefused')
  ) {
    return 'We could not connect to the payment provider. Please try again in a moment.'
  }
  if (lower.includes('not configured') || lower.includes('jwt credentials')) {
    return providerUnavailableUserMessage('now_payments')
  }
  if (lower.includes('nowpayments invoice failed') || lower.includes('nowpayments request failed')) {
    return 'We could not start your deposit. Please try again or choose a different payment method.'
  }

  return 'We could not start your deposit. Please try again or choose a different payment method.'
}

function mapNowPaymentsWithdrawalError(message: string) {
  const lower = normalizeMessage(message)

  if (isNowPaymentsAvailabilityError(message)) {
    return 'Withdrawals are temporarily unavailable. Please try again later or contact support.'
  }
  if (lower.includes('insufficient') || lower.includes('balance')) {
    return 'Withdrawal could not be processed due to insufficient funds. Please check your balance and try again.'
  }
  if (lower.includes('address') && (lower.includes('invalid') || lower.includes('not valid'))) {
    return 'The wallet address looks invalid. Please check it and try again.'
  }
  if (
    lower.includes('timeout') ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  ) {
    return 'We could not submit your withdrawal. Please try again in a moment.'
  }

  return 'We could not submit your withdrawal. Please try again later or contact support.'
}

export function logPaymentProviderError(
  provider: PaymentProviderId | 'unknown',
  err: unknown,
  context?: Record<string, unknown>
) {
  console.error(`[payments/${provider}]`, {
    error: getErrorText(err),
    ...context,
  })
}

export function providerUnavailableUserMessage(provider: PaymentProviderId) {
  if (provider === 'binance_pay') {
    return 'Binance Pay is not available right now. Please choose another currency such as USDT.'
  }
  return 'This payment method is not available right now. Please contact support or try again later.'
}

export function toUserDepositError(
  err: unknown,
  provider: PaymentProviderId
): string {
  const message = getErrorText(err)
  logPaymentProviderError(provider, err, { userFacing: toUserDepositErrorMessage(message, provider) })

  return toUserDepositErrorMessage(message, provider)
}

function extractBinanceRequestIp(message: string): string | null {
  const match = message.match(/request ip:\s*([0-9a-f.:]+)/i)
  return match?.[1] ?? null
}

function toUserDepositErrorMessage(message: string, provider: PaymentProviderId) {
  if (provider === 'binance_pay') {
    if (matchesCode(message, '400004') || message.includes('Invalid API-key, IP, or permissions')) {
      const requestIp = extractBinanceRequestIp(message)
      if (requestIp) {
        return `Binance Pay blocked this server (IP ${requestIp}). In the Binance Pay merchant dashboard, open API settings and whitelist that IP address, then try again. You can use NOWPayments with USDT in the meantime.`
      }
      return 'Binance Pay could not authenticate this request. Check your API key and whitelist your server IP in the Binance Pay merchant dashboard, or use NOWPayments with USDT.'
    }
    if (matchesCode(message, '400606') || message.includes('no accessibility')) {
      return 'Binance Pay is not available for deposits at the moment. Please choose another currency.'
    }
    if (matchesCode(message, '400002')) {
      return 'Binance Pay could not verify the payment request. Please try again later or use another currency.'
    }
    if (matchesCode(message, '400003')) {
      return 'Binance Pay could not process your request. Please try again.'
    }
    if (matchesCode(message, '400005')) {
      return 'Binance Pay is temporarily unavailable. Please try another currency.'
    }
    if (
      message.includes('Could not reach Binance Pay') ||
      message.toLowerCase().includes('timeout') ||
      message.toLowerCase().includes('econnrefused')
    ) {
      return 'We could not connect to Binance Pay. Please try again or choose another currency such as USDT.'
    }
    if (message.includes('not configured')) {
      return providerUnavailableUserMessage('binance_pay')
    }

    return 'Binance Pay could not start your deposit. Please try another currency or try again later.'
  }

  return mapNowPaymentsDepositError(message)
}

export function toUserWithdrawalError(err: unknown): string {
  const message = getErrorText(err)
  const userMessage = mapNowPaymentsWithdrawalError(message)
  logPaymentProviderError('now_payments', err, { userFacing: userMessage })

  return userMessage
}
