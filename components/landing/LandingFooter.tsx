import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Logo from '@/components/shared/Logo'

export default async function LandingFooter() {
  const t = await getTranslations('landing.footer')
  const tNav = await getTranslations('landing')

  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4">
            <Logo href="/" size={36} />
          </div>
          <p className="max-w-sm text-sm text-gray-500">{t('tagline')}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">
              {t('product')}
            </h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li>
                <Link href="#features" className="transition-colors hover:text-gray-900">
                  {t('features')}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="transition-colors hover:text-gray-900">
                  {t('pricing')}
                </Link>
              </li>
              <li>
                <Link href="/legal#compliance" className="transition-colors hover:text-gray-900">
                  {t('security')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold text-gray-900 sm:mb-4 sm:text-sm">
              {t('company')}
            </h4>
            <ul className="space-y-2 text-xs text-gray-500 sm:text-sm">
              <li>
                <Link href="/about" className="transition-colors hover:text-gray-900">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-gray-900">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/academy" className="transition-colors hover:text-gray-900">
                  {tNav('academy')}
                </Link>
              </li>
              <li>
                <Link href="/community" className="transition-colors hover:text-gray-900">
                  {tNav('community')}
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
                <Link href="/privacy" className="transition-colors hover:text-gray-900">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-gray-900">
                  {t('terms')}
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
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} PrimeFx Invest. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
