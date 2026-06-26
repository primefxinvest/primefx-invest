// Database Schema for PrimeFx Invest
// This file defines all database tables and their relationships
// For production, connect to Neon PostgreSQL with Drizzle ORM

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  avatar_url?: string
  investor_tier: 'Starter' | 'Growth' | 'Prime' | 'Elite'
  kyc_status: 'pending' | 'verified' | 'rejected'
  created_at: Date
  updated_at: Date
}

export interface Portfolio {
  id: string
  user_id: string
  total_invested: number
  current_value: number
  profit_loss: number
  roi_percentage: number
  created_at: Date
  updated_at: Date
}

export interface Investment {
  id: string
  user_id: string
  portfolio_id: string
  plan_id: string
  amount: number
  start_date: Date
  end_date: Date
  roi_percentage: number
  status: 'active' | 'completed' | 'cancelled'
  performance_data: Record<string, number>
  created_at: Date
  updated_at: Date
}

export interface InvestmentPlan {
  id: string
  name: string
  weekly_roi: number
  monthly_roi: number
  risk_level: 'Low' | 'Medium' | 'Medium-High' | 'High' | 'Very High'
  min_investment: number
  max_investment?: number
  duration_months: number
  payout_frequency: 'Daily' | 'Weekly' | 'Monthly'
  capital_access: 'Anytime' | 'Fixed' | 'Flexible'
  investor_count: number
  created_at: Date
}

export interface Wallet {
  id: string
  user_id: string
  available_balance: number
  pending_balance: number
  bonus_balance: number
  total_balance: number
  currency: string
  updated_at: Date
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'profit' | 'bonus'
  amount: number
  status: 'completed' | 'pending' | 'failed'
  description: string
  reference_id: string
  created_at: Date
}

export interface ChatMessage {
  id: string
  user_id: string
  user_message: string
  ai_response: string
  conversation_id: string
  created_at: Date
}

export interface AcademyCourse {
  id: string
  title: string
  category: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration_hours: number
  video_count: number
  quiz_count: number
  created_at: Date
}

export interface UserCourse {
  id: string
  user_id: string
  course_id: string
  progress: number
  completed: boolean
  completed_at?: Date
  enrolled_at: Date
}

export interface CommunityPost {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  likes: number
  comments_count: number
  created_at: Date
  updated_at: Date
}

export interface Referral {
  id: string
  referrer_id: string
  referred_user_id: string
  bonus_earned: number
  status: 'pending' | 'completed'
  created_at: Date
}

export interface RewardsTier {
  id: string
  tier_name: string
  min_points: number
  max_points?: number
  benefits: string[]
  bonus_percentage: number
  created_at: Date
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: Date
}

export interface PaymentMethod {
  id: string
  user_id: string
  type: 'bank_account' | 'crypto' | 'card'
  details: Record<string, string>
  is_primary: boolean
  created_at: Date
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_user_id?: string
  details: Record<string, unknown>
  created_at: Date
}

// Database Relationships Summary:
// Users (1) -> (Many) Portfolios
// Users (1) -> (Many) Investments
// Users (1) -> (Many) Wallets
// Users (1) -> (Many) Transactions
// Users (1) -> (Many) ChatMessages
// Users (1) -> (Many) CommunityPosts
// Users (1) -> (Many) Referrals (as referrer)
// Users (1) -> (Many) UserCourses
// Users (1) -> (Many) UserAchievements
// Users (1) -> (Many) PaymentMethods
// InvestmentPlans (1) -> (Many) Investments
// Portfolios (1) -> (Many) Investments
// AcademyCourses (1) -> (Many) UserCourses
// RewardsTiers (1) -> (Many) Users

// SQL Migration Scripts
export const migrations = {
  createUsers: `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar_url VARCHAR(512),
      investor_tier VARCHAR(50) DEFAULT 'Starter',
      kyc_status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,

  createPortfolios: `
    CREATE TABLE portfolios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      total_invested DECIMAL(15, 2) DEFAULT 0,
      current_value DECIMAL(15, 2) DEFAULT 0,
      profit_loss DECIMAL(15, 2) DEFAULT 0,
      roi_percentage DECIMAL(5, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,

  createInvestments: `
    CREATE TABLE investments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      plan_id UUID NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      roi_percentage DECIMAL(5, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      performance_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,

  createWallets: `
    CREATE TABLE wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      available_balance DECIMAL(15, 2) DEFAULT 0,
      pending_balance DECIMAL(15, 2) DEFAULT 0,
      bonus_balance DECIMAL(15, 2) DEFAULT 0,
      total_balance DECIMAL(15, 2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'USD',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,

  createTransactions: `
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'completed',
      description TEXT,
      reference_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,

  createChatMessages: `
    CREATE TABLE chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      conversation_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
}
