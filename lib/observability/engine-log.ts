/**
 * Structured logging for investment / referral / cron engines.
 * Failures should always include ids + error + timestamp.
 */

export type EngineLogScope =
  | 'referral.commission'
  | 'referral.bonus'
  | 'referral.payout'
  | 'profit.generation'
  | 'cron.execution'
  | 'wallet.credit'
  | 'transaction.create'

export function logEngine(
  scope: EngineLogScope,
  event: string,
  payload: {
    userId?: string | null
    investmentId?: string | null
    referralId?: string | null
    referenceId?: string | null
    amountUsd?: number | null
    error?: string | null
    [key: string]: unknown
  } = {}
) {
  const entry = {
    scope,
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  }

  if (payload.error) {
    console.error(JSON.stringify(entry))
  } else {
    console.info(JSON.stringify(entry))
  }
}
