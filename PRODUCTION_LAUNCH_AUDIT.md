# PrimeFx Invest — Production Launch Audit

**Audit date:** July 4, 2026  
**Auditor role:** Senior fintech platform architect  
**Scope:** Performance, error handling, security, reliability, monitoring, deployment, routing  
**Constraints:** No business logic, UI layout, route, or calculation changes (except loading/error/empty states)

---

## Executive Summary

PrimeFx Invest has a **solid architectural foundation**: localized auth, Supabase SSR, payment webhook verification, admin RBAC, MFA gates, and a consistent async UI pattern (`useAsyncData` + `AsyncState`). The platform is **not yet launch-ready** without addressing **Critical financial integrity and security gaps** in RLS, deposit idempotency, withdrawal payout wiring, and profit/cron race conditions.

**Stabilization applied in this audit:** referral blank-screen fix, wallet health loading/error states, dashboard error boundary, async data timeout support, footer guest-link alignment, `.env.example` cleanup.

---

## Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Launch readiness** | **62 / 100** | Core UX works; financial backend has critical gaps before real money |
| **Production readiness** | **58 / 100** | Env/docs gaps, `ignoreBuildErrors`, no rate limiting, monitoring not wired |
| **Security** | **65 / 100** | Good webhook auth + service-role validation; RLS and KYC binding are critical gaps |
| **Scalability** | **55 / 100** | Unbounded transaction queries, dashboard force-dynamic, no pagination |
| **Investor trust** | **70 / 100** | Strong UI polish; silent query failures and mock-adjacent patterns reduce trust |

**Overall recommendation:** **Conditional launch** — safe for staged beta with sandbox payments only. **Do not launch live money movement** until Critical items below are resolved.

---

## Critical Findings

| # | Area | Finding | Location | Action required |
|---|------|---------|----------|-----------------|
| C1 | Security | `users` RLS allows UPDATE on all columns — client can attempt privilege escalation (`is_verified`, `investor_tier`, etc.) | `supabase/migrations/005_signup_bootstrap.sql` | Column allowlist or service-role-only updates for sensitive fields |
| C2 | Security | `/api/verify/status` accepts foreign Didit sessionId when user has no bound session — KYC bypass risk | `app/api/verify/status/route.ts` | Bind session to `verification_sessions.user_id` before sync |
| C3 | Reliability | Crypto withdrawals marked complete without `createNowPaymentsPayout()` ever called | `lib/cron/daily-jobs.ts`, `lib/payments/nowpayments.ts` | Wire payout initiation before completion |
| C4 | Reliability | Deposit completion is check-then-act — concurrent webhooks can double-credit | `lib/payments/service.ts` | Atomic `UPDATE … WHERE status != 'completed' RETURNING` |
| C5 | Reliability | Daily profit cron TOCTOU — overlapping runs can duplicate profits and referral accruals | `lib/invest/profit-service.ts` | Insert profit-run record first with `ON CONFLICT DO NOTHING` |
| C6 | Reliability | Wallet balance updates are read-modify-write — race on concurrent ops | `lib/payments/wallet-ledger.ts` | SQL atomic `balance = balance + $1` or row locking |

---

## High Findings

| # | Area | Finding | Location |
|---|------|---------|----------|
| H1 | Performance | Dashboard layout `force-dynamic` disables caching for all investor pages | `app/[locale]/(dashboard)/layout.tsx` |
| H2 | Performance | `getUserTransactions` has no limit — unbounded growth | `lib/db/supabase.ts` |
| H3 | Performance | Dashboard fires 8 parallel client fetches with duplicate auth + overlapping data | `app/[locale]/(dashboard)/dashboard/page.tsx` |
| H4 | Performance | Portfolio chart fetched up to 3× per period change | `app/[locale]/(dashboard)/portfolio/page.tsx` |
| H5 | Performance | `images.unoptimized: true` disables Next.js image optimization | `next.config.mjs` |
| H6 | Performance | Recharts eagerly imported in referral, wallet donut, landing performance section | Multiple components |
| H7 | Security | `/api/chat` unauthenticated — cost/abuse vector | `app/api/chat/route.ts` |
| H8 | Security | No application-level rate limiting | Entire `app/api/**` |
| H9 | Security | `NEXT_PUBLIC_ADMIN_EMAIL` grants bootstrap super-admin from client-visible env | `lib/admin/auth.ts` |
| H10 | Reliability | Referral payout distribution not idempotent on retry | `lib/referral/commission-service.ts` |
| H11 | Reliability | Transfer failure rollback uses wrong amounts when fees apply | `lib/wallet/operations.ts` |
| H12 | Deployment | `typescript.ignoreBuildErrors: true` masks type errors in CI | `next.config.mjs` |
| H13 | Deployment | Admin UI documents migrations through 014; repo has 028 | `lib/admin/platform-settings.ts` |

