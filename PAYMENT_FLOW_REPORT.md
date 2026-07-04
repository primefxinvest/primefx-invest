# Payment Flow Report — PrimeFx Invest Deposit

**Date:** July 4, 2026  
**Scope:** End-to-end deposit user flow (frontend orchestration only)  
**Status:** Documented post-redesign

---

## Supported Methods

PrimeFx deposit supports **exactly two methods:**

1. **Crypto Payment** — powered by NOWPayments  
2. **Binance Pay** — powered by Binance Pay API  

No other funding rails are exposed in the deposit UI.

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1 — Enter Amount                                      │
│  • USD amount input + quick presets                         │
│  • Settlement currency (filtered by method)                 │
│  • Min $10 / Max $500,000 validation                        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2 — Select Payment Method                             │
│  • Crypto Payment (NOWPayments)                             │
│  • Binance Pay                                              │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3 — Review Summary                                    │
│  • Deposit amount, fee estimate, expected credit            │
│  • Processing time estimate                                 │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4 — Continue to Payment                               │
│  • KYC gate (unchanged)                                     │
│  • Rate limit check (unchanged)                             │
│  • initiateDeposit() server action                          │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌──────────────────┐    ┌──────────────────┐
   │ checkoutUrl      │    │ payAddress only  │
   │ → auto redirect  │    │ → inline display │
   └────────┬─────────┘    └──────────────────┘
            ▼
   NOWPayments invoice page
   OR Binance Pay checkout / QR
            ▼
   Webhook confirmation (unchanged)
            ▼
   Wallet credited via existing ledger
```

---

## NOWPayments Flow (Unchanged Backend)

1. User selects **Crypto Payment**
2. User enters amount and clicks **Continue to Payment**
3. Frontend calls `initiateDeposit({ amountUsd, currency, provider: 'now_payments' })`
4. Server creates invoice via `createNowPaymentsInvoice()` — **unchanged**
5. Server records payment via `recordDepositPayment()` — **unchanged**
6. Frontend receives `checkoutUrl` (invoice URL)
7. **UX change:** User is redirected immediately to NOWPayments
8. IPN webhook at `/api/webhooks/nowpayments` — **unchanged**
9. `syncUserPendingDeposits` / `SyncPendingDeposits` — **unchanged**

---

## Binance Pay Flow (Unchanged Backend)

1. User selects **Binance Pay**
2. User enters amount and clicks **Continue to Payment**
3. Frontend calls `initiateDeposit({ amountUsd, currency, provider: 'binance_pay' })`
4. Server creates order via `createBinancePayOrder()` — **unchanged**
5. Server records payment — **unchanged**
6. Frontend receives `checkoutUrl` (and optional `qrCodeLink`)
7. **UX change:** User is redirected immediately to Binance Pay
8. Webhook at `/api/webhooks/binance-pay` — **unchanged**

---

## Frontend Guardrails (New)

| Guard | Implementation |
|-------|------------------|
| Duplicate clicks | `submitLockRef.current` + `pending` transition |
| Invalid amount | Client validation against `INVESTOR_RULES.financial` |
| Provider disabled | Toast + inline error if env not configured |
| Network failure | try/catch → `networkError` toast + retry banner |
| KYC blocked | Existing `showKycRequiredToast` — unchanged |

---

## API Surface (Unchanged)

| Entry Point | Type | Modified |
|-------------|------|----------|
| `initiateDeposit` | Server action (`lib/wallet/actions.ts` → `lib/payments/actions.ts`) | No |
| `createDepositPayment` | Server service | No |
| `fetchPaymentProviderOptionsServer` | Server | No |
| `/api/webhooks/nowpayments` | Webhook | No |
| `/api/webhooks/binance-pay` | Webhook | No |
| `/api/payments/options` | API (modal) | No |

---

## Deposit Modal Parity

The quick-deposit modal (`DepositModal.tsx`) follows the same method selection, quick amounts, duplicate-click guard, and auto-redirect behavior for users who deposit from dashboard/wallet shortcuts.

---

## Fee Display (Informational Only)

| Method | Platform Fee (from `PAYMENT_PROVIDERS`) |
|--------|----------------------------------------|
| Binance Pay | 0% |
| NOWPayments | 0.5% |

Displayed in summary as **Network fee estimate** — does not alter server-side fee calculation.

---

## Processing Time Display

| Method | UI Label |
|--------|----------|
| Crypto Payment | ~5-30 mins |
| Binance Pay | Instant |

Derived from existing i18n keys `etaCrypto` / `etaInstant`.
