import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Logo from '@/components/shared/Logo'
import { LandingFooterProtectedLinks } from '@/components/landing/LandingFooterProtectedLinks'

export default async function LandingFooter() {
  const t = await getTranslations('landing.footer')
  const tNav = await getTranslations('landing')

  return (
    <footer className="border-t border-gray-200 bg-white py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="mb-4">
            <Logo href="/" sizeKey="marketing" />
          </div>
          <p className="max-w-sm text-sm text-gray-500">{t('tagline')}</p>
          <p className="mt-3 text-sm text-gray-500">
            <a
              href="mailto:support@primefxinvest.com"
              className="font-medium text-[#0052ff] hover:underline"
            >
              support@primefxinvest.com
            </a>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">
              {t('company')}
            </h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li>
                <Link href="/about" className="transition-colors hover:text-gray-900">
                  {t('aboutPrimefx')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-gray-900">
                  {t('careers')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-gray-900">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/how-primefx-works" className="transition-colors hover:text-gray-900">
                  {tNav('howPrimefxWorks')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">
              {t('legal')}
            </h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li>
                <Link href="/terms" className="transition-colors hover:text-gray-900">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-gray-900">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/aml-policy" className="transition-colors hover:text-gray-900">
                  {t('amlPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/kyc-policy" className="transition-colors hover:text-gray-900">
                  {t('kycPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/risk-disclosure" className="transition-colors hover:text-gray-900">
                  {t('riskDisclosure')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="transition-colors hover:text-gray-900">
                  {t('cookiePolicy')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">
              {t('support')}
            </h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li>
                <Link href="/support" className="transition-colors hover:text-gray-900">
                  {t('helpCenter')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="transition-colors hover:text-gray-900">
                  {t('supportCenter')}
                </Link>
              </li>
              <li>
                <Link href="/how-primefx-works#faq" className="transition-colors hover:text-gray-900">
                  {t('faq')}
                </Link>
              </li>
              <LandingFooterProtectedLinks
                academyLabel={tNav('academy')}
                className="transition-colors hover:text-gray-900"
              />
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">
              {t('product')}
            </h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li>
                <a href="/#features" className="transition-colors hover:text-gray-900">
                  {t('features')}
                </a>
              </li>
              <li>
                <a href="/#pricing" className="transition-colors hover:text-gray-900">
                  {t('pricing')}
                </a>
              </li>
              <li>
                <Link href="/legal#compliance" className="transition-colors hover:text-gray-900">
                  {t('security')}
                </Link>
              </li>
              <li>
                <Link href="/legal" className="transition-colors hover:text-gray-900">
                  {t('legalCenter')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} PrimeFx Invest. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
