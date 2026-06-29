import { NotFoundView } from '@/components/shared/NotFoundView'

export default function PublicNotFound() {
  return (
    <NotFoundView
      homeHref="/"
      homeLabel="Back to home"
      description="This page doesn't exist. Check the URL or return to the homepage."
    />
  )
}
