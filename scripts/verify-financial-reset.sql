-- =============================================================================
-- PrimeFx Invest — Financial Reset Verification (read-only)
-- Run AFTER scripts/financial-reset.sql completes successfully.
-- =============================================================================

-- ── Preserved entities (should match pre-reset counts) ───────────────────────
SELECT 'users' AS entity, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL SELECT 'referral_network', COUNT(*) FROM referral_network
UNION ALL SELECT 'referral_rank_tiers', COUNT(*) FROM referral_rank_tiers
UNION ALL SELECT 'kyc_submissions', COUNT(*) FROM kyc_submissions
UNION ALL SELECT 'verification_sessions', COUNT(*) FROM verification_sessions
UNION ALL SELECT 'didit_webhook_logs', COUNT(*) FROM didit_webhook_logs
UNION ALL SELECT 'admin_profiles', COUNT(*) FROM admin_profiles
UNION ALL SELECT 'support_tickets', COUNT(*) FROM support_tickets
UNION ALL SELECT 'assistance_sessions', COUNT(*) FROM assistance_sessions
UNION ALL SELECT 'platform_features', COUNT(*) FROM platform_features
UNION ALL SELECT 'investment_plans', COUNT(*) FROM investment_plans
ORDER BY entity;

-- ── Financial state (all should be zero) ─────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM transactions)                    AS transactions,
  (SELECT COUNT(*) FROM payments)                        AS payments,
  (SELECT COUNT(*) FROM payments WHERE type = 'deposit') AS deposits,
  (SELECT COUNT(*) FROM withdrawal_requests)               AS withdrawal_requests,
  (SELECT COUNT(*) FROM transactions WHERE LOWER(type) = 'transfer') AS transfers,
  (SELECT COUNT(*) FROM investments)                     AS investments,
  (SELECT COUNT(*) FROM investment_profit_history)       AS profit_history,
  (SELECT COUNT(*) FROM investment_payouts)                AS payout_history,
  (SELECT COUNT(*) FROM investment_daily_snapshots)       AS daily_snapshots,
  (SELECT COUNT(*) FROM investment_withdrawal_requests)    AS capital_withdrawals,
  (SELECT COUNT(*) FROM referral_commissions)              AS referral_commissions,
  (SELECT COUNT(*) FROM referral_rank_rewards)             AS rank_rewards,
  (SELECT COUNT(*) FROM user_reward_redemptions)          AS reward_redemptions,
  (SELECT COUNT(*) FROM platform_fee_ledger)               AS fee_ledger,
  (SELECT COUNT(*) FROM financial_audit_logs)              AS financial_audit_logs;

-- ── Balances (all should be 0) ───────────────────────────────────────────────
SELECT
  COUNT(*)                         AS wallet_rows,
  COALESCE(SUM(available_balance), 0) AS available_sum,
  COALESCE(SUM(pending_balance), 0)   AS pending_sum,
  COALESCE(SUM(bonus_balance), 0)     AS bonus_sum,
  COALESCE(SUM(total_balance), 0)     AS total_sum
FROM wallet_balances;

SELECT
  COUNT(*)                          AS portfolio_rows,
  COALESCE(SUM(total_invested), 0)  AS invested_sum,
  COALESCE(SUM(current_value), 0)   AS value_sum,
  COALESCE(SUM(profit_loss), 0)     AS profit_sum
FROM portfolios;

-- ── Referral financial columns zeroed, ranks preserved ───────────────────────
SELECT COUNT(*) FILTER (WHERE bonus_earned <> 0) AS referrals_with_bonus FROM referrals;
SELECT COUNT(*) FILTER (WHERE welcome_bonus_paid IS TRUE) AS welcome_bonus_paid FROM referrals;
SELECT
  COUNT(*) FILTER (WHERE lifetime_commission_usd <> 0) AS stats_with_commission,
  COUNT(*) FILTER (WHERE rank_key IS NOT NULL)           AS users_with_rank
FROM user_referral_stats;

-- ── Investment plan counters ─────────────────────────────────────────────────
SELECT name, investor_count FROM investment_plans ORDER BY name;

-- ── Financial notifications cleared ─────────────────────────────────────────
SELECT type, COUNT(*) FROM user_notifications GROUP BY type ORDER BY type;

-- ── Sample user financial snapshot (first 5 users) ───────────────────────────
SELECT
  u.email,
  w.total_balance,
  p.total_invested,
  p.current_value,
  p.profit_loss,
  (SELECT COUNT(*) FROM investments i WHERE i.user_id = u.id) AS active_investments,
  (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) AS transaction_count
FROM users u
LEFT JOIN wallet_balances w ON w.user_id = u.id
LEFT JOIN portfolios p ON p.user_id = u.id
ORDER BY u.created_at
LIMIT 5;
