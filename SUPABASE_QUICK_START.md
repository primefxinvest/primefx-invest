# Supabase Quick Start Guide

Your Supabase project is ready to use! Follow these steps to get started.

## Step 1: Access Your Supabase Project

1. Go to https://supabase.com and sign in
2. Navigate to your project at: https://app.supabase.com/project/evjoyubypgjutylekiys
3. Go to the SQL Editor section

## Step 2: Create Database Schema

1. In the SQL Editor, open a new query
2. Copy the entire contents of `supabase/migrations/001_create_schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- 12 tables for users, portfolios, investments, wallets, etc.
- Row Level Security (RLS) policies
- Indexes for performance
- 4 sample investment plans

## Step 3: Set Up Authentication

1. Go to Authentication > Providers
2. Enable Email/Password provider:
   - Enable Email Confirmed
   - Set password requirements (minimum 8 characters)
3. Go to Authentication > Policies
4. Configure RLS policies as shown in the SQL file

## Step 4: Update Application Environment

Your environment file is already configured at `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://evjoyubypgjutylekiys.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9vR0BEkn1K89IlfykBMQ_Q_KA3hf5Nn
```

Add your OpenAI API key for PrimeAI chat:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Step 5: Test Locally

1. Make sure the dev server is running: `pnpm dev`
2. Visit http://localhost:3000
3. Go to login page and create a test account
4. Login and verify dashboard works

## Step 6: Verify Tables

In Supabase Dashboard:
1. Go to Table Editor
2. Verify all 12 tables are created:
   - users
   - portfolios
   - investments
   - investment_plans
   - wallet_balances
   - transactions
   - chat_messages
   - academy_courses
   - user_courses
   - community_posts
   - referrals
   - user_achievements
   - payment_methods
   - rewards_tiers

## Step 7: Deploy to Vercel

1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Deploy

## Troubleshooting

### "Failed to connect to Supabase"
- Verify your URL and key in `.env.local`
- Check Supabase project is active
- Ensure RLS policies are not blocking connections

### "Authentication failed"
- Check Email/Password provider is enabled
- Verify user exists in Auth > Users
- Check database user record exists

### "Tables not found"
- Re-run the SQL migration script
- Verify SQL execution completed without errors
- Check Table Editor in Supabase dashboard

## API Documentation

Key endpoints available:

- `/api/chat` - PrimeAI chat endpoint
- `/api/transactions` - Transaction management
- `/api/portfolio` - Portfolio data
- `/api/investments` - Investment management

Each endpoint requires authentication and includes proper error handling.

## Next Steps

1. Customize investment plans in Supabase Table Editor
2. Add real market data integration
3. Configure email notifications
4. Set up payment processing
5. Add analytics dashboard

Need help? Check the main README.md and INTEGRATION_CHECKLIST.md files.