---

## Medium Findings

| # | Area | Finding |
|---|------|---------|
| M1 | Performance | Support tickets N+1 message fetch |
| M2 | Performance | 18/19 dashboard pages are client components — no SSR data |
| M3 | Performance | `SyncPendingDeposits` polls every 12s on every dashboard visit |
| M4 | Error handling | Query layer returns `[]` on failure — users see empty states instead of errors |
| M5 | Error handling | Portfolio charts lack loading/error UI |
| M6 | Error handling | Dashboard status cards show placeholder defaults on failure |
| M7 | Security | P2P transfers skip MFA and transaction PIN (declared in rules, not enforced) |
| M8 | Security | Suspended accounts not blocked from wallet ops |
| M9 | Security | `user_reward_redemptions` allows client INSERT without balance check |
| M10 | Security | Session idle timeout declared (30 min) but not enforced |
| M11 | Reliability | Support stats fetch duplicates ticket list |
| M12 | Deployment | `PAYMENT_MODE=sandbox` vs `NOWPAYMENTS_ENV=production` confusion in `.env.example` |
| M13 | Deployment | Binance Pay requires outbound IP whitelist — Vercel dynamic IPs |
| M14 | Routing | Guest footer links previously sent to login; nav sent to signup (fixed) |

---

## Low Findings

| # | Area | Finding |
|---|------|---------|
| L1 | Performance | Navbar Ctrl/⌘K hydration flash |
| L2 | Performance | Raw `<img>` tags bypass `next/image` in several components |
| L3 | Security | MFA enforced in middleware only; some server actions omit check |
| L4 | Security | `dangerouslySetInnerHTML` for 2FA QR SVG (low XSS risk) |
| L5 | Error handling | No `loading.tsx` segment boundaries (partially addressed with `error.tsx`) |
| L6 | Deployment | README lists dead `NEXT_PUBLIC_API_URL` |
| L7 | Monitoring | Webhook/cron outcomes not persisted to audit tables |

---

## 1. Performance Audit

### Architecture

- **Marketing:** Server components with `Suspense` for plans — good pattern
- **Dashboard:** Entire tree client-side + `force-dynamic` — primary bottleneck
- **Caching:** `async-cache.ts` with 30s TTL for notifications/wallet — good but underused

### Top issues

1. **Unbounded transaction queries** — every metrics/chart/wallet widget pulls full history
2. **Duplicate fetches** — dashboard mount, portfolio period changes, support stats
3. **Bundle weight** — recharts + lucide in client bundles; referral view ~1,150 lines eager-loaded
4. **Image optimization disabled globally**
5. **Middleware DB calls** — MFA + KYC checks on every protected navigation

### Recommendations (no business logic change)

| Priority | Action | Impact |
|----------|--------|--------|
| P0 | Add `LIMIT` + pagination to `getUserTransactions` | Prevents query degradation |
| P1 | Consolidate dashboard data into single server loader | −60% client requests |
| P1 | Lazy-load remaining recharts surfaces | −200KB+ JS |
| P2 | Re-enable `next/image` optimization | LCP improvement |
| P2 | Add `cacheKey` to investment-plans, support stats | Dedupe fetches |
| P3 | Parallelize dashboard layout server checks | −200ms TTFB |

### Positive patterns

- `Charts.lazy.tsx` for dashboard/portfolio charts
- `DashboardCommandMenu` dynamic import
- Referral server prefetch with `initialOverview`
- `InvestmentPlansSection` async server component

---

## 2. Error Handling

### Current pattern

```
useAsyncData → AsyncState → Skeleton | ErrorState | EmptyState | content
```

### Gaps found

