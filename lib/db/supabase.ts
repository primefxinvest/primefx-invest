import { supabase } from '@/lib/supabase'

// User functions
export async function getUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getUserPortfolio(userId: string) {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Investment functions
export async function getUserInvestments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        investment_plans (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getInvestmentPlans() {
  try {
    const { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .order('minimum_investment', { ascending: true })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createInvestment(investment: {
  user_id: string
  plan_id: string
  plan_name: string
  amount: number
  status: string
}) {
  try {
    const { data, error } = await supabase
      .from('investments')
      .insert([
        {
          user_id: investment.user_id,
          plan_id: investment.plan_id,
          amount: investment.amount,
          status: investment.status,
        },
      ])
      .select()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Transaction functions
export async function getUserTransactions(userId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createTransaction(transaction: any) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Wallet functions
export async function getWallet(userId: string) {
  try {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateWalletBalance(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('wallet_balances')
      .update(updates)
      .eq('user_id', userId)
      .select()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Chat functions
export async function getChatHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function saveChatMessage(userId: string, userMessage: string, aiResponse: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          user_message: userMessage,
          ai_response: aiResponse,
        },
      ])
      .select()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getPaymentMethods(userId: string) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getReferrals(userId: string) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getUserCourses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_courses')
      .select('*')
      .eq('user_id', userId)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getMarketAssets() {
  try {
    const { data, error } = await supabase
      .from('market_assets')
      .select('*')
      .order('symbol', { ascending: true })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getUserActivityLogs(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createUserActivityLog(entry: {
  user_id: string
  action: string
  device?: string
}) {
  try {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .insert([
        {
          user_id: entry.user_id,
          action: entry.action,
          device: entry.device ?? null,
        },
      ])
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
