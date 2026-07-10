import { AdminReferralRankRewardsView } from '@/components/admin/AdminReferralRankRewardsView'
import { AdminReferralSettings } from '@/components/admin/AdminReferralSettings'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminReferralRankRewards } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'
import { getReferralProgramEnabledAdmin } from '@/lib/referral/settings'
import Link from 'next/link'

export default async function AdminRewardsPage() {
  await requireAdminModule('rewards_referral')
  const [referralStatus, { data: rankRewards, error: rankError, configured }] = await Promise.all([
    getReferralProgramEnabledAdmin(),
    withAdminData(getAdminReferralRankRewards, []),
  ])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {rankError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {rankError}
        </div>
      ) : null}
      <AdminReferralSettings
        enabled={referralStatus.enabled}
        configured={referralStatus.configured}
      />
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Withdrawal management has moved to the{' '}
        <Link href="/admin/withdrawals" className="font-semibold underline">
          Withdrawal Center
        </Link>
        .
      </div>
      <div className="mt-6">
        <AdminReferralRankRewardsView rows={rankRewards ?? []} />
      </div>
    </>
  )
}