| Gap | Severity | Status |
|-----|----------|--------|
| Referral `return null` on missing data | High | **Fixed** — EmptyState + retry |
| Wallet health card shows score 0 while loading | Medium | **Fixed** — skeleton + error |
| No dashboard error boundary | Medium | **Fixed** — `error.tsx` added |
| Infinite skeleton on hung requests | Medium | **Fixed** — optional `timeoutMs` in `useAsyncData` |
| Query layer swallows errors → false empty states | High | Documented — requires query refactor (post-launch) |
| Portfolio charts no error UI | Medium | Open |
| Settings preferences fetch no `.catch()` | Low | Open |
| No `loading.tsx` segment files | Low | Open |

### User should never see blank screens

After stabilization: referral, wallet health, and uncaught dashboard errors now have fallbacks. Remaining risk: portfolio charts and dashboard status cards on silent query failure.

---

## 3. Security Hardening

### Working controls

| Control | Evidence |
|---------|----------|
| Cron auth in production | `CRON_SECRET` required (`lib/cron/auth.ts`) |
| Webhook signatures | NOWPayments HMAC, Binance RSA + timestamp |
| Didit webhook idempotency | `event_id UNIQUE` + claim flow |
| Redirect sanitization | Blocks `//` open redirects |
| Service role validation | Rejects anon key (`lib/supabase/admin-server.ts`) |
| Wallet client writes blocked | No RLS UPDATE on `wallet_balances` |
| Admin API authorization | `lib/admin/api-auth.ts` |

### Required changes before live money

1. **Tighten `users` RLS** (C1)
2. **Bind Didit sessions** (C2)
3. **Rate limit `/api/chat`** and auth endpoints (H7, H8)
4. **Remove `NEXT_PUBLIC_ADMIN_EMAIL`** bootstrap — use server-only env (H9)
5. **Enforce MFA/PIN/suspension** on all money-moving actions (M7, M8)

### No auth flow changes made

Authentication flows unchanged per audit constraints. Security recommendations are documented only.

---

## 4. Reliability Audit

### Duplicate operation risks

| Operation | Idempotency | Risk |
|-----------|-------------|------|
| Deposits (webhook) | Status check only | **Critical** — double credit possible |
| Withdrawals (cron) | Queue + status | **Critical** — completes without payout |
| Transfers | Reference ID | Medium — rollback amount bug |
| Profit runs | End insert with UNIQUE | **High** — TOCTOU race |
| Referral accrual | Partial guards | **High** — duplicate on retry |
| Referral payout | None | **High** — double pay on retry |
| Didit webhooks | event_id UNIQUE | Low — good |

### Race conditions

- Wallet ledger read-modify-write (C6)
- Profit cron parallel invocation (C5)
- Concurrent deposit webhooks (C4)

**No business logic modified.** All findings are recommendations for a dedicated financial integrity sprint.

---

## 5. Production Monitoring

Architecture document prepared: [`lib/monitoring/architecture.md`](lib/monitoring/architecture.md)

### Log categories defined

- Application, API, Audit, Admin, Payment, Transfer, Withdrawal, Referral

### Launch phase (minimal)

- Vercel logs + Analytics (already enabled)
- Structured console logging in webhooks/cron (recommended next step)
- Alert on cron auth failure and webhook signature mismatch

---

## 6. Deployment Readiness

### Required production environment variables

