import Link from 'next/link'
import Logo from '@/components/shared/Logo'

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4">
              <Logo href="/" size={36} />
            </div>
            <p className="text-sm text-gray-500">
              AI-powered investment platform for smarter, safer wealth growth.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
              <li><Link href="/legal#compliance" className="hover:text-gray-900 transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-gray-900 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link></li>
              <li><Link href="/academy" className="hover:text-gray-900 transition-colors">Academy</Link></li>
              <li><Link href="/community" className="hover:text-gray-900 transition-colors">Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link></li>
              <li><Link href="/legal" className="hover:text-gray-900 transition-colors">Legal Center</Link></li>
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
