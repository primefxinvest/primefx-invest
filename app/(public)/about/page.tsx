import type { Metadata } from 'next'
import { AboutContent } from '@/components/public/AboutContent'

export const metadata: Metadata = {
  title: 'About Us | PrimeFx Invest',
  description: 'Learn about PrimeFx Invest mission, vision, and global investment platform.',
}

export default function AboutPage() {
  return <AboutContent />
}
