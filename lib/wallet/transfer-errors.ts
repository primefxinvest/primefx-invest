const TRANSFER_UNAVAILABLE =
  'Transfer temporarily unavailable. Please try again in a few moments.'

const INTERNAL_MARKERS = [
  'atomic_debit_wallet',
  'atomic_credit_wallet',
  'execute_atomic_wallet_transfer',
  'schema cache',
  'could not find the function',
  'pgrst',
  'supabase',
  'service_role',
  'rpc',
]

export function toTransferUserError(raw: string | undefined | null): string {
  if (!raw?.trim()) return TRANSFER_UNAVAILABLE

  const message = raw.trim()
  const upper = message.toUpperCase()
  const lower = message.toLowerCase()

  if (INTERNAL_MARKERS.some((marker) => lower.includes(marker))) {
    return TRANSFER_UNAVAILABLE
  }

  if (upper.includes('SELF_TRANSFER') || lower.includes('your own account')) {
    return 'You cannot transfer funds to your own account.'
  }

  if (upper.includes('INSUFFICIENT') || lower.includes('insufficient')) {
    return 'Insufficient available balance for this transfer.'
  }

  if (upper.includes('CONCURRENT_UPDATE')) {
    return 'Transfer could not complete due to a concurrent update. Please try again.'
  }

  if (upper.includes('RECIPIENT_WALLET_NOT_FOUND')) {
    return 'Recipient wallet is not set up yet. Ask them to complete account setup.'
  }

  if (upper.includes('SENDER_WALLET_NOT_FOUND')) {
    return 'Your wallet is not available. Please contact support.'
  }

  if (upper.includes('INVALID_AMOUNT')) {
    return 'Enter a valid transfer amount.'
  }

  if (lower.includes('recipient not found')) {
    return 'Recipient not found. Check the email or PrimeFx ID.'
  }

  if (lower.includes('minimum transfer')) {
    return message
  }

  if (lower.includes('maximum transfer')) {
    return message
  }

  if (lower.includes('kyc') || lower.includes('verification')) {
    return message
  }

  if (lower.includes('transaction pin') || lower.includes('two-factor authentication')) {
    return message
  }

  if (lower.includes('authorization required')) {
    return message
  }

  if (lower.includes('signed in')) {
    return message
  }

  if (lower.includes('rate limit')) {
    return message
  }

  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return 'This transfer may have already been processed. Check your transaction history.'
  }

  if (lower.includes('wallet not found')) {
    return 'Recipient wallet is not set up yet. Ask them to complete account setup.'
  }

  return TRANSFER_UNAVAILABLE
}

export { TRANSFER_UNAVAILABLE }
