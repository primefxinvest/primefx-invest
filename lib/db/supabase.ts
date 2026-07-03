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
      .eq('is_active', true)
      .eq('visibility', 'public')
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
          current_value: investment.amount,
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

export async function getAcademyCourses() {
  try {
    const { data, error } = await supabase
      .from('academy_courses')
      .select('*')
      .order('created_at', { ascending: true })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getCommunityPosts(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        users ( full_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getSupportTickets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createSupportTicket(ticket: {
  user_id: string
  subject: string
  description: string
  priority?: string
}) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([
        {
          user_id: ticket.user_id,
          subject: ticket.subject,
          description: ticket.description,
          priority: ticket.priority ?? 'medium',
        },
      ])
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getUserPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function upsertUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...preferences, updated_at: new Date().toISOString() })
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getMarketInsights() {
  try {
    const { data, error } = await supabase
      .from('market_insights')
      .select('*')
      .eq('active', true)
      .order('published_at', { ascending: false })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getRewardsTiers() {
  try {
    const { data, error } = await supabase
      .from('rewards_tiers')
      .select('*')
      .order('minimum_points', { ascending: true })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getRewardCatalog() {
  try {
    const { data, error } = await supabase
      .from('reward_catalog')
      .select('*')
      .eq('active', true)
      .order('points_cost', { ascending: true })
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
