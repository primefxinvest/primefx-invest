import type { Metadata } from 'next'
import { ConfirmEmailClient } from '@/components/auth/ConfirmEmailClient'

export const metadata: Metadata = {
  title: 'Confirm your email | PrimeFX Invest',
  description: 'Verify your email address to finish creating your PrimeFX Invest account.',
  robots: { index: false, follow: false },
}

type ConfirmEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const params = (await searchParams) ?? {}
  const rawEmail = params.email
  const rawStatus = params.emailVerification
  const initialEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  const initialStatus = typeof rawStatus === 'string' ? rawStatus : ''

  return <ConfirmEmailClient initialEmail={initialEmail} initialStatus={initialStatus} />
}
