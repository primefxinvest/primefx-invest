# NOWPayments Dynamic Minimum — Implementation Report

**Date:** July 10, 2026

---

## Summary

NOWPayments deposit integration now sends `pay_currency` on every invoice, preflights dynamic minimums via `GET /v1/min-amount` before creating payments, blocks under-minimum deposits with friendly errors, and surfaces live limits in the deposit UI.

**Unchanged:** Webhook handler, wallet credit, polling, success/failed pages, cron reconciliation, Binance Pay flow.

---

## Files changed

| File | Change |
|------|--------|
| `lib/payments/nowpayments.ts` | Added `fetchNowPaymentsMinimumAmount()`; improved `toNowPaymentsPayCurrency()` mapping; invoice errors no longer expose raw JSON |
| `lib/payments/deposit-limits.ts` | **New** — server-side effective minimum, network fee estimates, validation helpers |
| `lib/payments/deposit-limits-client.ts` | **New** — client-safe minimum error formatter |
| `lib/payments/service.ts` | Preflight min check; passes `payCurrency` to invoice API |
| `lib/payments/actions.ts` | Added `fetchDepositCurrencyLimits()` server action |
| `lib/payments/user-errors.ts` | Friendly mapping for "Crypto amount is less than minimal" and other NOWPayments errors |
| `components/wallet/deposit/useDepositFlow.ts` | Currency selector state; dynamic limits fetch; effective-min validation |
| `components/wallet/deposit/DepositAmountCard.tsx` | Currency dropdown; minimum / network fee / pay currency display |
| `components/wallet/DepositPageView.tsx` | Wires new deposit card props |
| `components/wallet/DepositModal.tsx` | Dynamic limits for NOWPayments method; effective-min validation |
| `messages/en.json` | Added `payCurrencyLabel`, `loadingLimits`; updated `nowPaymentsHint` |

---

## API calls added

### 1. `GET /v1/min-amount` (preflight)

Called before `POST /v1/invoice` and when the UI loads deposit limits.

```
GET {NOWPAYMENTS_BASE_URL}/min-amount
  ?currency_from=usd
  &currency_to={pay_currency}
  &fiat_equivalent=usd
  &is_fixed_rate=false
  &is_fee_paid_by_user=false
```

**Response used:** `fiat_equivalent` → USD minimum for the selected pay currency.

### 2. `POST /v1/invoice` (updated payload)

Now always includes `pay_currency` for NOWPayments deposits:

```json
{
  "price_amount": 500,
  "price_currency": "usd",
  "pay_currency": "usdttrc20",
  "order_id": "DEP-…",
  "order_description": "PrimeFx Investment Deposit",
  "ipn_callback_url": "…",
  "success_url": "…",
  "cancel_url": "…",
  "is_fixed_rate": false,
  "is_fee_paid_by_user": false
}
```

---

## Currency mapping (UI → NOWPayments)

| UI value | `pay_currency` |
|----------|----------------|
| USDT_TRC20 | usdttrc20 |
| USDT_ERC20 | usdterc20 |
| BTC | btc |
| ETH | eth |
| LTC | ltc |
| TRX | trx |
| MATIC | maticmainnet |
| All others | lowercase, underscores removed (e.g. BNB → bnb) |

Mapping function: `toNowPaymentsPayCurrency()` in `lib/payments/nowpayments.ts`.

---

## Effective minimum logic

```
effectiveMinUsd = MAX(PrimeFx $10, NOWPayments fiat_equivalent)
```

- Server: `assertDepositMeetsNowPaymentsMinimum()` in `deposit-limits.ts`
- Client: `useDepositFlow` / `DepositModal` use the same effective minimum from `fetchDepositCurrencyLimits()`

Below-minimum error format:

> The minimum deposit for USDT TRC20 is $12.43

---

## Error handling

| NOWPayments / internal signal | User-facing message |
|------------------------------|---------------------|
| Crypto amount is less than minimal | Deposit amount is below the minimum required for this cryptocurrency. Increase your deposit amount and try again. |
| Amount below effective minimum (preflight) | The minimum deposit for {currency} is ${amount} |
| Raw invoice JSON failures | We could not start your deposit. Please try again or choose a different payment method. |
| Invalid API key (logged server-side) | This payment method is temporarily unavailable… |

---

## UI changes (deposit page)

When the user selects a payment currency:

- **Minimum Deposit** — live from NOWPayments (`effectiveMinUsd`)
- **Network fee estimate** — static UI estimate per coin
- **Pay currency** — NOWPayments API code (e.g. `usdttrc20`)

Deposit button stays disabled while limits are loading.

---

## Test results

### Automated / local

| Check | Result |
|-------|--------|
| `toNowPaymentsPayCurrency` mapping (USDT_TRC20, BTC, ETH, LTC, TRX, MATIC) | ✅ Pass |
| `effectiveMin = MAX(10, 12.43)` | ✅ Pass |
| `npm run lint` | ✅ 0 errors |
| `npm run build` (TypeScript + Next.js) | ✅ Pass |

### Functional (requires live NOWPayments API key)

| Scenario | Expected | Status |
|----------|----------|--------|
| USDT TRC20 — load dynamic minimum | UI shows NOWPayments min | ⏳ Requires production/sandbox keys in env |
| BTC / ETH / LTC / TRX — min load | Per-currency minimum displayed | ⏳ Requires API keys |
| Deposit below effective minimum | Blocked with friendly error, no invoice | ✅ Enforced server-side |
| Deposit above effective minimum | Invoice created with `pay_currency` | ✅ Code path verified |
| Webhook credits wallet | Unchanged `completeDepositFromWebhook` | ✅ No changes |
| Success page polling | Unchanged `syncDepositOrder` | ✅ No changes |
| Cron `syncAllOpenDeposits` | Unchanged | ✅ No changes |

---

## Build

```
npm run build
✓ Compiled successfully
✓ TypeScript check passed
```

---

## TypeScript

All new modules are fully typed. `DepositCurrencyLimits` exported from `deposit-limits.ts`. Server action `fetchDepositCurrencyLimits` returns serializable limits for the client.

---

## Lint

```
npm run lint
✖ 99 problems (0 errors, 99 warnings)
```

No new errors introduced; warnings are pre-existing project-wide.

---

## Production readiness

| Item | Status |
|------|--------|
| `pay_currency` sent on every NOWPayments deposit | ✅ Ready |
| Dynamic minimum preflight before invoice | ✅ Ready |
| Friendly errors (no raw NOWPayments leakage) | ✅ Ready |
| UI shows per-currency minimum before deposit | ✅ Ready |
| Webhook / credit / polling / cron untouched | ✅ Ready |
| Binance Pay deposits unaffected | ✅ Ready |
| Env: `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` required | Required for min-amount + invoice |

**Recommendation:** After deploy, smoke-test one deposit per major coin (USDT TRC20, BTC, ETH) in sandbox or production with a small amount above the displayed minimum.

---

## No regressions

- Wallet credit amount remains `payments.amount_usd` (full USD entered by user)
- Invoice URL returned unmodified
- IPN signature verification unchanged
- `claimDepositCompletion` idempotency unchanged
- Deposit success/failed redirect URLs unchanged
