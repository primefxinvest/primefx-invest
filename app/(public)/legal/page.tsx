import type { Metadata } from 'next'
import { LegalContent } from '@/components/public/LegalContent'

export const metadata: Metadata = {
  title: 'Legal Center | PrimeFx Invest',
  description: 'Terms of service, privacy policy, risk disclosure, and compliance information.',
}

export default function LegalPage() {
  return <LegalContent />
}
