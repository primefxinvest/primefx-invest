# Supabase Integration Guide

This document explains how to set up Supabase for the PrimeFx Invest platform.

## Getting Started

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/log in
2. Click "New Project" and create a new project
3. Choose your region and database password
4. Wait for the project to be created (2-5 minutes)

### 2. Get Your Credentials

Once your project is created:

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** (optional, for server-side only) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Add Environment Variables

Create a `.env.local` file in the root of your project with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Database Schema Setup

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the SQL schema below
4. Click "Run"

### Option B: Using Migration Files

Run the migration script using Supabase CLI:

```bash
supabase migration new create_primefx_schema
# Then copy the schema SQL into the migration file
supabase db push
```

## Database Schema SQL

```sql
-- Create Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  investor_tier VARCHAR(50) DEFAULT 'Starter',
  avatar_url TEXT,
  kyc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Investment Plans table
CREATE TABLE investment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  weekly_roi DECIMAL(5, 2) NOT NULL,
  risk_level VARCHAR(50),
  min_investment DECIMAL(12, 2),
  max_investment DECIMAL(12, 2),
  duration VARCHAR(50),
  payout_frequency VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_invested DECIMAL(15, 2) DEFAULT 0,
  current_value DECIMAL(15, 2) DEFAULT 0,
  profit_loss DECIMAL(15, 2) DEFAULT 0,
  roi_percentage DECIMAL(8, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Investments table
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES investment_plans(id),
  amount DECIMAL(15, 2) NOT NULL,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  expected_return DECIMAL(15, 2),
  actual_return DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  available_balance DECIMAL(15, 2) DEFAULT 0,
  pending_balance DECIMAL(15, 2) DEFAULT 0,
  bonus_balance DECIMAL(15, 2) DEFAULT 0,
  total_balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  description TEXT,
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Chat Messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Academy Courses table
CREATE TABLE academy_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50),
  duration_minutes INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create User Courses table (for enrollment tracking)
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
  progress_percentage INT DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Community Posts table
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bonus_earned DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_name VARCHAR(100) NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW()
);

-- Create Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view/edit only their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own portfolio" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own investments" ON investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
```

## Using Supabase in Your Code

### Authentication

The app uses Supabase authentication in `/lib/supabase.ts`:

```typescript
import { signUp, signIn, signOut } from '@/lib/supabase'

// Sign up
const { data, error } = await signUp(email, password, fullName)

// Sign in
const { data, error } = await signIn(email, password)

// Sign out
await signOut()
```

### Database Queries

Use the helper functions in `/lib/db/supabase.ts`:

```typescript
import { getUserInvestments, getWallet } from '@/lib/db/supabase'

// Get user investments
const { data: investments } = await getUserInvestments(userId)

// Get wallet balance
const { data: wallet } = await getWallet(userId)
```

## Environment Variables for Production

For production on Vercel:

1. Go to your Vercel project settings
2. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional)

## Testing

To test the Supabase integration:

1. Create a test user account
2. Make a deposit transaction
3. View your portfolio
4. Check transactions in the Supabase dashboard

## Troubleshooting

### Connection Issues
- Verify your credentials are correct
- Check that your Supabase project is running
- Ensure your IP is not blocked by Supabase firewall

### Authentication Errors
- Clear browser cache and localStorage
- Verify email format is correct
- Check password meets requirements (min 6 characters)

### Data Not Showing
- Check Row Level Security policies are enabled
- Verify user is authenticated
- Check browser console for errors

## Security Best Practices

1. Never commit `.env.local` to version control
2. Use environment variables for sensitive data
3. Enable Row Level Security (RLS) for all tables
4. Use the service role key only on the server
5. Regularly rotate your API keys
6. Monitor your Supabase usage and billing

## More Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [NextJS with Supabase](https://supabase.com/docs/guides/getting-started/frameworks/nextjs)
