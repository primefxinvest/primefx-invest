import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminWithdrawalCenter } from '@/components/admin/AdminWithdrawalCenter'
import { requireAdminModule, canApproveWithdrawals } from '@/lib/admin/auth'
import { isSuperAdminEmail } from '@/lib/admin/super-admin'
import { getAdminWithdrawalQueue } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminWithdrawalsPage() {
  const context = await requireAdminModule('financial_management')
  const canApproveWithdrawalsFlag = canApproveWithdrawals(context.email)
  const canUnlockWithdrawals = isSuperAdminEmail(context.email)

  const { data: withdrawals, error: withdrawalError, configured } = await withAdminData(
    getAdminWithdrawalQueue,
    []
  )

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {withdrawalError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {withdrawalError}
        </div>
      ) : null}
      <AdminWithdrawalCenter
        rows={withdrawals ?? []}
        canApproveTransactions={canApproveWithdrawalsFlag}
        canUnlockWithdrawals={canUnlockWithdrawals}
      />
    </>
  )
}
