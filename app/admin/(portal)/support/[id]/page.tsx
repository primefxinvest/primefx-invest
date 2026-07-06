import { redirect } from 'next/navigation'

export default async function AdminSupportTicketLegacyRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/support/tickets/${id}`)
}
