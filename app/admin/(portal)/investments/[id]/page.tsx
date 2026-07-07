import { notFound } from 'next/navigation'
import { AdminInvestmentDetailView } from '@/components/admin/AdminInvestmentDetailView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminDisplayRanks, getAdminInvestmentById } from '@/lib/admin/investment-queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminInvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminModule('investment_management')
  const { id } = await params

  const { data: detail, error, configured } = await withAdminData(
    () => getAdminInvestmentById(id),
    null
  )

  if (!configured) {
    return (
      <>
        <AdminServiceRoleBanner />
        <p className="text-sm text-muted-foreground">Service role required.</p>
      </>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!detail) notFound()

  const ranks = await getAdminDisplayRanks()

  return <AdminInvestmentDetailView detail={detail} ranks={ranks} />
}
