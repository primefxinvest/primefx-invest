import { LegalDocumentView } from '@/components/public/legal/LegalDocumentView'
import { JsonLd } from '@/components/seo/JsonLd'
import { TERMS_OF_SERVICE } from '@/lib/legal/policies/terms-of-service'
import { createLegalPageMetadata } from '@/lib/legal/create-legal-page'
import { webPageJsonLd } from '@/lib/seo/json-ld'

export function generateMetadata() {
  return createLegalPageMetadata(TERMS_OF_SERVICE, '/terms', [
    'terms of service',
    'PrimeFx terms',
    'investment terms',
    'platform agreement',
  ])
}

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: TERMS_OF_SERVICE.title,
          description: TERMS_OF_SERVICE.description,
          path: '/terms',
        })}
      />
      <LegalDocumentView document={TERMS_OF_SERVICE} />
    </>
  )
}
