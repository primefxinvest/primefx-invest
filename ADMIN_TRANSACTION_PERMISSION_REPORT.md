# Admin Transaction Permission Report

**Date:** July 10, 2026  
**Objective:** Restrict deposit, withdrawal, and investment transaction approve/reject actions to a single authorized email.

---

## Root Cause

Transaction approve/reject was gated only by the general `financial_management` admin module. Any account with Super Admin portal access (`fxinvestprime@gmail.com`, tier 1) could approve or reject all pending financial transactions and withdrawal queue items. There was no dedicated authorization layer separating **portal access** from **transaction approval authority**.

---

## Files Modified

| File | Change |
|------|--------|
| `lib/admin/transaction-approval-auth.ts` | **New.** Sole-approver email constant, permission helpers, and `403` error class |
| `lib/admin/super-admin.ts` | Added `isAuthorizedAdminPortalEmail()` so the transaction approver can access the admin portal without becoming Super Admin |
| `lib/admin/auth.ts` | Portal access for `infojimvio@gmail.com` (Finance Admin tier 2); re-exports transaction approval helpers; `assertTransactionApprovalPermission()` |
| `lib/admin/actions.ts` | Backend guard on `updateTransactionStatus`, `approveWithdrawalQueueItem`, `rejectWithdrawalQueueItem`; dual-approval threshold bypass for designated approver |
| `lib/admin/api-auth.ts` | Added `requireTransactionApprovalApiAccess()` returning HTTP 403 JSON for REST admin routes |
| `components/admin/AdminTransactionsView.tsx` | Hide Approve/Reject buttons when unauthorized (not disabled) |
| `components/admin/AdminWithdrawalsView.tsx` | Hide Approve/Reject buttons when unauthorized (not disabled) |
| `app/admin/(portal)/transactions/page.tsx` | Pass `canApproveTransactions` from server context |
| `app/admin/(portal)/rewards/page.tsx` | Pass `canApproveTransactions` from server context |

**Not modified:** Authentication flows, database schema, KYC, investment settlement logic, referral logic, deposit/withdrawal/wallet business logic, or non-authorization API behavior.

---

## Authorization Logic

### Sole transaction approver

```
TRANSACTION_APPROVAL_ADMIN_EMAIL = infojimvio@gmail.com
```

### Permission check

```typescript
canApproveOrRejectTransactions(email)
  → email.trim().toLowerCase() === 'infojimvio@gmail.com'
```

### Portal vs. approval separation

| Email | Admin portal | Approve/Reject transactions |
|-------|--------------|----------------------------|
| `infojimvio@gmail.com` | ✓ (Finance Admin, tier 2) | ✓ |
| `fxinvestprime@gmail.com` | ✓ (Super Admin, tier 1) | ✗ |
| Any other account | ✗ | ✗ |

### Backend enforcement (server actions)

All three mutation entry points call `assertTransactionApprovalPermission(context)` **after** module access and **before** any settlement:

1. `updateTransactionStatus()` — deposits, withdrawals, capital returns (investment type)
2. `approveWithdrawalQueueItem()` — withdrawal queue payouts
3. `rejectWithdrawalQueueItem()` — withdrawal queue rejections

Unauthorized callers receive:

```
You do not have permission to approve or reject transactions.
```

via `TransactionApprovalForbiddenError` (`statusCode: 403`).

### REST API helper

`requireTransactionApprovalApiAccess()` in `lib/admin/api-auth.ts` returns:

```json
HTTP 403 Forbidden
{ "error": "You do not have permission to approve or reject transactions." }
```

Ready for any admin REST route that performs transaction approval mutations. Current approve/reject flows use server actions (not REST POST), which enforce the same message via thrown errors.

### Transfers

No admin approve/reject flow exists for P2P transfers (instant settlement). No changes required.

---

## UI Verification

### Behavior for unauthorized admins (`fxinvestprime@gmail.com`, etc.)

- Approve and Reject buttons are **not rendered** (hidden, not disabled)
- No permission error banners or toasts on page load
- Pending transactions still display status, user, amount, and reference
- Actions column shows `—` where buttons would appear

### Behavior for authorized admin (`infojimvio@gmail.com`)

- Approve and Reject buttons render on pending transactions (`AdminTransactionsView`)
- Approve and Reject buttons render on eligible withdrawal queue rows (`AdminWithdrawalsView`)
- Confirmation dialogs and existing UX unchanged

### Pages affected

- `/admin/transactions` — deposit, withdrawal, investment (capital return) transactions
- `/admin/rewards` — withdrawal queue section

### Unaffected UI (by design)

- KYC Approve/Reject (`AdminKycView`, `AdminKycReviewControls`)
- Didit session Approve/Decline (`AdminVerificationsView`)
- Investment Activate/Suspend (`AdminInvestmentDetailView`)

---

## Backend Verification

| Scenario | Expected result | Enforced by |
|----------|-----------------|-------------|
| `infojimvio@gmail.com` approves deposit | Success | `assertTransactionApprovalPermission` passes |
| `infojimvio@gmail.com` rejects withdrawal | Success | Same |
| `infojimvio@gmail.com` approves ≥ $10,000 transaction | Success | Dual-approval threshold bypassed for designated approver |
| `fxinvestprime@gmail.com` calls `updateTransactionStatus` | Error with forbidden message | `assertTransactionApprovalPermission` |
| `fxinvestprime@gmail.com` calls `approveWithdrawalQueueItem` | Error with forbidden message | Same |
| `fxinvestprime@gmail.com` calls `rejectWithdrawalQueueItem` | Error with forbidden message | Same |
| Unauthenticated caller | `Unauthorized` | Existing `getContext()` guard |

---

## Security Verification

- **Defense in depth:** UI hides actions; server actions enforce regardless of client manipulation
- **Single source of truth:** `lib/admin/transaction-approval-auth.ts` owns the approver email and checks
- **No schema changes:** Authorization is application-layer only
- **Super Admin protection preserved:** `fxinvestprime@gmail.com` remains Super Admin for portal; DB trigger in migration 038 unchanged
- **Audit trail preserved:** Successful approvals still logged via `logAdminAction()` with acting admin context
- **No silent failures:** Unauthorized backend attempts throw explicit forbidden error (not swallowed)

---

## Zero Regression Confirmation

| Check | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | ✅ Pass |
| Production build (`npm run build`) | ✅ Pass |
| Authentication / login flows | ✅ Unchanged |
| Database schema / migrations | ✅ Unchanged |
| KYC approve/reject | ✅ Unchanged |
| Investment activate/suspend | ✅ Unchanged |
| Referral / rewards settings | ✅ Unchanged |
| Deposit / withdrawal / wallet settlement logic | ✅ Unchanged |
| Admin portal navigation & layout | ✅ Unchanged |
| Non-transaction admin actions for Super Admin | ✅ Unchanged |

---

## Manual QA Checklist

- [ ] Log in as `infojimvio@gmail.com` → `/admin/transactions` → Approve/Reject visible on pending rows
- [ ] Log in as `infojimvio@gmail.com` → `/admin/rewards` → Approve/Reject visible on eligible withdrawals
- [ ] Log in as `fxinvestprime@gmail.com` → same pages → no Approve/Reject buttons
- [ ] From browser devtools, invoke server action as `fxinvestprime@gmail.com` → receives forbidden message
- [ ] Confirm KYC and Didit approval flows still work for Super Admin
