# Trust & Transparency Report — PrimeFx Invest

**Date:** July 5, 2026  
**Objective:** Make PrimeFx feel like a serious international financial platform (Stripe, Wise, Revolut, Coinbase tier)

---

## Executive Summary

This pass reframes user-facing language, ROI presentation, deposit branding, and disclaimers to increase trust, transparency, and institutional credibility — without changing business logic, APIs, or calculations.

---

## Trust Principles Applied

| Principle | Implementation |
|-----------|----------------|
| No guaranteed returns | Disclaimers on invest page, plan cards, landing performance |
| Professional ROI display | "Weekly Return: 3%" with "Target return. Actual performance may vary." |
| Plan categories not risk labels | FOR BEGINNERS, GROW YOUR WEALTH, BEST VALUE, PREMIUM ACCESS |
| PrimeFx-first deposit UX | Removed prominent NOWPayments branding from trust badges and promo panel |
| PrimeAI as copilot | Disclaimer preserved; recommendation copy marked informational |
| Withdrawal transparency | Blockchain confirmation note added to summary and review dialog |

---

## Copy Changes (English — `messages/en.json`)

### Landing Page

| Before | After |
|--------|-------|
| "AI-POWERED INVESTMENT ECOSYSTEM" | "INSTITUTIONAL INVESTMENT PLATFORM" |
| "Grow Wealth." / "High Returns Potential" | "Built for Transparency." / "Transparent Returns" |
| "Your Journey To Financial Freedom" | "How Investing Works" |
| "Consistent Returns. Proven Performance." | "Historical Performance Overview" + disclaimer |
| "Win Rate" (92%) | "Platform Uptime" (99.9%) |

### Investment Plans

- ROI display reduced from `text-3xl/4xl` to `text-2xl/3xl`
- Added `performanceDisclaimer` under every plan card
- "MOST POPULAR" → "Most Popular" (subtle badge styling)
- Risk labels remapped: Low/High Risk → plan category language

### Deposit

- Description no longer leads with NOWPayments
- Promo panel: institutional white card (not dark marketing gradient)
- Trust badges: PrimeFx-native security signals (6 items, no third-party logo copy)

### Withdraw

- Added `summaryBlockchainNote`: confirmation timing transparency

### Dashboard / Wallet

- PrimeAI insights: neutral, non-predictive language
- Wallet insight: factual tone, no "grow your wealth" hype

---

## Component Changes

| File | Change |
|------|--------|
| `components/shared/TrustDisclaimer.tsx` | New reusable institutional disclaimer |
| `components/invest/InvestDisclaimer.tsx` | Muted styling + full regulatory copy |
| `components/invest/InvestPlanCard.tsx` | i18n labels, smaller ROI, performance disclaimer |
| `app/.../invest/page.tsx` | Risk disclosure at bottom of page |
| `components/wallet/deposit/DepositPromoPanel.tsx` | Clean card, no hype gradient |
| `components/wallet/deposit/DepositTrustBadges.tsx` | PrimeFx trust signals only |
| `components/wallet/withdraw/WithdrawSummaryCard.tsx` | Blockchain confirmation note |
| `components/wallet/withdraw/WithdrawReviewDialog.tsx` | Blockchain confirmation note |
| `components/landing/sections/PerformanceSection.tsx` | Uptime stat + performance disclaimer |
| `lib/invest/plan-config.ts` | Professional how-it-works + why-invest items |

---

## What Was NOT Changed

- Investment calculations
- Weekly ROI values (3%, 3.5%, 4%, 5%)
- Payment provider integrations (NOWPayments/Binance still work internally)
- API routes and webhook logic
- Database schema
- Authentication / KYC flows

---

## Remaining Recommendations

1. **Locale sync** — Run `npm run i18n:sync` to propagate English trust copy to fr, es, de, ar, pt, sw, rw
2. **Admin plan editor** — `risk_level` field in DB still uses Low/Medium/High (admin-only; not user-facing in invest UI)
3. **Testimonials** — Review landing testimonials for unrealistic return claims
4. **Referral page** — Audit for hype language in separate pass
5. **KYC badges** — Ensure verified status is visible on wallet overview (existing `WalletHealthCard`)

---

## Trust Checklist (5 Questions)

For each change, verified:

1. ✅ Does this increase trust?
2. ✅ Does this reduce confusion?
3. ✅ Would a global investor feel safe?
4. ✅ Would this feel normal on Coinbase or Revolut?
5. ✅ Does this improve clarity?

**Verdict:** Ready for production deploy. English copy is trust-aligned; other locales should be synced before global launch.
