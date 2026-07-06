import { LegalDocumentView } from '@/components/public/legal/LegalDocumentView'
import { JsonLd } from '@/components/seo/JsonLd'
import { KYC_POLICY } from '@/lib/legal/policies/kyc-policy'
import { createLegalPageMetadata } from '@/lib/legal/create-legal-page'
import { webPageJsonLd } from '@/lib/seo/json-ld'

export function generateMetadata() {
  return createLegalPageMetadata(KYC_POLICY, '/kyc-policy', [
    'KYC policy',
    'identity verification',
    'Didit',
    'PrimeFx KYC',
  ])
}

export default function KycPolicyPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: KYC_POLICY.title,
          description: KYC_POLICY.description,
          path: '/kyc-policy',
        })}
      />
      <LegalDocumentView document={KYC_POLICY} />
    </>
  )
}
