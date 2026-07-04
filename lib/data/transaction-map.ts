import { formatCurrency, formatDate, formatDateTime, toNumber } from '@/lib/data/format'
import type { TransactionItem } from '@/lib/data/types'

export type TransactionDbRow = {
  id: string
  user_id?: string | null
  type?: string | null
  amount?: unknown
  status?: string | null
  description?: string | null
  reference_id?: string | null
  created_at: string
}

export type TransactionMapVariant = 'recent' | 'wallet'

function normalizeTransactionType(type?: string | null) {
  const value = (type ?? 'deposit').toLowerCase()
  if (value.includes('withdraw')) return 'Withdrawal'
  if (value.includes('investment')) return 'Investment'
  if (value.includes('profit')) return 'Profit'
  if (value.includes('bonus') || value.includes('referral')) return 'Bonus'
  if (value.includes('transfer')) return 'Transfer'
  return 'Deposit'
}

function isCreditTransactionType(type?: string | null) {
  const value = (type ?? '').toLowerCase()
  return (
    value.includes('deposit') ||
    value.includes('bonus') ||
    value.includes('profit') ||
    value.includes('referral') ||
    value.includes('transfer_received')
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export function mapDbTransactionToItem(
  tx: TransactionDbRow,
  variant: TransactionMapVariant
): TransactionItem {
  const amount = toNumber(tx.amount)
  const rawType = String(tx.type ?? '')
  const type = normalizeTransactionType(rawType)
  const isCredit = isCreditTransactionType(rawType)
  const signedAmount = isCredit ? Math.abs(amount) : -Math.abs(amount)
  const created = new Date(tx.created_at)

  const base = {
    id: tx.id,
    type,
    description: tx.description ?? type,
    amount: formatCurrency(signedAmount, { signed: true }),
    amountValue: signedAmount,
    isCredit,
    status: capitalize(tx.status ?? (variant === 'recent' ? 'Completed' : 'Pending')),
    referenceId: tx.reference_id ?? (variant === 'wallet' ? `TXN-${tx.id.slice(0, 8).toUpperCase()}` : undefined),
    createdAt: tx.created_at,
  }

  if (variant === 'recent') {
    return {
      ...base,
      date: formatDateTime(tx.created_at),
    }
  }

  return {
    ...base,
    date: formatDate(tx.created_at),
    time: created.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

export function mapDbTransactionToAdminRow(
  row: Record<string, unknown>
): import('@/lib/admin/types').AdminTransactionRow {
  const user = row.users as Record<string, unknown> | undefined

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    user_email: String(user?.email ?? ''),
    user_name: (user?.full_name as string | null) ?? null,
    type: String(row.type ?? ''),
    amount: Number(row.amount ?? 0),
    status: String(row.status ?? 'Pending'),
    description: (row.description as string | null) ?? null,
    reference_id: (row.reference_id as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
  }
}

export function patchAdminTransactionRow(
  existing: import('@/lib/admin/types').AdminTransactionRow,
  row: TransactionDbRow
): import('@/lib/admin/types').AdminTransactionRow {
  return {
    ...existing,
    type: String(row.type ?? existing.type),
    amount: Number(row.amount ?? existing.amount),
    status: String(row.status ?? existing.status),
    description: (row.description as string | null) ?? existing.description,
    reference_id: (row.reference_id as string | null) ?? existing.reference_id,
    created_at: String(row.created_at ?? existing.created_at),
  }
}
