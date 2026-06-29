import { NotFoundView } from '@/components/shared/NotFoundView'

export default function AuthNotFound() {
  return (
    <NotFoundView
      compact
      homeHref="/login"
      homeLabel="Back to sign in"
      description="This page doesn't exist. Return to sign in or create an account."
    />
  )
}
