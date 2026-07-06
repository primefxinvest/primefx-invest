import { LegalDocumentView } from '@/components/public/legal/LegalDocumentView'
import { JsonLd } from '@/components/seo/JsonLd'
import { AML_POLICY } from '@/lib/legal/policies/aml-policy'
import { createLegalPageMetadata } from '@/lib/legal/create-legal-page'
import { webPageJsonLd } from '@/lib/seo/json-ld'

export function generateMetadata() {
  return createLegalPageMetadata(AML_POLICY, '/aml-policy', [
    'AML policy',
    'anti-money laundering',
    'compliance',
    'PrimeFx AML',
  ])
}

export default function AmlPolicyPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: AML_POLICY.title,
          description: AML_POLICY.description,
          path: '/aml-policy',
        })}
      />
      <LegalDocumentView document={AML_POLICY} />
    </>
  )
}
