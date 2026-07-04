# Production Monitoring Architecture

Prepared for PrimeFx Invest launch. This document defines log categories, retention, and integration points **without modifying business logic**.

---

## Design principles

1. **Structured JSON logs** — every log line includes `timestamp`, `level`, `service`, `correlationId`, `userId?`, `event`
2. **Separate concerns** — application, audit, payment, and admin logs use distinct channels
3. **PII minimization** — never log passwords, full card/crypto addresses, or raw KYC documents
4. **Correlation IDs** — propagate `x-request-id` from middleware through API routes and server actions

---

## Log categories

### 1. Application logs (`app`)

| Event | Level | Fields |
|-------|-------|--------|
| Page render error | `error` | route, digest, locale |
| Server action failure | `error` | action, userId, message |
| Auth session invalid | `warn` | path, reason |
| MFA challenge required | `info` | userId, path |
| Cron job start/end | `info` | job, durationMs, result |

**Sink:** Vercel Log Drain → Datadog / Axiom / Better Stack

### 2. API logs (`api`)

| Route group | Events |
|-------------|--------|
| `/api/chat` | request count, token usage, rate-limit hits |
| `/api/verify/*` | session start, status poll, webhook received |
| `/api/payments/options` | provider availability |
| `/api/cron/*` | auth result, job outcome, duration |

**Sink:** Same as application; tag with `layer:api`

### 3. Audit logs (`audit`) — compliance-grade, 7-year retention

| Event | Trigger |
|-------|---------|
| `user.login` | Successful auth |
| `user.logout` | Sign-out |
| `user.mfa.enabled` / `disabled` | MFA changes |
| `user.kyc.approved` / `rejected` | Didit sync |
| `user.profile.updated` | Profile server action |
| `admin.action` | Any admin mutation |
| `terms.acknowledged` | Terms banner acceptance |

**Sink:** Supabase `audit_logs` table (migration recommended) + async export to cold storage

### 4. Admin logs (`admin`)

| Event | Fields |
|-------|--------|
| User status change | adminId, targetUserId, oldStatus, newStatus |
| Transaction override | adminId, transactionId, action |
| KYC manual review | adminId, userId, decision |
| Platform settings change | adminId, key, oldValue?, newValue |

**Sink:** `audit_logs` with `category: admin`

### 5. Payment logs (`payment`)

| Event | Fields |
|-------|--------|
| `deposit.created` | orderId, userId, amount, provider |
| `deposit.completed` | orderId, userId, amount, provider, ipnId |
| `deposit.failed` | orderId, reason |
| `withdrawal.requested` | requestId, userId, amount, method |
| `withdrawal.released` | requestId, userId |
| `withdrawal.payout.initiated` | requestId, payoutId |
| `webhook.received` | provider, eventType, signatureValid |

**Sink:** Dedicated `payment_events` table + real-time alert on `deposit.completed` anomalies

### 6. Transfer logs (`transfer`)

| Event | Fields |
|-------|--------|
| `transfer.initiated` | senderId, recipientId, amount, fee |
| `transfer.completed` | transferId, referenceId |
| `transfer.failed` | transferId, reason, rollbackApplied |

### 7. Withdrawal logs (`withdrawal`)

| Event | Fields |
|-------|--------|
| `withdrawal.queued` | requestId, noticePeriodEnds |
| `withdrawal.processed` | requestId, cronRunId |
| `withdrawal.payout.webhook` | payoutId, status |

### 8. Referral logs (`referral`)

| Event | Fields |
|-------|--------|
| `commission.accrued` | referrerId, sourceUserId, level, amount, period |
| `commission.paid` | commissionId, referrerId, amount |
| `rank.bonus.paid` | userId, rank, amount |
| `profit.run.completed` | periodStart, periodEnd, investmentCount |

---

## Implementation phases

### Phase 1 — Launch (minimal)

- Vercel built-in logs + `@vercel/analytics` (already enabled)
- Console structured logging in webhook handlers and cron routes
- `CRON_SECRET` auth logging on failure

### Phase 2 — Post-launch (30 days)

- Add `lib/logging/logger.ts` wrapper (pino or console JSON)
- Middleware `x-request-id` generation
- Supabase `audit_logs` + `payment_events` tables
- Alert rules: failed webhook signature, cron auth failure, duplicate deposit attempt

### Phase 3 — Scale

- Log drain to observability platform
- Dashboards: payment volume, withdrawal queue depth, referral payout lag
- On-call alerts for wallet balance anomalies

---

## Alert thresholds (recommended)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Webhook signature failures | > 5 / hour | Page on-call |
| Cron job failure | Any in production | Page on-call |
| `/api/chat` requests | > 100 / min / IP | Rate limit + alert |
| Duplicate deposit attempt | Same orderId twice | Block + audit alert |
| Withdrawal queue backlog | > 50 pending > 24h | Ops review |

---

## Existing hooks in codebase

| Location | Current behavior | Monitoring gap |
|----------|------------------|----------------|
| `app/api/webhooks/*` | Signature verify + process | No structured event log |
| `lib/cron/daily-jobs.ts` | Returns job results | Results not persisted |
| `lib/payments/service.ts` | Status check before credit | No duplicate-attempt alert |
| `lib/referral/commission-service.ts` | Accrual + payout | No payout audit trail |
| `middleware.ts` | Auth redirects | No redirect reason logging |

---

## Environment variables for monitoring (future)

```env
# Optional observability
LOG_LEVEL=info
LOG_DRAIN_URL=
SENTRY_DSN=
AXIOM_TOKEN=
AXIOM_DATASET=primefx-production
```

No additional env vars required for Phase 1.
