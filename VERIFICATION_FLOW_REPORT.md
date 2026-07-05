# Verification Flow Report

**Date:** 2026-07-05  
**Scope:** End-to-end Didit KYC verification flow

---

## Production Flow

```
Verify Identity (POST /api/verify/start)
        ↓
Didit Verification Portal (external)
        ↓
Didit Webhook (POST /api/verify/webhook)
        ↓
syncUserVerificationFromDidit()
  • kyc_status = 'Verified' (if Approved)
  • verification_status = 'approved'
  • verified_at = now()
  • is_verified = true
        ↓
Redirect to /verify/callback
        ↓
GET /api/verify/status (database-first)
        ↓
Success Screen → Dashboard (KYC Status: Verified)
```

---

## Source of Truth

**Database** (webhook-synced) — not callback URL parameters.

`/api/verify/status` checks `isUserVerifiedInProfile()` before calling Didit API.

---

## Callback Resilience

| Scenario | Behavior |
|----------|----------|
| Webhook approved before callback | Instant success from DB |
| `session_id` missing from URL | Falls back to `users.didit_session_id` |
| Session lost from URL after login | sessionStorage backup + DB fallback |
| User idle on Didit >30 min | Callback route exempt from idle timeout |
| Login redirect | Full URL with query params preserved |

---

## Session Preservation

- `sessionStorage` backup on verify start
- Middleware preserves `?verificationSessionId=...` in login redirect
- `/verify/callback` exempt from idle timeout sign-out

---

## Realtime Updates

`useUserVerificationRealtime` subscribes to `users` and `verification_sessions` table changes. Callback page updates instantly when webhook fires.

---

## Status Lifecycle

| Phase | `verification_status` | User Experience |
|-------|----------------------|-----------------|
| Started | `in_progress` | Didit portal open |
| Submitted | `pending_review` | "In review" on callback |
| Approved | `approved` | Success screen |
| Declined | `declined` | Retry CTA |
| Expired | `expired` | Restart CTA |
| Abandoned | `abandoned` | Resume CTA |

---

## Test Matrix

| Platform | Expected |
|----------|----------|
| Desktop Chrome | Verify → success → logged in → Dashboard Verified |
| Android Chrome | Same + sessionStorage fallback |
| iOS Safari | Same + SameSite=Lax cookies survive redirect |
| In-app browsers | DB fallback if sessionStorage blocked |

---

## Configuration

| Setting | Value |
|---------|-------|
| Callback URL | `https://www.primefxinvest.com/verify/callback` |
| Webhook URL (canonical) | `https://www.primefxinvest.com/api/verify/webhook` |
| Webhook URL (legacy, works) | `https://www.primefxinvest.com/webhooks/didit` |
