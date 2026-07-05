/** Shared Supabase row shapes for portfolio, wallet, and transaction queries. */

export type TransactionDbRow = {
  id: string
  user_id?: string | null
  type?: string | null
  amount?: string | number | null
  status?: string | null
  description?: string | null
  reference_id?: string | null
  created_at: string
  [key: string]: unknown
}

export type InvestmentDbRow = {
  id?: string
  amount?: string | number | null
  current_value?: string | number | null
  roi_percentage?: string | number | null
  reference_id?: string | null
  status?: string | null
  created_at: string
  end_date?: string | null
  updated_at?: string | null
  investment_plans?: { name?: string | null; color?: string | null; weekly_roi?: number | null } | null
  [key: string]: unknown
}
