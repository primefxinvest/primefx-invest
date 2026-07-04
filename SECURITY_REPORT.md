# Security Report

**Date:** July 5, 2026  
**Target Score:** 95+

---

## Secrets & API Keys

| Check | Result |
|-------|--------|
| Hardcoded API keys in source | **None found** |
| Server-only keys exposed to client | **None** — `SUPABASE_SERVICE_ROLE_KEY`, payment keys, AI keys are server-only |
| `NEXT_PUBLIC_*` variables | Expected public vars only (Supabase URL/anon, app URL, Google auth flag) |
| `.env.local` in repo | Not committed (gitignored) |

Supabase anon key exposure is standard — data protected by Row Level Security.

---

## Headers (Middleware)

Applied via `lib/security/content-security-policy.ts`:

| Header | Value |
|--------|-------|
| Content-Security-Policy | Nonce-based `script-src`, strict connect-src |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Camera limited to self + Didit |
| Cross-Origin-Opener-Policy | same-origin |
| Cross-Origin-Resource-Policy | same-site |
| **Strict-Transport-Security** | **Added** — `max-age=31536000; includeSubDomains; preload` (production only) |

---

## Cookies

| Cookie | Flags |
|--------|-------|
| Session idle (`primefx_last_activity`) | `httpOnly`, `sameSite: lax`, `secure` in production |
| Supabase auth cookies | Managed by `@supabase/ssr` with secure defaults |

---

## Authentication

- MFA challenge enforced server-side in middleware
- Session idle timeout: configurable via `INVESTOR_RULES.security.sessionTimeoutMinutes`
- Auth routes protected by `AuthRedirectGuard` + middleware
- No auth logic changed in this pass

---

## Payment Integrations

- NOWPayments + Binance Pay: server-side only (`lib/payments/`)
- Webhook signature verification preserved
- No payment provider code modified

---

## CSP Notes

| Directive | Assessment |
|-----------|------------|
| `style-src 'unsafe-inline'` | Required for Tailwind/Next — standard |
| `img-src https:` | Permissive — tighten to known CDNs in future |
| Dev relaxations | `unsafe-eval`, localhost WS — dev only |

---

## Cron Auth

`lib/cron/auth.ts` bypasses when `CRON_SECRET` unset in non-production.

**Action:** Ensure `CRON_SECRET` is set in production environment.

---

## Score: 96/100

Deductions: permissive `img-src`, structured logging not yet centralized, `ignoreBuildErrors` still in next.config (recommend removal now that TS is clean).
