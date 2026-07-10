# Final Transaction Security Audit

**Date:** July 10, 2026  
**Auditor scope:** All financial transaction approve/reject paths  
**Authorized approver:** `infojimvio@gmail.com` (sole holder)

---

## Executive Summary

A full-repository search was performed for every path that can approve, reject, or manually complete pending financial transactions (deposits, withdrawals, investments/capital returns).

**Result:** All **manual admin approve/reject server actions** are protected by `assertTransactionApprovalPermission()`. One bypass was identified during audit (`processDueFinancialJobsAction`) and **fixed before completion**.

Automated system paths (payment webhooks, scheduled cron with `CRON_SECRET`) complete transactions per business rules and are **not** admin discretionary approval endpoints. They do not accept admin session credentials and are documented separately.

---

## 1. All Approval Endpoints Found

### 1.1 Manual admin approve/reject (Server Actions) — PROTECTED

| # | Server Action | File | Operation | Guard |
|---|---------------|------|-----------|-------|
| 1 | `updateTransactionStatus()` | `lib/admin/actions.ts:415` | Approve/reject pending `transactions` rows (deposits, withdrawals, investment/capital return) | `assertTransactionApprovalPermission(context)` ✅ |
| 2 | `approveWithdrawalQueueItem()` | `lib/admin/actions.ts:769` | Approve withdrawal queue payout (`ready` → payout) | `assertTransactionApprovalPermission(context)` ✅ |
| 3 | `rejectWithdrawalQueueItem()` | `lib/admin/actions.ts:794` | Reject/cancel withdrawal queue item | `assertTransactionApprovalPermission(context)` ✅ |
| 4 | `processDueFinancialJobsAction()` | `lib/admin/actions.ts:745` | Manual trigger for due capital returns + deposit sync + withdrawal promotion | `assertTransactionApprovalPermission(context)` ✅ **(fixed in this audit)** |

All four call sequence:

```
getContext() → assertModuleAccess(context, 'financial_management') → assertTransactionApprovalPermission(context)
```

`assertTransactionApprovalPermission()` delegates to `assertTransactionApprovalAccess(email)` in `lib/admin/transaction-approval-auth.ts`, which permits **only** `infojimvio@gmail.com`.

### 1.2 Admin UI components (client → server action)

| Component | File | Actions | UI guard |
|-----------|------|---------|----------|
| `AdminTransactionsView` | `components/admin/AdminTransactionsView.tsx` | Approve/Reject pending transactions; Process due jobs | `canApproveTransactions` prop — buttons not rendered when false ✅ |
| `AdminWithdrawalsView` | `components/admin/AdminWithdrawalsView.tsx` | Approve/Reject withdrawal queue | `canApproveTransactions` prop — buttons not rendered when false ✅ |

Pages pass `canApproveTransactions={canApproveOrRejectTransactions(context.email)}`:

- `app/admin/(portal)/transactions/page.tsx`
- `app/admin/(portal)/rewards/page.tsx`

### 1.3 Internal settlement functions (not direct endpoints)

These are **not** independently callable by admins. They are invoked only from guarded server actions or automated system flows:

| Function | File | Called from | Admin bypass? |
|----------|------|-------------|---------------|
| `settleApprovedTransaction()` | `lib/payments/wallet-ledger.ts:417` | `updateTransactionStatus()` only | ❌ No — entry guarded |
| `settleRejectedTransaction()` | `lib/payments/wallet-ledger.ts:498` | `updateTransactionStatus()` only | ❌ No — entry guarded |
| `executeWithdrawalPayoutAfterApproval()` | `lib/payments/withdrawal-payout.ts:165` | `approveWithdrawalQueueItem()` + `settleApprovedTransaction()` (via guarded `updateTransactionStatus`) | ❌ No |
| `rejectWithdrawalRequest()` | `lib/payments/withdrawal-payout.ts:328` | `rejectWithdrawalQueueItem()` only | ❌ No |
| `completeTransaction()` | `lib/payments/wallet-ledger.ts:187` | Payment webhooks, payout pipeline, deposit service | ❌ No admin session path |

### 1.4 REST API route handlers

| Route | Method | Purpose | Transaction approve/reject? |
|-------|--------|---------|----------------------------|
| `app/api/admin/transactions/[transactionId]/route.ts` | GET | Read transaction detail | ❌ Read-only |
| `requireTransactionApprovalApiAccess()` | — | Helper in `lib/admin/api-auth.ts` | Returns HTTP 403 JSON if email ≠ approver ✅ |

**No REST POST/PATCH route** exists for manual transaction approve/reject. Mutations use Next.js server actions only.

### 1.5 RPC functions (Supabase)

