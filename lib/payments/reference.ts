import { randomBytes } from 'crypto'

export type PaymentReferenceKind = 'deposit' | 'withdrawal' | 'investment' | 'transfer'

/** Short, human-readable reference (e.g. DEP-20260626-A1B2C3D4). */
export function generatePaymentReference(kind: PaymentReferenceKind): string {
  const now = new Date()
  const ymd =
    String(now.getUTCFullYear()) +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0')
  const token = randomBytes(4).toString('hex').toUpperCase()
  const prefix =
    kind === 'deposit' ? 'DEP' : kind === 'withdrawal' ? 'WD' : kind === 'transfer' ? 'TRF' : 'INV'
  return `${prefix}-${ymd}-${token}`
}
