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
      .order('min_investment', { ascending: true })
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
      .from('wallets')
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
      .from('wallets')
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
