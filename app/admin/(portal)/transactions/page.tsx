import { AdminTransactionsView } from '@/components/admin/AdminTransactionsView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import {
  requireAdminModule,
  canApproveDeposits,
  canApproveWithdrawals,
} from '@/lib/admin/auth'
import { getAdminTransactions } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminTransactionsPage() {
  const context = await requireAdminModule('financial_management')
  const canApproveDepositsFlag = canApproveDeposits(context.email)
  const canApproveWithdrawalsFlag = canApproveWithdrawals(context.email)
  const { data, error, configured } = await withAdminData(getAdminTransactions, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminTransactionsView
        transactions={data}
        canApproveDeposits={canApproveDepositsFlag}
        canApproveWithdrawals={canApproveWithdrawalsFlag}
      />
    </>
  )
}
