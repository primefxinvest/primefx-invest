import { AdminReferralRankRewardsView } from '@/components/admin/AdminReferralRankRewardsView'
import { AdminReferralSettings } from '@/components/admin/AdminReferralSettings'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminWithdrawalsView } from '@/components/admin/AdminWithdrawalsView'
import { requireAdminModule, canApproveOrRejectTransactions } from '@/lib/admin/auth'
import { isSuperAdminEmail } from '@/lib/admin/super-admin'
import { getAdminReferralRankRewards, getAdminWithdrawalQueue } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'
import { getReferralProgramEnabledAdmin } from '@/lib/referral/settings'

export default async function AdminRewardsPage() {
  const context = await requireAdminModule('rewards_referral')
  const canApproveTransactions = canApproveOrRejectTransactions(context.email)
  const canUnlockWithdrawals = isSuperAdminEmail(context.email)
  const [
    referralStatus,
    { data: rankRewards, error: rankError, configured },
    { data: withdrawals, error: withdrawalError },
  ] = await Promise.all([
    getReferralProgramEnabledAdmin(),
    withAdminData(getAdminReferralRankRewards, []),
    withAdminData(getAdminWithdrawalQueue, []),
  ])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {rankError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {rankError}
        </div>
      ) : null}
      {withdrawalError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {withdrawalError}
        </div>
      ) : null}
      <AdminReferralSettings
        enabled={referralStatus.enabled}
        configured={referralStatus.configured}
      />
      <div className="mt-6 space-y-6">
        <AdminReferralRankRewardsView rows={rankRewards ?? []} />
        <AdminWithdrawalsView
          rows={withdrawals ?? []}
          canApproveTransactions={canApproveTransactions}
          canUnlockWithdrawals={canUnlockWithdrawals}
        />
      </div>
    </>
  )
}