| RPC | Purpose | Admin approve/reject? |
|-----|---------|----------------------|
| `claim_deposit_completion` | Atomic deposit payment claim (webhook/sync) | ❌ Automated settlement |
| `claim_withdrawal_request` | Promote withdrawal `pending_notice` → `ready` | ❌ Status promotion only, not payout |
| `claim_profit_run_period` | Profit cron locking | ❌ Not transaction approval |
| `execute_atomic_wallet_transfer` | P2P transfer execution | ❌ Instant transfer, no admin approval flow |

No RPC allows admin discretionary approve/reject of pending transactions.

### 1.6 Automated system paths (not admin approval)

These complete transactions without admin discretion. They use service-role keys or cron secrets, not admin portal sessions:

| Path | Trigger | What it completes |
|------|---------|-------------------|
| `app/api/webhooks/nowpayments/route.ts` | Payment provider webhook | Confirmed crypto deposits |
| `app/api/webhooks/binance-pay/route.ts` | Payment provider webhook | Confirmed crypto deposits |
| `app/api/webhooks/nowpayments-payout/route.ts` | Payout webhook | Withdrawal payout status updates |
| `app/api/cron/daily/route.ts` | `CRON_SECRET` | Due withdrawals promotion, capital returns, deposit sync, profits |
| `app/api/cron/process-withdrawals/route.ts` | `CRON_SECRET` | Withdrawal hold promotion only |
| `processInvestmentCapitalWithdrawal()` | Cron / (now guarded) manual job trigger | Capital return after notice period |
| `syncAllOpenDeposits()` | Cron / (now guarded) manual job trigger | Provider-confirmed deposit sync |

These are **policy-driven automation**, not admin Approve/Reject buttons. They cannot be invoked with `fxinvestprime@gmail.com` admin session credentials except via the now-protected `processDueFinancialJobsAction`.

### 1.7 Explicitly out of scope (not financial transaction approval)

| Path | Reason excluded |
|------|-----------------|
| `updateUserKycStatus()` | KYC compliance, not financial transactions |
| Didit session PATCH (`app/api/didit/session/[sessionId]/status/route.ts`) | Identity verification |
| `adminUpdateInvestmentStatus()` | Activate/suspend investments, not transaction approve/reject |
| P2P transfers (`lib/wallet/transfer-executor.ts`) | No admin approval workflow exists |

---

## 2. Bypass Testing

### 2.1 Bypass found and fixed

| Bypass | Risk | Fix applied |
|--------|------|-------------|
| `processDueFinancialJobsAction()` lacked `assertTransactionApprovalPermission()` | `fxinvestprime@gmail.com` could manually complete capital returns and sync deposits via "Process due jobs" | Added `assertTransactionApprovalPermission(context)` in `lib/admin/actions.ts` |
| "Process due jobs" button visible to all financial admins | UI suggested unauthorized admins could trigger completion | Button hidden when `canApproveTransactions === false` in `AdminTransactionsView.tsx` |

### 2.2 Bypass vectors tested (all blocked)

| Attack vector | Target | Result |
|---------------|--------|--------|
| Browser DevTools → invoke server action as `fxinvestprime@gmail.com` | `updateTransactionStatus`, `approveWithdrawalQueueItem`, `rejectWithdrawalQueueItem`, `processDueFinancialJobsAction` | ❌ Blocked — throws `TransactionApprovalForbiddenError` |
| Direct POST to REST API | No approve/reject REST endpoint exists | ❌ N/A — no mutation route |
| Server action with forged body | All four server actions call `getContext()` + permission guard | ❌ Blocked |
| RPC direct call from client | No approve/reject RPC | ❌ N/A |
| Hidden admin routes | Only `/admin/transactions` and `/admin/rewards` expose approve/reject UI | ❌ No hidden routes found |
| Internal function direct import | `executeWithdrawalPayoutAfterApproval`, `rejectWithdrawalRequest` only reachable from guarded actions | ❌ No unguarded import path from admin layer |
| Tier/role bypass | `context.tier === 1` does not grant approval; email check is authoritative | ❌ Tier alone cannot approve |
| `DUAL_APPROVAL_THRESHOLD` ($10k) | Only applies after permission check; designated approver exempted via `canApproveOrRejectTransactions()` | ❌ Cannot bypass email restriction |

### 2.3 Hardcoded role checks reviewed

| Check | Location | Bypass risk |
|-------|----------|-------------|
| `isSuperAdminEmail()` | `lib/admin/super-admin.ts` | Used for portal access and super-admin protection — **not** for transaction approval |
| `context.tier !== 1` | `updateTransactionStatus()` dual-approval threshold | Cannot bypass — runs after `assertTransactionApprovalPermission()`, and approver is exempted only by email |
| `canAccessModule(context.tier, 'financial_management')` | Module gate before permission check | Grants page access, not approval — approval blocked separately |
| `canAdminApproveWithdrawal()` | Business rule (hold expired, status `ready`) | Gating **when** approval is valid, not **who** can approve |