| Tier | Variables |
|------|-----------|
| **Core** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` |
| **Admin + AI** | `ADMIN_SUPER_EMAILS`, `GEMINI_API_KEY` |
| **Payments** | `PAYMENT_MODE=production`, `PAYMENT_WEBHOOK_BASE_URL`, `NOWPAYMENTS_*`, `BINANCE_PAY_*` |
| **KYC** | `DIDIT_API_KEY`, `DIDIT_WEBHOOK_SECRET`, `DIDIT_WORKFLOW_ID`, `NEXT_PUBLIC_VERIFICATION_CALLBACK_URL` |

### External dashboard configuration

| Service | Configure |
|---------|-----------|
| Supabase | Site URL, redirect URLs, Google provider, all 28 migrations |
| Google Cloud | OAuth → Supabase `/auth/v1/callback` |
| NOWPayments | IPN URLs: `/api/webhooks/nowpayments`, `/api/webhooks/nowpayments-payout` |
| Binance Pay | Webhook URL + outbound IP whitelist |
| Didit | Webhook: `/api/verify/webhook`, callback: `/verify/callback` |
| Vercel | All env vars, custom domain, cron secret |

### Webhook URLs (production)

```
https://www.primefxinvest.com/api/webhooks/nowpayments
https://www.primefxinvest.com/api/webhooks/nowpayments-payout
https://www.primefxinvest.com/api/webhooks/binance-pay
https://www.primefxinvest.com/api/verify/webhook
```

### Callback URLs

```
https://www.primefxinvest.com/auth/callback          (Google OAuth)
https://www.primefxinvest.com/verify/callback        (Didit KYC)
```

### Deployment gaps

- [ ] Set canonical `NEXT_PUBLIC_APP_URL` and `PAYMENT_WEBHOOK_BASE_URL`
- [ ] Run all 28 Supabase migrations
- [ ] Align `PAYMENT_MODE` and `NOWPAYMENTS_ENV` to production
- [ ] Register all webhook URLs in provider dashboards
- [ ] Remove or disable `ignoreBuildErrors` before launch
- [ ] Resolve Binance Pay IP whitelisting for Vercel egress

---

## 7. Routing Audit

Full prior audit: [`ROUTING_AUDIT_REPORT.md`](ROUTING_AUDIT_REPORT.md)

### Summary

| Check | Result |
|-------|--------|
| Missing pages for nav links | **None** — 30 locale routes verified |
| Broken routes | **None** in production build |
| Redirect loops | **None** detected |
| Middleware exceptions | `/auth/callback`, `/auth/login/google` correctly exempt |
| Guest protected nav | Landing nav + footer aligned (footer fix applied) |

### Route coverage

All sidebar, navbar, and landing nav hrefs resolve to existing `page.tsx` files. Tier-gated routes show upgrade prompts, not 404. Referral locked state shows dedicated view.

---

## 8. Stabilization Changes Applied

| File | Change |
|------|--------|
| `components/referral/ReferralProgramView.tsx` | Blank screen → EmptyState with retry |
| `components/wallet/WalletHealthCard.tsx` | Loading skeleton + error state |
| `lib/hooks/useAsyncData.ts` | Optional `timeoutMs` to prevent infinite skeletons |
| `app/[locale]/(dashboard)/error.tsx` | Dashboard error boundary |
| `components/landing/LandingFooterProtectedLinks.tsx` | Guest-aware footer links |
| `components/landing/LandingFooter.tsx` | Uses protected link component |
| `.env.example` | Removed typo; added Didit webhook URL comment |
| `lib/monitoring/architecture.md` | Monitoring architecture |
| `PRODUCTION_LAUNCH_AUDIT.md` | This report |

---

## Launch Checklist

### Before sandbox beta

- [x] Routing audit complete
- [x] Error/empty state stabilization (partial)
- [x] Monitoring architecture documented
- [ ] Set all Tier 1–2 env vars on Vercel
- [ ] Apply all Supabase migrations
- [ ] Register webhooks in provider dashboards

### Before live money

- [ ] Resolve C1–C6 (Critical)
- [ ] Wire NOWPayments payout flow (C3)
- [ ] Atomic deposit completion (C4)
- [ ] Rate limit `/api/chat` (H7)
- [ ] Tighten users RLS (C1)
- [ ] Fix KYC session binding (C2)
- [ ] Remove `ignoreBuildErrors` (H12)
- [ ] Add transaction query limits (H2)

### Post-launch (30 days)

- [ ] Implement audit_logs + payment_events tables
- [ ] Consolidate dashboard data fetching
- [ ] Query layer error propagation
- [ ] Portfolio chart error states
- [ ] Log drain to observability platform

---

## Conclusion

PrimeFx Invest demonstrates **world-class UI/UX ambition** with a **production-grade frontend architecture** (i18n, auth gates, async UI patterns, admin portal). The **financial backend layer requires a focused integrity sprint** before handling real investor funds. With Critical items resolved and deployment checklist completed, the platform can reach **85+ launch readiness** without redesigning the application.

**Recommended path:** Sandbox beta → financial integrity sprint → staged live launch with deposit limits → full production.
