import { notFound } from 'next/navigation'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminUserDetailView } from '@/components/admin/AdminUserDetailView'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminUserDetail } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminModule('user_management')
  const { id } = await params

  const { data, error, configured } = await withAdminData(
    () => getAdminUserDetail(id),
    null
  )

  if (!configured) {
    return (
      <>
        <AdminServiceRoleBanner />
        <p className="text-sm text-muted-foreground">
          Cannot load user details until SUPABASE_SERVICE_ROLE_KEY is set correctly.
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

  return <AdminUserDetailView detail={data} />
}
