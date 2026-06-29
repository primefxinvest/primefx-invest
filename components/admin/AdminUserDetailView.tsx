'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Wallet,
} from 'lucide-react'
import { AdminKycDocumentsSection } from '@/components/admin/AdminKycDocumentsSection'
import { AdminKycReviewControls } from '@/components/admin/AdminKycReviewControls'
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
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

export function AdminUserDetailView({ detail }: { detail: AdminUserDetail }) {
  const { profile, mfa, wallet, portfolio, investments, transactions, referrals, activity, payment_methods, kyc_submission } =
    detail

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/users"
            className="mt-1 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <img
            src={avatarSrc}
            alt=""
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {profile.full_name || 'Unnamed investor'}
            </h2>
            <p className="mt-1 text-muted-foreground">{profile.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge label={profile.investor_tier ?? 'Starter'} tone="neutral" />
              <StatusBadge label={profile.kyc_status ?? 'Pending'} tone={profile.kyc_status === 'Verified' ? 'success' : profile.kyc_status === 'Rejected' ? 'danger' : 'warning'} />
              <StatusBadge label={mfaLabel} tone={mfaTone} />
              <StatusBadge label={profile.account_status ?? 'active'} tone={accountTone} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

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

      <SectionCard title="Investments" description="All investment positions for this investor">
        {investments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investments yet.</p>
        ) : (
          <div className="overflow-x-auto">
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
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent transactions" description="Latest 25 transactions">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
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
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Referrals"
          description={`${referrals.total} referral${referrals.total === 1 ? '' : 's'} · ${formatCurrency(referrals.total_bonus)} earned`}
        >
          {referrals.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals recorded.</p>
          ) : (
            <div className="space-y-3">
              {referrals.items.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{referral.referred_name || referral.referred_email}</p>
                    <p className="text-sm text-muted-foreground">{referral.referred_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(referral.bonus_earned)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(referral.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Payment methods & activity">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Payment methods</h4>
              {payment_methods.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No saved payment methods.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {payment_methods.map((method) => (
                    <li
                      key={method.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="capitalize">{method.method_type}</span>
                      <span className="text-muted-foreground">
                        {method.last_four ? `•••• ${method.last_four}` : '—'}
                        {method.is_primary ? ' · Primary' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">Recent activity</h4>
              {activity.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No activity logs yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {activity.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-muted-foreground">
                        {entry.device || 'Unknown device'} · {formatDateTime(entry.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
