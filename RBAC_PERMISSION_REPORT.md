# RBAC_PERMISSION_REPORT

Generated: 2026-07-22  
Project: PrimeFx Invest Admin Portal

## Verdict

**All permission tests passed (12/12).**

Deposit and withdrawal approval are now **separate** permission gates. Hidden UI buttons alone are never trusted — backend asserts enforce the same rules.

---

## Roles

| Role | Email | Portal modules | Deposits | Withdrawals | Owner-only |
|------|-------|----------------|----------|-------------|------------|
| Platform Owner | `infojimvio@gmail.com` | Full (tier 1) | Approve / Reject / Credit / Complete | Approve / Reject / Mark Paid | Unlock/relock holds, protect owner profile |
| Super Admin | `fxinvestprime@gmail.com` | Full (tier 1) | View / Search / Export only | Approve / Reject / Mark Paid | No |

---

## Permission split

| Helper | Who |
|--------|-----|
| `canApproveDeposits(email)` | Platform Owner only |
| `canApproveWithdrawals(email)` | Platform Owner **and** Super Admin |
| `assertDepositApprovalAccess` | Throws **403** `"You don't have permission to approve deposits."` |
| `assertWithdrawalApprovalAccess` | Throws 403 if neither portal financial admin |
| `assertTransactionTypeApprovalAccess(email, type)` | Routes by transaction type |

Files:

- `lib/admin/transaction-approval-auth.ts`
- `lib/admin/super-admin-emails.ts`
- `lib/admin/super-admin.ts`
- `lib/admin/auth.ts`
- `lib/admin/api-auth.ts`
- `lib/admin/actions.ts`
- `app/admin/(portal)/transactions/page.tsx`
- `app/admin/(portal)/withdrawals/page.tsx`
- `components/admin/AdminTransactionsView.tsx`
- `components/admin/AdminWithdrawalCenter.tsx` (receives withdrawal gate)
- `components/admin/AdminServiceRoleBanner.tsx`

---

## Verification matrix

### `infojimvio@gmail.com` — Platform Owner

| Check | Result |
|-------|--------|
| ✔ Full portal module access (tier 1) | Pass |
| ✔ Approve deposits | Pass |
| ✔ Reject deposits / credit wallet / complete | Pass |
| ✔ Approve withdrawals | Pass |
| ✔ Reject withdrawals | Pass |
| ✔ Mark withdrawals paid | Pass |
| ✔ Owner-only unlock/relock holds | Pass (still owner-gated) |

### `fxinvestprime@gmail.com` — Super Admin

| Check | Result |
|-------|--------|
| ✔ Full portal module access (tier 1) | Pass |
| ✔ Approve withdrawals | Pass |
| ✔ Reject withdrawals | Pass |
| ✔ Mark withdrawals paid | Pass |
| ✔ View / search / export deposits | Pass (UI still lists deposits) |
| ✔ Cannot approve deposits | Pass |
| ✔ Cannot reject deposits | Pass |
| ✔ Cannot credit / complete deposits | Pass |
| ✔ API/assert returns 403 with exact deposit message | Pass |

---

## Backend enforcement

| Action | Gate |
|--------|------|
| `updateTransactionStatus` (deposit / bonus / profit) | `assertDepositApprovalAccess` |
| `updateTransactionStatus` (withdrawal / other) | `assertWithdrawalApprovalAccess` |
| `approveWithdrawalQueueItem` | `assertWithdrawalApprovalPermission` |
| `rejectWithdrawalQueueItem` | `assertWithdrawalApprovalPermission` |
| `markWithdrawalPaidQueueItem` | `assertWithdrawalApprovalPermission` |
| `processDueFinancialJobsAction` (can complete deposits) | `assertDepositApprovalPermission` (owner only) |
| `requireDepositApprovalApiAccess` | HTTP **403** + deposit forbidden message |
| `requireWithdrawalApprovalApiAccess` | HTTP **403** + withdrawal forbidden message |

---

## Frontend enforcement

| Surface | Behavior for Super Admin |
|---------|--------------------------|
| Transactions — deposit rows | Approve / Reject hidden (`View only`) |
| Transactions — Process due jobs | Hidden (owner only) |
| Withdrawal Center | Approve / Reject / Mark as Paid visible |
| Copy address / reference / export / view user | Allowed |

Client handlers also toast the deposit forbidden message if invoked without permission.

---

## Automated tests

```bash
npm test -- tests/admin-rbac-permissions.test.ts
```

Result: **12 passed**.

Includes:

- Portal identity recognition
- Tier-1 module matrix
- Deposit vs withdrawal split
- Exact 403 deposit message
- Required verification matrix for both emails

---

## Production ready

✔ Platform Owner unrestricted  
✔ Super Admin full portal except deposit mutations  
✔ Split deposit / withdrawal permission layer  
✔ UI + API enforcement  
✔ Tests green  
