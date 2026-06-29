import { NotFoundView } from '@/components/shared/NotFoundView'

export default function AdminNotFound() {
  return (
    <NotFoundView
      homeHref="/admin"
      homeLabel="Back to admin"
      description="This admin page doesn't exist. Check the URL or return to the admin dashboard."
    />
  )
}
