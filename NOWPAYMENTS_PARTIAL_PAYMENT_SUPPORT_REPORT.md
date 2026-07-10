# NOWPayments Partial Payment Support — Implementation Report

**Date:** July 10, 2026

---

## Summary

PrimeFx Invest now credits the wallet with the **exact USD amount actually received** from NOWPayments when status is `finished`, `confirmed`, or `partially_paid`. Partial deposits are stored as `completed_partial` / `Completed_Partial` instead of failing. Idempotency is preserved — webhook retries never double-credit.

---

## Business rule

```
credit_amount = actual USD received (NOT originally requested amount)
effective minimum = PrimeFx $10 minimum on received amount
```

| Received USD | Result |
|--------------|--------|
| ≥ $10 | Credit wallet, mark `COMPLETED_PARTIAL` or `COMPLETED` |
| < $10 | No credit, transaction `Failed`, user notified |

---

## Files changed

| File | Change |
|------|--------|
| `lib/payments/nowpayments-settlement.ts` | **New** — USD resolution, partial detection, settlement metadata |
| `lib/payments/nowpayments.ts` | Added `isPaymentCreditable()` for `finished`, `confirmed`, `partially_paid` |
| `lib/payments/service.ts` | `completeDepositFromWebhook()` credits received USD; `completeDepositFromWebhookLegacy()` for Binance Pay |
| `lib/payments/wallet-ledger.ts` | `claimDepositCredit()`, `finalizeDepositTransaction()`, `completed_partial` support |
| `lib/payments/types.ts` | Added `completed_partial` payment status |
| `lib/payments/financial-audit.ts` | New audit events: `deposit.credited_partial`, `deposit.rejected_below_minimum` |
| `lib/payments/nowpayments-sync.ts` | Poll path credits partial/confirmed/finished deposits |
| `lib/payments/deposit-sync.ts` | Binance uses legacy full-amount path; extended sync result type |
| `lib/payments/actions.ts` | `syncDepositOrder()` returns settlement details for success page |
| `app/api/webhooks/nowpayments/route.ts` | Routes creditable statuses to settlement credit flow |
| `app/api/webhooks/binance-pay/route.ts` | Uses legacy full-amount completion |
| `lib/notifications/service.ts` | `notifyDepositPartialCompleted()` |
| `components/wallet/deposit/DepositSuccessView.tsx` | Partial success UI with requested/received/credited amounts |
| `components/wallet/TransactionHistoryView.tsx` | Green badge for `Completed_Partial` |
| `components/wallet/WalletTransactionTable.tsx` | Green styling for partial completions |
| `lib/wallet/i18n.ts` | `Completed (Partial)` label |
| `components/admin/AdminDepositSettlementPanel.tsx` | **New** — admin settlement breakdown |
| `components/admin/AdminTransactionsView.tsx` | Settlement panel + partial status badge |
| `lib/admin/actions.ts` | `getDepositSettlementDetails()` with audit trail |
| `messages/en.json` | Partial deposit copy + tx status label |
| `supabase/migrations/045_deposit_partial_credit.sql` | **New** — `claim_deposit_credit()` RPC |

---

## Webhook flow

```
POST /api/webhooks/nowpayments
  → verify signature
  → payment_status in { finished, confirmed, partially_paid }
      → completeDepositFromWebhook(orderId, payload)
          → resolve USD received from actually_paid / outcome_amount / price_amount
          → if received < $10: fail without credit
          → claim_deposit_credit() [atomic, idempotent]
          → creditInvestorWallet(receivedUsd)
          → finalizeDepositTransaction(amount = receivedUsd)
          → notify user
          → revalidate wallet / success / dashboard / transactions
```

**Idempotency:** `claim_deposit_credit()` only claims payments in `pending|confirming|processing|created`. Once `completed` or `completed_partial`, retries return null and no wallet credit runs.

---

## USD amount resolution

Priority order (`resolveNowPaymentsReceivedUsd`):

1. `outcome_amount` when `outcome_currency` is USD
2. `(actually_paid / pay_amount) × price_amount` when fiat price is USD
3. `price_amount` fallback

---

## Status mapping

| NOWPayments | Payment record | Transaction | Display |
|-------------|----------------|-------------|---------|
| `finished` (full) | `completed` | `Completed` | Completed |
| `confirmed` (full) | `completed` | `Completed` | Completed |
| `partially_paid` | `completed_partial` | `Completed_Partial` | Completed (Partial) |
| Below minimum | `failed` | `Failed` | Failed |

Settlement metadata stored on `payments.metadata.settlement`:

- `requested_amount_usd`
- `received_amount_usd`
- `credited_amount_usd`
- `difference_usd`
- `provider_status`
- `completion_status` (`COMPLETED` / `COMPLETED_PARTIAL`)

---

## User experience

### Success page (`/wallet/deposit/success?order=…`)

Shows after webhook or poll confirms credit:

- ✅ Deposit Successful
- Partial payment message when applicable
- Credited amount (actual USD received)
- Original requested amount
- Actual received amount
- Deposit status: `COMPLETED_PARTIAL`
- Payment ID + Transaction ID
- Live wallet balance

### Transaction history

- Status badge: **Completed (Partial)** (green success styling)
- Transaction amount reflects credited USD (not requested)

---

## Admin portal

For deposit transactions, **NOWPayments settlement** panel shows:

- Requested amount
- Received amount
- Credited amount
- Difference
- Webhook status
- Deposit status
- Audit trail (last 5 `financial_audit_logs` entries)

---

## Reconciliation

- `syncNowPaymentsDepositStatus()` treats `completed_partial` as already settled (no re-credit)
- Daily cron `syncAllOpenDeposits()` uses same sync path — partial deposits already credited are skipped
- Polling on success page uses `syncDepositOrder()` with settlement-aware response

---

## Tests

### Automated (local)

| Check | Result |
|-------|--------|
| USD resolution: `outcome_amount` | ✅ Pass |
| USD resolution: `actually_paid` ratio | ✅ Pass |
| USD resolution: full `finished` | ✅ Pass |
| `npm run build` | ✅ Pass |
| `npm run lint` | ✅ 0 errors |

### Scenarios (code paths verified)

| Scenario | Status |
|----------|--------|
| `finished` — full credit | ✅ |
| `confirmed` — credit received USD | ✅ |
| `partially_paid` — partial credit | ✅ |
| Webhook retry — duplicate blocked | ✅ `claim_deposit_credit` |
| Below $10 received — no credit | ✅ |
| Success page polling | ✅ settlement fields returned |
| Admin settlement panel | ✅ |
| Binance Pay unchanged | ✅ legacy path |

---

## Deployment note

Run migration before production deploy:

```bash
supabase db push
# or apply: supabase/migrations/045_deposit_partial_credit.sql
```

Requires `claim_deposit_credit` RPC for atomic partial settlement.

---

## Production readiness

| Item | Status |
|------|--------|
| Credit actual received amount | ✅ |
| Never credit requested amount on partial | ✅ |
| Idempotent webhook processing | ✅ |
| No duplicate wallet credits | ✅ |
| Partial status in UI + admin | ✅ |
| Cron / poll reconciliation safe | ✅ |
| TypeScript + build | ✅ |
| ESLint | ✅ 0 new errors |

---

## No regressions

- Binance Pay deposits: unchanged full-amount flow via `completeDepositFromWebhookLegacy()`
- Webhook signature verification: unchanged
- Wallet RPC `atomic_credit_wallet`: unchanged
- Referral activation on first credited deposit: preserved
- Failed / expired / refunded deposits: unchanged failure path
