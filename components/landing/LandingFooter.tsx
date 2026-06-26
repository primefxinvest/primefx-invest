import Link from 'next/link'
import Logo from '@/components/shared/Logo'

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4">
            <Logo href="/" size={36} />
          </div>
          <p className="max-w-sm text-sm text-gray-500">
            AI-powered investment platform for smarter, safer wealth growth.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">Product</h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li><Link href="#features" className="transition-colors hover:text-gray-900">Features</Link></li>
              <li><Link href="#pricing" className="transition-colors hover:text-gray-900">Pricing</Link></li>
              <li><Link href="/legal#compliance" className="transition-colors hover:text-gray-900">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">Company</h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li><Link href="/about" className="transition-colors hover:text-gray-900">About</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-gray-900">Contact</Link></li>
              <li><Link href="/academy" className="transition-colors hover:text-gray-900">Academy</Link></li>
              <li><Link href="/community" className="transition-colors hover:text-gray-900">Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">Legal</h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li><Link href="/privacy" className="transition-colors hover:text-gray-900">Privacy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-gray-900">Terms</Link></li>
              <li><Link href="/legal" className="transition-colors hover:text-gray-900">Legal Center</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} PrimeFx Invest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
