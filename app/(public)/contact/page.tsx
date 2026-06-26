import type { Metadata } from 'next'
import { ContactContent } from '@/components/public/ContactContent'

export const metadata: Metadata = {
  title: 'Contact Us | PrimeFx Invest',
  description: 'Contact PrimeFx Invest for support, compliance, and general inquiries.',
}

export default function ContactPage() {
  return <ContactContent />
}
