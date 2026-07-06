import { LegalDocumentView } from '@/components/public/legal/LegalDocumentView'
import { JsonLd } from '@/components/seo/JsonLd'
import { RISK_DISCLOSURE } from '@/lib/legal/policies/risk-disclosure'
import { createLegalPageMetadata } from '@/lib/legal/create-legal-page'
import { webPageJsonLd } from '@/lib/seo/json-ld'

export function generateMetadata() {
  return createLegalPageMetadata(RISK_DISCLOSURE, '/risk-disclosure', [
    'risk disclosure',
    'investment risk',
    'market risk',
    'PrimeFx risks',
  ])
}

export default function RiskDisclosurePage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: RISK_DISCLOSURE.title,
          description: RISK_DISCLOSURE.description,
          path: '/risk-disclosure',
        })}
      />
      <LegalDocumentView document={RISK_DISCLOSURE} />
    </>
  )
}
