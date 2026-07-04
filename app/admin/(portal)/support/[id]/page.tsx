import { notFound } from 'next/navigation'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminSupportTicketDetailView } from '@/components/admin/AdminSupportTicketDetailView'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminSupportTicketDetail } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminModule('support_tickets')
  const { id } = await params

  const { data, error, configured } = await withAdminData(
    () => getAdminSupportTicketDetail(id),
    null
  )

  if (!configured) {
    return (
      <>
        <AdminServiceRoleBanner />
        <p className="text-sm text-muted-foreground">
          Cannot load support tickets until SUPABASE_SERVICE_ROLE_KEY is set correctly.
        </p>
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

  if (!data) {
    notFound()
  }

  return <AdminSupportTicketDetailView ticket={data} />
}
