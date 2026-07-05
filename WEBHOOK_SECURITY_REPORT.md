# Webhook Security Report

**Date:** 2026-07-05  
**Component:** Didit KYC Webhook (`/api/verify/webhook`)

---

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Forged payloads | HMAC-SHA256 signature verification |
| Replay attacks | X-Timestamp 300s window |
| Timing side-channels | `crypto.timingSafeEqual` |
| Duplicate processing | `event_id` UNIQUE + claim-before-process |
| Secret exposure | Redaction in audit logs |
| Client KYC tampering | DB trigger `enforce_users_self_update_guard` |

---

## Signature Validation Order

1. X-Timestamp freshness (±300s)
2. Require ≥1 signature header
3. X-Signature: HMAC(rawBody) — before JSON parse
4. X-Signature-V2: canonical JSON HMAC
5. X-Signature-Simple: concatenation HMAC fallback

---

## Secret Management

- Variable: `DIDIT_WEBHOOK_SECRET`
- Normalized via `getDiditWebhookSecret()` (trim, BOM, quotes)
- Missing → HTTP 503
- Never logged

---

## Idempotency

`event_id` claim in `didit_webhook_logs`. Processed duplicates skipped safely. Failed events retried on `duplicate_pending`.

---

## Compliance Status

| Control | Status |
|---------|--------|
| Signature before processing | ✅ |
| Constant-time comparison | ✅ |
| Timestamp anti-replay | ✅ |
| Idempotent processing | ✅ |
| Secret not in logs | ✅ |
| Service-role DB writes only | ✅ |

**Overall: Production-ready.**
