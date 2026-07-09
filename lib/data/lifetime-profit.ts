import { supabase } from '@/lib/supabase'
import { formatCurrency, toNumber } from '@/lib/data/format'

/** Sum credited daily profits from investment_profit_history (single source of truth). */
export function sumLifetimeProfitUsd(
  rows: Array<{ amount_usd?: string | number | null | undefined }>
): number {
  const total = (rows ?? []).reduce((sum, row) => sum + toNumber(row.amount_usd), 0)
  return Math.round(total * 100) / 100
}

export async function fetchLifetimeProfitUsd(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('investment_profit_history')
    .select('amount_usd')
    .eq('user_id', userId)

  if (error) {
    console.error('[lifetime-profit] fetch failed:', error.message)
    return 0
  }

  return sumLifetimeProfitUsd(data ?? [])
}

export async function fetchInvestmentLifetimeProfitUsd(investmentId: string): Promise<number> {
  const { data, error } = await supabase
    .from('investment_profit_history')
    .select('amount_usd')
    .eq('investment_id', investmentId)

  if (error) {
    console.error('[lifetime-profit] investment fetch failed:', error.message)
    return 0
  }

  return sumLifetimeProfitUsd(data ?? [])
}

export async function fetchUserInvestmentProfitMap(userId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('investment_profit_history')
    .select('investment_id, amount_usd')
    .eq('user_id', userId)

  if (error) {
    console.error('[lifetime-profit] investment map fetch failed:', error.message)
    return new Map()
  }

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    const id = String(row.investment_id)
    const next = (map.get(id) ?? 0) + toNumber(row.amount_usd)
    map.set(id, Math.round(next * 100) / 100)
  }
  return map
}

export function formatLifetimeProfitUsd(amount: number): string {
  return formatCurrency(amount, { signed: true })
}
