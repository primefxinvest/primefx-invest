import { CookiePreferencesPanel } from '@/components/public/legal/CookiePreferencesPanel'
import { LegalDocumentView } from '@/components/public/legal/LegalDocumentView'
import { JsonLd } from '@/components/seo/JsonLd'
import { COOKIE_POLICY } from '@/lib/legal/policies/cookie-policy'
import { createLegalPageMetadata } from '@/lib/legal/create-legal-page'
import { webPageJsonLd } from '@/lib/seo/json-ld'

export function generateMetadata() {
  return createLegalPageMetadata(COOKIE_POLICY, '/cookies', [
    'cookie policy',
    'cookies',
    'tracking',
    'PrimeFx cookies',
  ])
}

export default function CookiesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: COOKIE_POLICY.title,
          description: COOKIE_POLICY.description,
          path: '/cookies',
        })}
      />
      <LegalDocumentView document={COOKIE_POLICY}>
        <div className="mt-8">
          <CookiePreferencesPanel />
        </div>
      </LegalDocumentView>
    </>
  )
}
