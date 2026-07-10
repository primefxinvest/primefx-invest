'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowLeft,
  Bitcoin,
  Building2,
  CreditCard,
  LogIn,
  Mail,
  MapPin,
  Monitor,
  Phone,
  Shield,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { AdminKycDocumentsSection } from '@/components/admin/AdminKycDocumentsSection'
import { AdminKycReviewControls } from '@/components/admin/AdminKycReviewControls'
import { AdminReferralAccessToggle } from '@/components/admin/AdminReferralAccessToggle'
import { EmptyState } from '@/components/shared/data-state'
import { ScrollTable } from '@/components/shared/ScrollTable'
import type { AdminUserDetail } from '@/lib/admin/types'
import { formatCurrency, formatDate, formatDateTime, formatPercent } from '@/lib/data/format'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import { cn } from '@/lib/utils'

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || '—'}</dd>
    </div>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}) {
  const styles = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-600',
  }

  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', styles[tone])}>
      {label}
    </span>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  )
}

function paymentMethodIcon(type: string) {
  const normalized = type.toLowerCase()
  if (normalized.includes('crypto') || normalized.includes('bitcoin')) return Bitcoin
  if (normalized.includes('card')) return CreditCard
  if (normalized.includes('bank')) return Building2
  return Wallet
}

function activityIcon(action: string) {
  const normalized = action.toLowerCase()
  if (normalized.includes('login')) return LogIn
  if (normalized.includes('profile') || normalized.includes('update')) return User
  return Monitor
}

function formatPaymentMethodLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AdminUserDetailView({
  detail,
  globalReferralEnabled = false,
}: {
  detail: AdminUserDetail
  globalReferralEnabled?: boolean
}) {
  const {
    profile,
    mfa,
    wallet,
    portfolio,
    investments,
    transactions,
    withdrawals,
    pending_deposits,
    pending_withdrawals,
    referrals,
    activity,
    payment_methods,
    kyc_submission,
  } = detail

  const mfaLabel = mfa.bypassed
    ? 'Bypassed (admin)'
    : mfa.factorCount > 0
      ? 'Enabled'
      : 'Off'

  const mfaTone = mfa.bypassed ? 'warning' : mfa.factorCount > 0 ? 'success' : 'neutral'
  const accountTone =
    profile.account_status === 'active'
      ? 'success'
      : profile.account_status === 'suspended'
        ? 'danger'
        : 'warning'

  const avatarSrc = profile.avatar_url || getDefaultAvatarUrl(profile.full_name ?? profile.email)

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <Link
            href="/admin/users"
            className="inline-flex w-fit items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <img
              src={avatarSrc}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full border border-border object-cover sm:h-16 sm:w-16"
            />
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                {profile.full_name || 'Unnamed investor'}
              </h2>
              <p className="mt-1 truncate text-muted-foreground">{profile.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge label={profile.investor_tier ?? 'Starter'} tone="neutral" />
                <StatusBadge label={profile.kyc_status ?? 'Pending'} tone={profile.kyc_status === 'Verified' ? 'success' : profile.kyc_status === 'Rejected' ? 'danger' : 'warning'} />
                <StatusBadge label={mfaLabel} tone={mfaTone} />
                <StatusBadge label={profile.account_status ?? 'active'} tone={accountTone} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          {
            label: 'Wallet balance',
            value: formatCurrency(wallet?.total_balance ?? 0),
            icon: Wallet,
          },
          {
            label: 'Portfolio value',
            value: formatCurrency(portfolio?.current_value ?? 0),
            icon: User,
          },
          {
            label: 'Total invested',
            value: formatCurrency(portfolio?.total_invested ?? 0),
            icon: Shield,
          },
          {
            label: 'Active investments',
            value: investments.filter((item) => item.status.toLowerCase() === 'active').length,
            icon: User,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-3 sm:p-5">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              <stat.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-1 text-lg font-bold text-foreground sm:mt-2 sm:text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Referral program"
        description="Referral access is enabled for all investors. Commissions and payouts are tracked automatically."
      >
        <AdminReferralAccessToggle
          userId={profile.id}
          enabled={profile.referral_access_enabled}
          globalEnabled={globalReferralEnabled}
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Profile & contact">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Full name" value={profile.full_name} />
            <DetailField
              label="Email"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile.email}
                  {profile.email_verified ? (
                    <span className="text-xs text-emerald-600">(verified)</span>
                  ) : (
                    <span className="text-xs text-amber-600">(unverified)</span>
                  )}
                </span>
              }
            />
            <DetailField
              label="Phone"
              value={
                profile.phone_number ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {profile.phone_number}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <DetailField label="Country" value={profile.country} />
            <DetailField label="Date of birth" value={profile.date_of_birth} />
            <DetailField
              label="Address"
              value={
                profile.address ? (
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {profile.address}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <DetailField label="User ID" value={<code className="text-xs">{profile.id}</code>} />
            <DetailField label="Joined" value={formatDate(profile.created_at)} />
            <DetailField label="Last updated" value={formatDateTime(profile.updated_at)} />
            <DetailField label="Last sign-in" value={formatDateTime(profile.last_sign_in_at)} />
          </dl>
        </SectionCard>

        <SectionCard title="Account & compliance">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Investor tier" value={profile.investor_tier} />
            <DetailField label="KYC status" value={profile.kyc_status} />
            <DetailField label="KYC level" value={profile.kyc_level} />
            <DetailField label="Account status" value={profile.account_status} />
            <DetailField label="2FA status" value={mfaLabel} />
            {profile.mfa_disabled_reason ? (
              <DetailField label="2FA bypass reason" value={profile.mfa_disabled_reason} />
            ) : null}
            {profile.kyc_rejection_reason ? (
              <DetailField label="KYC rejection reason" value={profile.kyc_rejection_reason} />
            ) : null}
            {profile.suspended_at ? (
              <DetailField label="Suspended at" value={formatDateTime(profile.suspended_at)} />
            ) : null}
            {profile.suspended_reason ? (
              <DetailField label="Suspension reason" value={profile.suspended_reason} />
            ) : null}
          </dl>
          {profile.admin_notes ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Internal admin notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">{profile.admin_notes}</p>
            </div>
          ) : null}
          <AdminKycReviewControls
            userId={profile.id}
            kycStatus={profile.kyc_status}
            kycRejectionReason={profile.kyc_rejection_reason}
          />
        </SectionCard>
      </div>

      <SectionCard title="KYC documents" description="Submitted identity verification files">
        <AdminKycDocumentsSection submission={kyc_submission} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Wallet">
          {wallet ? (
            <dl className="grid grid-cols-2 gap-4">
              <DetailField label="Available" value={formatCurrency(wallet.available_balance)} />
              <DetailField label="Pending" value={formatCurrency(wallet.pending_balance)} />
              <DetailField label="Bonus" value={formatCurrency(wallet.bonus_balance)} />
              <DetailField label="Total" value={formatCurrency(wallet.total_balance)} />
              <DetailField label="Last updated" value={formatDateTime(wallet.updated_at)} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No wallet record found for this user.</p>
          )}
        </SectionCard>

        <SectionCard title="Portfolio summary">
          {portfolio ? (
            <dl className="grid grid-cols-2 gap-4">
              <DetailField label="Total invested" value={formatCurrency(portfolio.total_invested)} />
              <DetailField label="Current value" value={formatCurrency(portfolio.current_value)} />
              <DetailField
                label="Profit / loss"
                value={formatCurrency(portfolio.profit_loss, { signed: true })}
              />
              <DetailField label="ROI" value={formatPercent(portfolio.roi_percentage, { signed: true })} />
              <DetailField label="Last updated" value={formatDateTime(portfolio.updated_at)} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No portfolio record found for this user.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Crypto wallets & addresses" description="Saved payout methods and networks">
          {payment_methods.length === 0 ? (
            <EmptyState icon={Wallet} title="No saved wallets" description="This user has not saved crypto payout methods." />
          ) : (
            <ul className="space-y-3">
              {payment_methods.map((method) => {
                const Icon = paymentMethodIcon(method.method_type)
                return (
                  <li
                    key={method.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatPaymentMethodLabel(method.method_type)}</span>
                      {method.last_four ? (
                        <span className="text-xs text-muted-foreground">•••• {method.last_four}</span>
                      ) : null}
                    </div>
                    {method.is_primary ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Primary
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Verification" description="Email and identity verification status">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Email verified" value={profile.email_verified ? 'Yes' : 'No'} />
            <DetailField label="KYC status" value={profile.kyc_status ?? 'Pending'} />
            <DetailField label="Account status" value={profile.account_status ?? 'active'} />
            <DetailField label="Referral access" value={profile.referral_access_enabled ? 'Enabled' : 'Disabled'} />
          </dl>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Pending deposits">
          {pending_deposits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending deposits.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pending_deposits.map((tx) => (
                <li key={tx.id} className="flex justify-between rounded-lg border border-border px-3 py-2">
                  <span>{formatCurrency(tx.amount)}</span>
                  <span className="text-muted-foreground">{formatDateTime(tx.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Pending withdrawals">
          {pending_withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending withdrawals.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pending_withdrawals.map((row) => (
                <li key={row.id} className="rounded-lg border border-border px-3 py-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{formatCurrency(row.amount_usd)}</span>
                    <span className="capitalize text-muted-foreground">{row.status}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{row.payout_address ?? '—'}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Withdrawal history" description="Wallet withdrawal requests">
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No withdrawal requests.</p>
        ) : (
          <ScrollTable>
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Coin</th>
                  <th className="pb-3 font-medium">Address</th>
                  <th className="pb-3 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 font-medium">{formatCurrency(row.amount_usd)}</td>
                    <td className="py-3 capitalize">{row.status}</td>
                    <td className="py-3">{row.currency?.toUpperCase() ?? '—'}</td>
                    <td className="max-w-[200px] truncate py-3 font-mono text-xs">{row.payout_address ?? '—'}</td>
                    <td className="py-3 text-muted-foreground">{formatDateTime(row.requested_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        )}
      </SectionCard>

      <SectionCard title="Investments" description="All investment positions for this investor">
        {investments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investments yet.</p>
        ) : (
          <ScrollTable>
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Current value</th>
                  <th className="pb-3 font-medium">ROI</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {investments.map((investment) => (
                  <tr key={investment.id}>
                    <td className="py-3 font-medium">{investment.plan_name}</td>
                    <td className="py-3">{formatCurrency(investment.amount)}</td>
                    <td className="py-3">{formatCurrency(investment.current_value)}</td>
                    <td className="py-3">{formatPercent(investment.roi_percentage, { signed: true })}</td>
                    <td className="py-3">{investment.status}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(investment.start_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        )}
      </SectionCard>

      <SectionCard title="Recent transactions" description="Latest 25 transactions">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <ScrollTable>
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 capitalize">{tx.type}</td>
                    <td className="py-3 font-medium">{formatCurrency(tx.amount, { signed: true })}</td>
                    <td className="py-3">{tx.status}</td>
                    <td className="py-3 text-muted-foreground">{tx.description || '—'}</td>
                    <td className="py-3 text-muted-foreground">{formatDateTime(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Referrals"
          description={`${referrals.total} referral${referrals.total === 1 ? '' : 's'} · ${formatCurrency(referrals.total_bonus)} earned`}
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Total referrals</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{referrals.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <p className="text-xs font-medium text-emerald-700">Bonus earned</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatCurrency(referrals.total_bonus)}
              </p>
            </div>
          </div>

          {referrals.items.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No referrals recorded"
              description="This investor has not referred anyone yet. Referred users and commission earnings will appear here."
              compact
              className="border-gray-200 bg-gray-50/50"
            />
          ) : (
            <div className="space-y-3">
              {referrals.items.map((referral) => {
                const label = referral.referred_name || referral.referred_email
                const initial = label.trim().charAt(0).toUpperCase() || '?'
                return (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 transition-colors hover:border-[#0052ff]/20 hover:bg-white"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052ff]/10 text-sm font-bold text-[#0052ff]">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{label}</p>
                        <p className="truncate text-sm text-gray-500">{referral.referred_email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-emerald-600">
                        {formatCurrency(referral.bonus_earned)}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(referral.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Payment methods & activity">
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0052ff] shadow-sm">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900">Payment methods</h4>
              </div>

              {payment_methods.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No saved payment methods"
                  description="Bank, card, and crypto methods linked to this account will show here."
                  compact
                  className="border-gray-200 bg-white/80 py-8"
                />
              ) : (
                <div className="space-y-2">
                  {payment_methods.map((method) => {
                    const Icon = paymentMethodIcon(method.method_type)
                    return (
                      <div
                        key={method.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatPaymentMethodLabel(method.method_type)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {method.last_four ? `•••• ${method.last_four}` : 'No details on file'}
                            </p>
                          </div>
                        </div>
                        {method.is_primary ? (
                          <span className="shrink-0 rounded-full bg-[#0052ff] px-2.5 py-0.5 text-[10px] font-bold text-white">
                            Primary
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0052ff] shadow-sm">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Recent activity</h4>
                </div>
                {activity.length > 0 ? (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    {activity.length} events
                  </span>
                ) : null}
              </div>

              {activity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No activity logs yet"
                  description="Sign-ins, profile updates, and security events will be listed here."
                  compact
                  className="border-gray-200 bg-white/80 py-8"
                />
              ) : (
                <ul className="max-h-80 space-y-0 overflow-y-auto pr-1">
                  {activity.map((entry, index) => {
                    const Icon = activityIcon(entry.action)
                    return (
                      <li
                        key={entry.id}
                        className={cn(
                          'flex gap-3 py-3',
                          index < activity.length - 1 ? 'border-b border-gray-100' : ''
                        )}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-100">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{entry.action}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {entry.device || 'Unknown device'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatDateTime(entry.created_at)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
