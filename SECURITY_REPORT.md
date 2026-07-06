# Security Report

**Date:** 2026-07-06  
**Scope:** Configuration and guard audit (no key rotation)

---

## Environment Variables

| Variable | Exposure | Status |
|----------|----------|--------|
| `DIDIT_WEBHOOK_SECRET` | Server-only via `server-only` imports | ✅ |
| `DIDIT_API_KEY` | Server-only | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client server-only | ✅ |
| `NEXT_PUBLIC_*` | Client bundle | ✅ Only public URLs |
| `.env.example` | Placeholders only, no secrets | ✅ |

**Action:** Verify all production secrets are set in hosting dashboard. Do not commit `.env.local`.

---

## Webhook Security

| Endpoint | Validation |
|----------|------------|
| `/api/verify/webhook` | HMAC-SHA256 (V2 + raw + simple), timestamp window |
| `/api/webhooks/didit` | Rewrite to canonical handler |
| `/api/webhooks/nowpayments` | IPN signature (existing) |
| `/api/webhooks/binance-pay` | Signature (existing) |

Idempotency via `didit_webhook_logs.event_id` UNIQUE constraint.

---

## Route Protection

| Layer | Mechanism |
|-------|-----------|
| Middleware | Supabase session refresh, idle timeout, MFA gate |
| Protected routes | `PROTECTED_ROUTE_PREFIXES` in `lib/auth/routes.ts` |
| KYC gates | Wallet/invest routes require verification |
| Admin portal | Separate admin auth + permissions |
| Cron routes | `CRON_SECRET` header validation |

---

## Database Security

| Control | Implementation |
|---------|----------------|
| Client KYC tampering | `enforce_users_self_update_guard` trigger |
| RLS on sensitive tables | Enabled on webhooks, verification sessions |
| Service-role writes | KYC sync via admin client only |

---

## Content Security

CSP headers applied via `middleware.ts` + `content-security-policy.ts`.

---

## Findings

| Severity | Issue | Status |
|----------|-------|--------|
| — | No exposed secrets in repo | ✅ |
| — | Webhook signature bypass | ✅ Mitigated |
| Low | ESLint security rules not active | Documented — add ESLint |
| Low | Debug logs in `lib/ai/provider.ts` | Non-secret boolean only |

**No critical security regressions. No keys rotated during this audit.**

---

## Production Checklist

- [ ] `DIDIT_WEBHOOK_SECRET` matches Didit dashboard
- [ ] `CRON_SECRET` set for scheduled jobs
- [ ] Supabase RLS policies applied in production
- [ ] HTTPS enforced on `www.primefxinvest.com`