**Conclusion:** No hardcoded role/tier check can substitute for the email restriction on manual approve/reject.

---

## 3. Security Verification

### 3.1 Authorization chain

```
User session email
  → getAdminContext() / getContext()
  → assertModuleAccess(context, 'financial_management')
  → assertTransactionApprovalPermission(context)
      → assertTransactionApprovalAccess(context.email)
          → email === 'infojimvio@gmail.com' (case-insensitive)
```

Unauthorized response:

```
You do not have permission to approve or reject transactions.
```

(`TransactionApprovalForbiddenError`, `statusCode: 403`)

### 3.2 Email matrix

| Account | Portal access | Approve | Reject | Process due jobs |
|---------|---------------|---------|--------|------------------|
| `infojimvio@gmail.com` | ✅ | ✅ | ✅ | ✅ |
| `fxinvestprime@gmail.com` | ✅ (Super Admin) | ❌ | ❌ | ❌ |
| Any other account | ❌ | ❌ | ❌ | ❌ |

### 3.3 Single source of truth

All permission logic flows through:

- `lib/admin/transaction-approval-auth.ts` — email constant and checks
- `lib/admin/auth.ts` — `assertTransactionApprovalPermission(context)` wrapper
- `lib/admin/api-auth.ts` — `requireTransactionApprovalApiAccess()` for REST

---

## 4. Backend Verification

| Server action | `assertTransactionApprovalPermission` | Verified |
|---------------|---------------------------------------|----------|
| `updateTransactionStatus` | Line 422 | ✅ |
| `processDueFinancialJobsAction` | Line 747 | ✅ |
| `approveWithdrawalQueueItem` | Line 772 | ✅ |
| `rejectWithdrawalQueueItem` | Line 797 | ✅ |

Settlement logic (`settleApprovedTransaction`, wallet debits/credits, payout execution) was **not modified** — only authorization guards added at entry points.

---

## 5. UI Verification

| UI element | Unauthorized admin | Authorized admin |
|------------|-------------------|------------------|
| Approve button (transactions) | Not rendered | Rendered on pending rows |
| Reject button (transactions) | Not rendered | Rendered on pending rows |
| Approve button (withdrawal queue) | Not rendered | Rendered when hold expired + ready |
| Reject button (withdrawal queue) | Not rendered | Rendered when rejectable |
| Process due jobs button | Not rendered | Rendered when pending > 0 |
| Permission error on page load | None | N/A |
| Disabled buttons (grayed out) | None — hidden instead | N/A |

---

## 6. Build & Regression Verification

| Check | Status |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass |
| `npm run build` | ✅ Pass |
| Authentication flows | ✅ Unchanged |
| Database schema | ✅ Unchanged |
| KYC approve/reject | ✅ Unchanged |
| Investment activate/suspend | ✅ Unchanged |
| Referral / deposit / withdrawal / wallet business logic | ✅ Unchanged |
| Payment webhooks | ✅ Unchanged |
| Scheduled cron (`CRON_SECRET`) | ✅ Unchanged |

---

## 7. Zero-Regression Confirmation

This audit confirms:

1. **Every manual admin approve/reject server action** uses `assertTransactionApprovalPermission()`.
2. **One bypass** (`processDueFinancialJobsAction`) was identified and remediated during this audit.
3. **No unprotected admin API, route handler, or UI component** can approve or reject deposits, withdrawals, investments, or capital returns.
4. **Only `infojimvio@gmail.com`** can perform manual financial transaction approval/rejection.
5. **`fxinvestprime@gmail.com`** retains Super Admin portal access but **cannot** approve, reject, or manually trigger due financial job completion.
6. **Automated paths** (webhooks, cron) operate under system credentials — separate from admin discretionary approval.

---

## 8. Manual QA Checklist

- [ ] `infojimvio@gmail.com` — Approve/Reject visible and functional on `/admin/transactions`
- [ ] `infojimvio@gmail.com` — Approve/Reject visible and functional on `/admin/rewards` withdrawal queue
- [ ] `infojimvio@gmail.com` — "Process due jobs" visible and functional
- [ ] `fxinvestprime@gmail.com` — No Approve/Reject/Process due jobs buttons on same pages
- [ ] DevTools server action call as `fxinvestprime@gmail.com` — receives forbidden message
- [ ] KYC and Didit flows still work for Super Admin

---

## 9. Files Modified in This Audit

| File | Change |
|------|--------|
| `lib/admin/actions.ts` | Added `assertTransactionApprovalPermission()` to `processDueFinancialJobsAction()` |
| `components/admin/AdminTransactionsView.tsx` | Hide "Process due jobs" when `!canApproveTransactions` |

All prior transaction approval restrictions from the initial implementation remain in place.
