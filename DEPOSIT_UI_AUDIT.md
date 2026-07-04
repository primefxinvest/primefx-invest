# Deposit UI Audit — PrimeFx Invest

**Date:** July 4, 2026  
**Scope:** `/wallet/deposit` page and deposit modal  
**Status:** Redesigned (UI/IA only)

---

## Executive Summary

The deposit experience has been rebuilt as a world-class crypto funding flow comparable to Binance Pay, Coinbase Commerce, and Crypto.com — while preserving all existing payment integrations, webhook configurations, and backend business logic.

Only **Crypto Payment (NOWPayments)** and **Binance Pay** are presented. All references to credit cards, debit cards, bank transfers, mobile money, and PayPal have been removed from the deposit UI.

---

## Before vs After

### Before

- Four wallet stat cards + step indicator
- Method selection (2 options) mixed with amount form
- Manual “open checkout” link after payment creation
- Optional note field
- Generic feature cards
- Hardcoded $50,000 max in copy (backend allows $500,000)
- Card/bank “coming soon” messaging

### After — Five-Section Layout

| Section | Component | Content |
|---------|-----------|---------|
| 1 | `DepositHeroCard` | Secure Deposit, Instant Confirmation, 24/7 Processing, Bank-grade security, crypto count |
| 2 | `DepositAmountCard` | USD input, quick amounts ($50–$5000), currency selector, estimated receive |
| 3 | `DepositMethodSelector` | Premium Crypto Payment + Binance Pay cards with supported asset badges |
| 4 | `DepositSummaryCard` | Amount, method, currency, fee estimate, expected credit, processing time |
| 5 | `DepositSecuritySection` | Webhook verification, fraud protection, wallet protection |

**Sidebar (retained):** Wallet stats, limits panel, recent deposits, help panel — lazy-loaded.

---

## Payment Methods Shown

| Method | Provider | Backend |
|--------|----------|---------|
| Crypto Payment | NOWPayments | `initiateDeposit({ provider: 'now_payments' })` — unchanged |
| Binance Pay | Binance Pay API | `initiateDeposit({ provider: 'binance_pay' })` — unchanged |

---

## UX Improvements

- **Direct redirect** to NOWPayments / Binance checkout on success (`window.location.href`)
- **Quick amount presets:** $50, $100, $250, $500, $1000, $5000
- **Real-time USD formatting** with live preview
- **Min/max from `INVESTOR_RULES`:** $10 – $500,000
- **Duplicate submission guard:** `submitLockRef` + `pending` state
- **Premium error banner** with retry
- **Loading states:** “Creating payment…”, “Redirecting to payment…”
- **44px minimum touch targets** on mobile CTAs and quick amounts

---

## Files Added / Modified

| Path | Action |
|------|--------|
| `components/wallet/deposit/DepositHeroCard.tsx` | Added |
| `components/wallet/deposit/DepositAmountCard.tsx` | Added |
| `components/wallet/deposit/DepositMethodSelector.tsx` | Added |
| `components/wallet/deposit/DepositSummaryCard.tsx` | Added |
| `components/wallet/deposit/DepositSecuritySection.tsx` | Added |
| `components/wallet/deposit/useDepositFlow.ts` | Added |
| `components/wallet/DepositPageView.tsx` | Rewritten |
| `components/wallet/DepositModal.tsx` | Updated for parity |
| `lib/payments/brands.ts` | Label key → `methodCryptoPayment` |
| `messages/en.json` | New deposit copy keys |

---

## Constraints Verified

- [x] Route unchanged: `/wallet/deposit`
- [x] `initiateDeposit` / `createDepositPayment` untouched
- [x] NOWPayments integration logic untouched
- [x] Binance Pay integration logic untouched
- [x] Webhooks and reconciliation untouched
- [x] No wallet/referral/investment calculation changes
- [x] PrimeFx `#0052ff` primary preserved

---

## Reference Quality

| Platform | Pattern Applied |
|----------|-----------------|
| Binance Pay | Large method cards, instant badge |
| Coinbase Commerce | Amount-first flow, summary before redirect |
| Crypto.com | Hero trust signals, crypto badges |
| Kraken | Fee estimate + expected credit |
| Revolut | Clean mobile full-width cards |
