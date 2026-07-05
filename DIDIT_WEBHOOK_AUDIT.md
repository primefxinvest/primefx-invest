# Didit Webhook Audit

**Date:** 2026-07-05  
**Scope:** Didit webhook integration only (KYC infrastructure)  
**Status:** Audited and remediated

---

## Executive Summary

PrimeFx Invest uses a single canonical Didit webhook handler at `/api/verify/webhook`. The Didit dashboard was configured to `https://www.primefxinvest.com/webhooks/didit`, which did **not** map to any route handler and would return 404 in production.

Remediation applied:

1. Added Next.js rewrite: `/webhooks/didit` → `/api/verify/webhook` (no duplicate handler)
2. Expanded `verification_status` values for granular Didit lifecycle mapping
3. Added structured audit logging across the webhook pipeline
4. Hardened signature validation (require signature header, raw-body-first verification)

---

## Step 1 — Webhook Route Verification

### Endpoints That Exist

| Route | File | Status |
|-------|------|--------|
| `/api/verify/webhook` | `app/api/verify/webhook/route.ts` | **Canonical — single source of truth** |
| `/api/webhooks/didit` | `app/api/webhooks/didit/route.ts` | Deprecated alias (same handler) |
| `/webhooks/didit` | `next.config.mjs` rewrite | **Fixed** — rewrites to `/api/verify/webhook` |

### Didit Dashboard Configuration

| Setting | Current Value | Correct? |
|---------|---------------|----------|
| Webhook destination | `https://www.primefxinvest.com/webhooks/didit` | Works after rewrite fix |
| Recommended canonical | `https://www.primefxinvest.com/api/verify/webhook` | Preferred for clarity |

**Recommendation:** Update Didit dashboard to the canonical URL when convenient. The rewrite ensures the legacy path continues to work without a duplicate route file.

---

## Step 2 — Webhook Secret

| Variable | Purpose | Loader |
|----------|---------|--------|
| `DIDIT_WEBHOOK_SECRET` | Didit Signing Secret | `getDiditWebhookSecret()` |

Normalization strips BOM, whitespace, carriage returns, and surrounding quotes.

---

## Step 3 — Signature Validation

| Requirement | Status |
|-------------|--------|
| Read raw request body | ✅ |
| Verify X-Signature-V2 | ✅ |
| Verify X-Timestamp freshness | ✅ 300s |
| Constant-time comparison | ✅ |
| Reject invalid signatures | ✅ 401 |
| No JSON parse before raw signature | ✅ |

---

## Step 4 — Event Subscriptions

`status.updated` is actively processed via `syncUserVerificationFromDidit()`. All nine subscribed event types are handled or acknowledged.

---

## Step 5 — Database Update Mapping

| Didit Status | `verification_status` | `kyc_status` | `verified_at` |
|--------------|----------------------|--------------|---------------|
| Approved | `approved` | `Verified` | `now()` |
| Declined | `declined` | `Rejected` | — |
| In Review | `pending_review` | `Pending` | — |
| In Progress | `in_progress` | `Pending` | — |
| Expired | `expired` | `Pending` | — |
| Abandoned | `abandoned` | `Pending` | — |

---

## Step 6 — Idempotency

Primary: `event_id` UNIQUE in `didit_webhook_logs`. Duplicates return 200 with `DUPLICATE_EVENT_SKIPPED` log.

---

## Step 7 — Structured Logs

Events: `WEBHOOK_RECEIVED`, `SIGNATURE_VERIFIED`, `SIGNATURE_REJECTED`, `DATABASE_UPDATED`, `VERIFICATION_APPROVED`, `VERIFICATION_DECLINED`, `DUPLICATE_EVENT_SKIPPED`.

---

## Step 8 — Callback Integration

Database-first callback confirmed. Webhook-approved users see instant success without `session_id` in URL.

---

## Critical Fix

`/webhooks/didit` → rewrite to `/api/verify/webhook` in `next.config.mjs`.
