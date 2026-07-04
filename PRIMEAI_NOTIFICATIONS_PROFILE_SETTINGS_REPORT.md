# PrimeAI, Notifications, Profile & Settings — UX Optimization Report

**Date:** July 4, 2026  
**Scope:** Presentation-only UX improvements across four dashboard areas. No business logic, API, auth, payment, or schema changes.

---

## Summary

Improved chat UX, notification hierarchy with deep linking, profile security/KYC visibility, and settings grouping. Removed or hid unimplemented AI and settings features. Build passes.

---

## Files Modified

| File | Change type |
|------|-------------|
| `app/[locale]/(dashboard)/primeai/page.tsx` | Chat UX, a11y, typing indicator, suggestions |
| `app/[locale]/(dashboard)/notifications/page.tsx` | Date grouping, deep links, unread hierarchy |
| `app/[locale]/(dashboard)/profile/page.tsx` | Security/KYC sections, information grouping |
| `app/[locale]/(dashboard)/settings/page.tsx` | Section reorder, hide stubs, mobile layout |
| `components/dashboard/PrimeAIWidget.tsx` | Remove voice chat, fix placeholder greeting |
| `lib/notifications/routes.ts` | **New** — client-side deep link + date grouping helpers |

---

## Components Modified

### 1. PrimeAI

**Page (`primeai/page.tsx`)**
- Message area: `role="log"`, `aria-live="polite"`, improved spacing (`space-y-3/4`)
- **Typing indicator** with animated dots + `role="status"`
- **Suggested prompts** when only the welcome message is shown
- **Empty state** copy for new conversations
- **Keyboard:** Enter to send, Escape clears input
- **Accessibility:** labeled input, submit `aria-label`, error `role="alert"`
- **Mobile:** sticky input bar, full-width send on small screens
- **Loading:** spinner skeleton on Suspense fallback

**Dashboard widget (`PrimeAIWidget.tsx`)**
- Removed **Voice Chat** button (not implemented)
- Replaced fake **"Hi John!"** greeting with neutral assistant copy

*AI chat logic, `/api/chat`, and `useChat` transport unchanged.*

### 2. Notifications

**Page (`notifications/page.tsx`)**
- **Date grouping:** Today, Yesterday, This week, Earlier
- **Unread indicators:** larger dot, stronger unread card styling
- **Deep linking:** tap marks read and navigates to related page
- **Action labels:** contextual CTA text (e.g. "View wallet", "Security settings")
- Responsive header and card padding

**New helper (`lib/notifications/routes.ts`)**
- `getNotificationHref()` — maps type + title/message to routes:
  - `wallet` → `/wallet` or `/transactions`
  - `investment` / `payout` → `/portfolio` or `/invest`
  - `reward` → `/rewards` or `/referral`
  - `security` → `/settings` or `/profile`
  - `market` → `/market-insights`
- `groupNotificationsByDate()` — groups by `createdAt`

*Uses existing `createdAt` field; no API or schema changes.*

### 3. Profile

**Page (`profile/page.tsx`)**
- **Identity & Security** section with dedicated KYC and 2FA cards
- KYC status badge with verify CTA when pending
- 2FA status with link to **Settings → Security**
- **Personal Information** and **Account Status** as labeled sections
- Consistent `rounded-xl` card surfaces and mobile-friendly layouts
- Removed duplicate KYC row from account status (now in security section)

*Verification systems (`DiditVerificationPanel`, `VerifyIdentityButton`, profile actions) unchanged.*

### 4. Settings

**Page (`settings/page.tsx`)**
- **Account protection summary** at top (2FA + password/email status)
- **Reordered sections:** Security → Notifications → General → Privacy → Danger zone
- **Hidden unimplemented settings:**
  - Theme selector (removed)
  - Active sessions (removed)
  - Data collection toggle (removed)
- **Mobile:** stacked `SettingRow` layout for controls
- Real functionality preserved: language, currency, password, 2FA, notification toggles, profile visibility

---

## Risks Introduced

| Risk | Severity | Mitigation |
|------|----------|------------|
| Notification deep links use heuristics, not DB `metadata` | Low | Falls back gracefully; marks read even if no href |
| Clicking notification navigates away (may surprise users) | Low | Standard fintech pattern; action label shown |
| Profile KYC removed from account status section | Low | Still visible in Identity & Security + Didit panel |
| Theme preference no longer visible in UI | Low | Preference still loads/saves if re-enabled later |
| Suggested PrimeAI prompts send real API requests | Low | Same as manual input; disabled while loading |

No functional regressions identified. Build passes.

---

## Backend Impact

**None.**

- Same APIs: `/api/chat`, notification actions, profile actions, preferences save
- No database schema changes
- No authentication or payment logic modified
- Deep linking is client-side only (`lib/notifications/routes.ts`)

---

## Performance Impact

**Neutral.**

- No new network requests
- Date grouping and href resolution are in-memory O(n)
- PrimeAI typing indicator uses CSS animation only
- Settings page has fewer DOM nodes (hidden stub rows removed)

---

## Verification

- [x] Voice AI removed from dashboard PrimeAI widget
- [x] No fake PrimeAI settings/voice on main chat page
- [x] Notifications grouped by date with deep links
- [x] Profile KYC/2FA/security visibility improved
- [x] Unimplemented settings hidden (theme, sessions, data collection)
- [x] Real settings functionality intact
- [x] `npm run build` — success

---

## Design Intent

These areas should now feel:

- **Professional** — consistent section labels and card rhythm
- **Secure** — security summary on Settings and Profile
- **Premium** — clear hierarchy, polished chat and notification UX
- **Trustworthy** — no fake voice/settings features
- **Production-ready** — accessible chat, actionable notifications, focused settings
