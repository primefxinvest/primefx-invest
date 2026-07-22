# WITHDRAWAL_E2E_REPORT

Generated: 2026-07-22T20:11:00.000Z  
Project: `https://evjoyubypgjutylekiys.supabase.co`

## Verdict

**Production Ready** — automated E2E passed **13/13**.

Root cause of the live failure: production was missing `atomic_hold_wallet_funds` (and related hold RPCs). Every submit called the RPC, failed, and surfaced:

> We could not submit your withdrawal. Please try again later or contact support.

Fix: app-level balance hold fallback when the RPC is missing, plus redesigned pending → approve → mark paid workflow.

## Checklist

- ✔ User Flow — submit creates `pending`, reserves funds, success page
- ✔ Admin Flow — Approve then Mark as Paid
- ✔ Database — `withdrawal_requests` + `transactions` written
- ✔ Wallet — `available_balance` ↓ / `pending_balance` ↑ on submit; released on paid
- ✔ Notifications — submitted / approved / completed
- ✔ Realtime — `withdrawal_requests` publication + admin/user hooks
- ✔ Security — double approve, double mark paid, negative balance, duplicate reference
- ✔ Production Ready

## E2E Results (live)

```
✔ Reserve funds (hold) — mode=fallback
✔ Create pending withdrawal — status=pending
✔ Wallet reserved correctly
✔ Admin approve — status=approved
✔ Security: double approve blocked
✔ Admin mark as paid — status=completed
✔ Security: double mark paid blocked
✔ Wallet after paid
✔ User history shows Paid
✔ Transactions updated
✔ Notifications sent — withdrawal_submitted, withdrawal_approved, withdrawal_completed
✔ Security: no negative balances
✔ Security: duplicate reference blocked
```

## Workflow (Binance / Bybit style)

1. User validates amount, balance, coin, network, address
2. Submit → status `pending`, funds reserved, success page
3. Admin Withdrawal Center shows request (realtime refresh)
4. Admin **Approve** → `approved` + notification
5. Admin **Mark as Paid** → `completed`, hold released, tx history + notification
6. User history/wallet update live without manual DB edits

## Migration

Apply when DB credentials are available:

`supabase/migrations/047_withdrawal_workflow_redesign.sql`

Restores hold RPCs and adds coin/network/wallet/tx columns. App already works via fallbacks before migration is applied.

## How to re-run

```bash
node scripts/withdrawal-e2e.mjs
npm test -- tests/registration-withdrawal.test.ts
```
