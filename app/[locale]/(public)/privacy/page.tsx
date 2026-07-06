import { LegalDocumentView } from '@/components/public/legal/LegalDocumentView'
import { JsonLd } from '@/components/seo/JsonLd'
import { PRIVACY_POLICY } from '@/lib/legal/policies/privacy-policy'
import { createLegalPageMetadata } from '@/lib/legal/create-legal-page'
import { webPageJsonLd } from '@/lib/seo/json-ld'

export function generateMetadata() {
  return createLegalPageMetadata(PRIVACY_POLICY, '/privacy', [
    'privacy policy',
    'data protection',
    'PrimeFx privacy',
    'GDPR',
  ])
}

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: PRIVACY_POLICY.title,
          description: PRIVACY_POLICY.description,
          path: '/privacy',
        })}
      />
      <LegalDocumentView document={PRIVACY_POLICY} />
    </>
  )
}
