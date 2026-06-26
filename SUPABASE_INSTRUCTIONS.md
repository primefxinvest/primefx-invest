Supabase Setup Instructions for PrimeFx Invest

Your Supabase project is configured and ready to use.

Project URL: https://evjoyubypgjutylekiys.supabase.co
Publishable Key: sb_publishable_9vR0BEkn1K89IlfykBMQ_Q_KA3hf5Nn

STEP 1: Initialize Database Schema

1. Go to https://app.supabase.com
2. Sign in to your account
3. Navigate to your project "evjoyubypgjutylekiys"
4. Click on "SQL Editor" in the left sidebar
5. Click "New Query" button
6. Copy the entire contents of: supabase/migrations/001_create_schema.sql
7. Paste into the SQL editor
8. Click "Run" button to execute

This creates 12 tables with proper indexes and RLS policies.

STEP 2: Enable Email Authentication

1. Go to "Authentication" in the left sidebar
2. Click "Providers"
3. Find "Email" provider
4. Toggle it ON
5. Configure settings:
   - Autoconfirm enabled: OFF (users must confirm email)
   - Confirm email: ON
   - Double confirm changes: OFF
6. Save settings

STEP 3: Configure Environment Variables

Your .env.local file already has Supabase credentials:

NEXT_PUBLIC_SUPABASE_URL=https://evjoyubypgjutylekiys.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9vR0BEkn1K89IlfykBMQ_Q_KA3hf5Nn

Add OpenAI API key for PrimeAI Chat:
OPENAI_API_KEY=sk_your_key_here

STEP 4: Test Authentication

1. Start dev server: pnpm dev
2. Visit http://localhost:3000/signup
3. Create a test account with:
   - Full Name: Test User
   - Email: test@example.com
   - Password: testpass123
   - Tier: Starter
4. You should see confirmation email notification
5. Check Supabase Dashboard > Authentication > Users to verify account created

STEP 5: Verify Database

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Verify all 12 tables exist:
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

STEP 6: Deploy to Vercel

1. Push code to GitHub repository
2. Go to Vercel dashboard
3. Create new project from GitHub repo
4. Add environment variables in Project Settings > Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL=https://evjoyubypgjutylekiys.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9vR0BEkn1K89IlfykBMQ_Q_KA3hf5Nn
   - OPENAI_API_KEY=sk_your_key_here
5. Deploy

TROUBLESHOOTING

Issue: "Failed to connect to Supabase"
- Verify URL and key in .env.local
- Check Supabase project is active at https://app.supabase.co
- Ensure both URL and key are copied correctly

Issue: Signup fails with "Auth error"
- Check Email provider is enabled in Authentication > Providers
- Verify Email/Password auth method is active
- Check browser console for error details

Issue: "Table doesn't exist" error
- Re-run the SQL schema from supabase/migrations/001_create_schema.sql
- Verify SQL execution completed without errors
- Refresh Table Editor to see new tables

Issue: RLS policies blocking access
- Go to Authentication > Policies
- Review policies for each table
- Ensure policies allow authenticated users

NEXT STEPS

1. Configure Payment Processing (Stripe)
2. Set up Email Notifications (SendGrid)
3. Add Two-Factor Authentication
4. Implement API Rate Limiting
5. Set up Analytics
6. Configure CDN for media files

For more help, see:
- SUPABASE_QUICK_START.md
- README.md
- INTEGRATION_CHECKLIST.md
