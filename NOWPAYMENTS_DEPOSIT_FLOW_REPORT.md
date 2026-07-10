# NOWPayments Deposit Flow & Admin Ownership Report

**Date:** July 10, 2026

---

## Summary

Two scoped changes were implemented:

1. **Admin ownership** — `infojimvio@gmail.com` is now the sole Platform Owner (Super Admin, ownership protection, financial approver). `fxinvestprime@gmail.com` retains full tier-1 portal access without ownership or financial approval privileges.

2. **NOWPayments deposit flow** — Success/failure redirect routes, order-aware NOWPayments URLs, success-page sync polling, and immediate wallet credit via existing webhook idempotency (unchanged settlement logic).

---

## Part 1 — Admin Ownership

### Root cause

Super Admin email, ownership protection, and financial approval were split across `fxinvestprime@gmail.com` (legacy Super Admin) and `infojimvio@gmail.com` (Finance Admin with tier-1 access only). Platform ownership needed consolidation under `infojimvio@gmail.com` while preserving full portal access for `fxinvestprime@gmail.com`.

### Files modified

| File | Change |
|------|--------|
| `lib/admin/super-admin.ts` | `SUPER_ADMIN_EMAIL` → `infojimvio@gmail.com`; added `FULL_ADMIN_PORTAL_EMAIL`; bootstrap honors both |
| `lib/admin/auth.ts` | Platform Owner context for infojimvio; full portal Admin context for fxinvestprime |
| `components/admin/AdminShell.tsx` | Generic bootstrap admin message |
| `components/admin/AdminServiceRoleBanner.tsx` | Updated ownership documentation |
| `.env.example` | `ADMIN_SUPER_EMAILS=infojimvio@gmail.com,fxinvestprime@gmail.com` |

**Unchanged:** `lib/admin/transaction-approval-auth.ts` (financial approver remains `infojimvio@gmail.com`), transaction approval guards, permissions matrix, DB schema.

### Permission matrix

| Capability | `infojimvio@gmail.com` | `fxinvestprime@gmail.com` |
|------------|------------------------|---------------------------|
| Admin portal (all modules, tier 1) | ✅ | ✅ |
| Designated Super Admin (`isSuperAdminEmail`) | ✅ | ❌ |
| Ownership protection (`assertSuperAdminProtected`) | ✅ (protected) | ❌ |
| Financial approve/reject | ✅ | ❌ |
| Bootstrap env honor | ✅ | ✅ |

---

## Part 2 — NOWPayments Deposit Flow

### Root cause

Deposits redirected back to `/wallet?deposit=success` with no dedicated success page. Users could remain on NOWPayments or land on the generic wallet page without clear confirmation, amount credited, or order-specific sync. Redirect URLs did not include the order reference for targeted reconciliation.

### Files modified

| File | Change |
|------|--------|
| `lib/payments/env.ts` | Success → `/wallet/deposit/success?order=…`; cancel → `/wallet/deposit/failed?order=…` |
| `lib/payments/nowpayments.ts` | Pass order-scoped redirect URLs to invoice API |
| `lib/payments/service.ts` | Explicit success/cancel URLs per deposit order |
| `lib/payments/actions.ts` | Added `syncDepositOrder()` for order-specific reconciliation |
| `components/wallet/deposit/DepositSuccessView.tsx` | **New** — success UI, polling, realtime wallet refresh |
| `components/wallet/deposit/DepositFailedView.tsx` | **New** — failure UI with retry |
| `app/.../wallet/deposit/success/page.tsx` | **New** route |
| `app/.../wallet/deposit/failed/page.tsx` | **New** route |
| `components/wallet/deposit/useDepositFlow.ts` | Removed debug `console.log` calls |

**Unchanged:** Webhook handler logic, `claimDepositCompletion` idempotency, `creditInvestorWallet`, KYC gates, referral logic, investment/withdrawal logic.

---

## Webhook Verification

