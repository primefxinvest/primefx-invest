import 'server-only'

import { roundMoney } from '@/lib/fees/constants'

export type NowPaymentsSettlementSnapshot = {
  requestedAmountUsd: number
  receivedAmountUsd: number
  creditedAmountUsd: number
  actuallyPaid: number | null
  payAmount: number | null
  payCurrency: string | null
  outcomeAmount: number | null
  outcomeCurrency: string | null
  providerStatus: string | null
  isPartial: boolean
}

function readNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Resolve USD received from a NOWPayments payment / IPN payload. */
export function resolveNowPaymentsReceivedUsd(
  payload: Record<string, unknown>,
  requestedUsd: number
): number {
  const outcomeAmount = readNumber(payload.outcome_amount)
  const outcomeCurrency = readString(payload.outcome_currency)?.toLowerCase() ?? 'usd'
  const priceAmount = readNumber(payload.price_amount) ?? requestedUsd
  const priceCurrency = readString(payload.price_currency)?.toLowerCase() ?? 'usd'
  const actuallyPaid = readNumber(payload.actually_paid)
  const payAmount = readNumber(payload.pay_amount)

  if (outcomeCurrency === 'usd' && outcomeAmount != null && outcomeAmount > 0) {
    return roundMoney(outcomeAmount)
  }

  if (priceCurrency === 'usd' && actuallyPaid != null && payAmount != null && payAmount > 0) {
    return roundMoney((actuallyPaid / payAmount) * priceAmount)
  }

  if (priceCurrency === 'usd' && priceAmount > 0) {
    return roundMoney(priceAmount)
  }

  return roundMoney(requestedUsd)
}

export function isNowPaymentsCreditableStatus(status: string): boolean {
  return ['finished', 'confirmed', 'partially_paid'].includes(status.toLowerCase())
}

export function isDepositPaymentSettled(status: string | null | undefined): boolean {
  const normalized = String(status ?? '').toLowerCase()
  return normalized === 'completed' || normalized === 'completed_partial'
}

export function resolveDepositSettlement(
  payload: Record<string, unknown>,
  requestedUsd: number,
  providerStatus: string
): NowPaymentsSettlementSnapshot {
  const receivedAmountUsd = resolveNowPaymentsReceivedUsd(payload, requestedUsd)
  const normalizedStatus = providerStatus.toLowerCase()
  const isPartial =
    normalizedStatus === 'partially_paid' ||
    (requestedUsd > 0 && receivedAmountUsd + 0.009 < requestedUsd)

  return {
    requestedAmountUsd: roundMoney(requestedUsd),
    receivedAmountUsd,
    creditedAmountUsd: receivedAmountUsd,
    actuallyPaid: readNumber(payload.actually_paid),
    payAmount: readNumber(payload.pay_amount),
    payCurrency: readString(payload.pay_currency),
    outcomeAmount: readNumber(payload.outcome_amount),
    outcomeCurrency: readString(payload.outcome_currency),
    providerStatus: normalizedStatus || null,
    isPartial,
  }
}

export function resolveDepositPaymentStatus(settlement: NowPaymentsSettlementSnapshot) {
  return settlement.isPartial ? ('completed_partial' as const) : ('completed' as const)
}

export function resolveDepositTransactionStatus(settlement: NowPaymentsSettlementSnapshot) {
  return settlement.isPartial ? ('Completed_Partial' as const) : ('Completed' as const)
}

export function buildDepositSettlementMetadata(
  settlement: NowPaymentsSettlementSnapshot,
  webhookPayload?: Record<string, unknown>
) {
  return {
    settlement: {
      requested_amount_usd: settlement.requestedAmountUsd,
      received_amount_usd: settlement.receivedAmountUsd,
      credited_amount_usd: settlement.creditedAmountUsd,
      difference_usd: roundMoney(
        settlement.requestedAmountUsd - settlement.creditedAmountUsd
      ),
      provider_status: settlement.providerStatus,
      actually_paid: settlement.actuallyPaid,
      pay_amount: settlement.payAmount,
      pay_currency: settlement.payCurrency,
      outcome_amount: settlement.outcomeAmount,
      outcome_currency: settlement.outcomeCurrency,
      completion_status: settlement.isPartial ? 'COMPLETED_PARTIAL' : 'COMPLETED',
    },
    last_webhook: webhookPayload ?? null,
  }
}

export function readDepositSettlementFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  const settlement = (metadata?.settlement ?? null) as Record<string, unknown> | null
  if (!settlement) return null

  return {
    requestedAmountUsd: readNumber(settlement.requested_amount_usd) ?? 0,
    receivedAmountUsd: readNumber(settlement.received_amount_usd) ?? 0,
    creditedAmountUsd: readNumber(settlement.credited_amount_usd) ?? 0,
    differenceUsd: readNumber(settlement.difference_usd) ?? 0,
    providerStatus: readString(settlement.provider_status),
    completionStatus: readString(settlement.completion_status),
    actuallyPaid: readNumber(settlement.actually_paid),
    payAmount: readNumber(settlement.pay_amount),
    payCurrency: readString(settlement.pay_currency),
    outcomeAmount: readNumber(settlement.outcome_amount),
  }
}
