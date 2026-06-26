'use client'

import { Copy, Users, Mail, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton, PageHeaderSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchReferralData, fetchReferralList } from '@/lib/data/queries'
import { formatCurrency } from '@/lib/data/format'
import { InvestorPageGate } from '@/components/investor/InvestorPageGate'

export default function ReferralPage() {
  const {
    data: referralData,
    loading: dataLoading,
    error: dataError,
    reload: reloadData,
  } = useAsyncData(() => fetchReferralData(), [])
  const {
    data: referrals = [],
    loading: listLoading,
    error: listError,
    reload: reloadList,
  } = useAsyncData(() => fetchReferralList(), [])

  const loading = dataLoading || listLoading
  const error = dataError ?? listError
  const totalEarned = referrals.reduce((sum, r) => sum + r.commissionEarned, 0)
  const activeCount = referrals.filter((r) => r.status === 'Active').length

  const handleRetry = () => {
    reloadData()
    reloadList()
  }

  const copyToClipboard = async () => {
    if (!referralData?.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  if (loading && !referralData) {
    return (
      <InvestorPageGate feature="referral_program" route="/referral">
        <div className="space-y-8">
          <PageHeaderSkeleton />
          <MetricCardsSkeleton count={4} />
          <TableSkeleton rows={4} cols={4} />
        </div>
      </InvestorPageGate>
    )
  }

  return (
    <InvestorPageGate feature="referral_program" route="/referral">
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Referral Program</h1>
        <p className="mt-1 text-muted-foreground">
          Earn commissions by referring other investors to PrimeFx.
        </p>
      </div>

      <AsyncState loading={loading} error={error} onRetry={handleRetry} skeleton={null}>
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {referralData?.totalReferrals ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Active Referrals</p>
              <p className="mt-2 text-3xl font-bold text-primary">{activeCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {referralData?.totalEarnings ?? formatCurrency(0)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="mt-2 text-3xl font-bold text-foreground">15%</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Your Referral Link</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={referralData?.referralLink ?? ''}
                readOnly
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Share this link with your network to start earning commissions.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Share Your Link</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { name: 'Email', icon: Mail },
                { name: 'LinkedIn', icon: Share2 },
                { name: 'Twitter', icon: Share2 },
                { name: 'Facebook', icon: Share2 },
              ].map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 transition-colors hover:bg-secondary"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold text-foreground">{option.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Active Referrals</h2>
            </div>
            {referrals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                <p className="text-sm font-medium text-foreground">No referrals yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share your link to start earning commissions when friends invest.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Joined</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {referrals.map((referral) => (
                      <tr key={referral.id}>
                        <td className="py-3 pr-4 font-medium text-foreground">{referral.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{referral.joinedDate}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              referral.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {referral.status}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-emerald-600">
                          {formatCurrency(referral.commissionEarned)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalEarned > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                List total: {formatCurrency(totalEarned)} from {referrals.length} referral
                {referrals.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </>
      </AsyncState>
    </div>
    </InvestorPageGate>
  )
}
