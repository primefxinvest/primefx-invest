# Payment Security Report — PrimeFx Deposit UI

**Date:** July 4, 2026  
**Scope:** Deposit experience security posture (UI disclosure + preserved backend controls)  
**Status:** Audited

---

## Important Scope Note

This report covers **security as presented in the deposit UI** and **confirmation that backend security controls were not modified**. No changes were made to authentication, webhook verification, fraud rules, or wallet ledger logic.

---

## Backend Security Controls (Preserved — Not Modified)

| Control | Location | Status |
|---------|----------|--------|
| User authentication | `requireUser()` in payment actions | Unchanged |
| KYC gate | `requireVerifiedKyc()` | Unchanged |
| Active account check | `requireActiveAccountForFinancialAction()` | Unchanged |
| Rate limiting | `enforceUserRateLimit('deposit')` | Unchanged |
| Amount bounds | `INVESTOR_RULES.financial.minimumDeposit / maximumSingleDeposit` | Unchanged |
| Provider config validation | `isProviderConfigured()` | Unchanged |
| Currency validation | `isCurrencySupportedByProvider()` | Unchanged |
| Payment reference generation | `generatePaymentReference()` | Unchanged |
| Webhook IPN (NOWPayments) | `/api/webhooks/nowpayments` | Unchanged |
| Webhook (Binance Pay) | `/api/webhooks/binance-pay` | Unchanged |
| Deposit reconciliation | `syncUserPendingDeposits`, `deposit-sync.ts` | Unchanged |
| Financial audit logging | `logFinancialAudit` | Unchanged |
| Wallet credit | `creditInvestorWallet`, `wallet-ledger.ts` | Unchanged |

---

## UI Security Disclosures (Section 5)

The deposit page displays investor-facing security assurances:

| Display | Meaning |
|---------|---------|
| ✓ Secure payment processing | Payments handled by certified providers (NOWPayments / Binance) |
| ✓ Webhook verification enabled | IPN/signature verification on server — existing implementation |
| ✓ Fraud protection active | Platform rate limits + KYC + account status checks |
| ✓ Investor wallet protection enabled | Ledger-based crediting with idempotent completion |

These statements reflect **existing platform capabilities**, not new security features.

---

## Frontend Safety Measures (New UX Layer)

| Measure | Purpose |
|---------|---------|
| Duplicate submission lock | Prevents accidental double payment creation |
| Disabled CTA while pending | Visual + interaction guard during API call |
| KYC toast before submit | Blocks unverified users client-side (server also enforces) |
| Auto-redirect via `window.location.href` | Reduces phishing via fake intermediate pages |
| Error retry with same validation | Prevents bypass of amount checks |
| No sensitive data in UI state | Only public checkout URLs and addresses from API |

---

## Provider Security (Unchanged)

### NOWPayments

- Invoice created server-side with API key (never exposed to client)
- IPN secret verification on webhook — **unchanged**
- User redirected to official NOWPayments hosted invoice URL

### Binance Pay

- Order signed server-side with merchant credentials — **unchanged**
- Webhook signature validation — **unchanged**
- User redirected to official Binance Pay checkout URL

---

## Data Handling

| Data | Client Exposure |
|------|-----------------|
| API keys / secrets | Never sent to client |
| Checkout URL | Returned after authenticated server action |
| Pay address | Returned only when invoice flow requires direct send |
| User email | Passed server-side to NOWPayments invoice — unchanged |

---

## Removed Risk Surface (UI)

| Removed | Rationale |
|---------|-----------|
| “Card coming soon” CTAs | Eliminates user expectation of unsupported rails |
| Bank transfer references in deposit copy | Only crypto + Binance Pay supported |
| Manual copy-paste checkout as primary path | Direct redirect reduces user error |

---

## Compliance Hooks (Preserved)

- `KycFinancialBanner` on deposit page — unchanged
- AML threshold rules in `INVESTOR_RULES.compliance` — unchanged server-side
- Terms acknowledgement banner (dashboard layout) — unchanged

---

## Recommendations (Future — Out of Scope)

1. Add CSP-friendly external link indicator if opening checkout in new tab fallback
2. Session expiry warning before long-lived payment sessions
3. Display payment expiry countdown when provider returns TTL metadata

---

## Conclusion

The deposit UI redesign improves clarity, reduces user error, and adds client-side submission guards **without altering** PrimeFx’s existing payment security architecture, webhook verification, or wallet reconciliation pipeline.