| Check | Implementation | Status |
|-------|----------------|--------|
| Authentic IPN | `verifyNowPaymentsSignature()` — HMAC-SHA512, sorted JSON, timing-safe compare | ✅ |
| Invalid signature | HTTP 401, logged to `payment_webhook_logs` | ✅ |
| Duplicate webhooks | `claimDepositCompletion()` RPC — atomic claim, returns null on replay | ✅ |
| Idempotency | `completeDepositFromWebhook()` exits early if already completed | ✅ |
| No double credit | Wallet credit only after successful claim | ✅ |
| Status mapping | `finished` → credit; `failed/expired/refunded` → fail; interim → update payment status | ✅ |
| Audit trail | `logPaymentWebhook()` + `logFinancialAudit()` | ✅ |

**Endpoint:** `POST /api/webhooks/nowpayments`

---

## Wallet Credit Flow

```
User pays on NOWPayments
        ↓
POST /api/webhooks/nowpayments (signature verified)
        ↓
isPaymentComplete('finished')
        ↓
completeDepositFromWebhook(orderId)
        ↓
claimDepositCompletion(orderId)  ← atomic, idempotent
        ↓
creditInvestorWallet(userId, amount)  ← atomic_credit_wallet RPC
        ↓
completeTransaction(orderId, 'Completed')
        ↓
notifyDepositCompleted + referral activation
```

**Success page fallback:** If user returns before webhook, `DepositSuccessView` polls `syncDepositOrder()` every 5s (up to 3 min), which calls `syncNowPaymentsDepositStatus()` → same `completeDepositFromWebhook()` path.

**Realtime:** `useUserWalletRealtime` + `useLiveTransactions` update wallet/dashboard without manual refresh.

---

## Redirect Flow

| Stage | URL |
|-------|-----|
| User creates deposit | `/wallet/deposit` |
| NOWPayments checkout | External invoice URL |
| Payment success redirect | `/wallet/deposit/success?order={orderId}` |
| Payment cancel/fail redirect | `/wallet/deposit/failed?order={orderId}` |

Override via env: `PAYMENT_SUCCESS_REDIRECT_URL`, `PAYMENT_CANCEL_REDIRECT_URL` (order param appended automatically).

---

## Success Page

**Route:** `/wallet/deposit/success`

Displays:
- ✅ Deposit Successful (after sync confirms)
- Amount credited (from payment record)
- Current wallet balance (live via `useWalletPageData`)
- Transaction ID (order reference)
- Date
- **View Wallet** → `/wallet`
- **Continue Investing** → `/invest`

While webhook/sync pending: spinner + "Waiting for payment confirmation…"

---

## Failure Page

**Route:** `/wallet/deposit/failed`

Displays:
- Deposit failed message
- No wallet credit (webhook never calls `creditInvestorWallet` for failed statuses)
- Order reference (if present)
- **Try again** → `/wallet/deposit`
- **Back to Wallet** → `/wallet`

---

## Security Verification

| Area | Status |
|------|--------|
| Webhook signature required | ✅ |
| Order sync scoped to authenticated user | ✅ `syncDepositByOrderId(orderId, userId)` |
| Financial approver unchanged | ✅ Only `infojimvio@gmail.com` |
| Super Admin ownership | ✅ Only `infojimvio@gmail.com` |
| No auth/KYC/referral changes | ✅ |
| No schema changes | ✅ |

---

## Zero Regression Confirmation

| Check | Status |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass |
| `npm run build` | ✅ Pass |
| Authentication | ✅ Unchanged |
| KYC gates on deposit | ✅ Unchanged |
| Referral / investment / withdrawal logic | ✅ Unchanged |
| Wallet RPC credit/debit logic | ✅ Unchanged (credit path only invoked on confirmed deposit) |
| Existing deposit page UI | ✅ Unchanged |
| Admin transaction approval restrictions | ✅ Unchanged |

---

## Manual QA Checklist

### Admin ownership
- [ ] `infojimvio@gmail.com` — badge shows Platform Owner; can approve/reject transactions
- [ ] `fxinvestprime@gmail.com` — full admin nav; no approve/reject buttons; not Super Admin in code

### Deposit flow
- [ ] Create deposit → redirects to NOWPayments
- [ ] After payment → lands on `/wallet/deposit/success?order=…`
- [ ] Wallet balance updates without refresh (webhook or poll)
- [ ] Cancel payment → lands on `/wallet/deposit/failed`
- [ ] Replay webhook → no double credit
- [ ] Transaction history shows Completed deposit
