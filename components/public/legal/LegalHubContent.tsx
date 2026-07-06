'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import {
  AlertCircle,
  Cookie,
  FileText,
  Lock,
  Scale,
  Shield,
  UserCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LEGAL_HUB_DOCUMENTS } from '@/lib/legal/policies'
import {
  COMPLIANCE_STATEMENT,
  DATA_PROCESSING,
  INVESTOR_RESPONSIBILITIES,
  REFUND_POLICY,
} from '@/lib/legal/policies'
import { MotionCard } from '@/lib/motion/motion-card'
import { StaggerContainer, StaggerItem } from '@/lib/motion/stagger'
import { LegalSectionAnchor } from './LegalDocumentView'

const ICON_MAP: Record<string, LucideIcon> = {
  terms: FileText,
  privacy: Shield,
  'risk-disclosure': AlertCircle,
  cookies: Cookie,
  'aml-policy': Scale,
  'kyc-policy': UserCheck,
  'refund-policy': FileText,
  compliance: Lock,
  'data-processing': Shield,
  'investor-responsibilities': UserCheck,
}

export function LegalHubContent() {
  const [hash, setHash] = useState('')

  useEffect(() => {
    setHash(window.location.hash)
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    if (window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth' })
    }
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10">
        <p className="text-xs font-semibold tracking-widest text-[#0052ff] uppercase">
          Compliance
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Legal Center</h1>
        <p className="mt-3 max-w-2xl text-base text-gray-600">
          Official legal documents, compliance policies, and investor disclosures for PrimeFx
          Invest.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Contact:{' '}
          <a
            href="mailto:support@primefxinvest.com"
            className="font-medium text-[#0052ff] hover:underline"
          >
            support@primefxinvest.com
          </a>
        </p>
      </header>

      <StaggerContainer className="mb-14 grid gap-4 sm:grid-cols-2" as="div">
        {LEGAL_HUB_DOCUMENTS.map((doc) => {
          const Icon = ICON_MAP[doc.slug] ?? FileText
          const isAnchor = doc.href.includes('#')
          const anchor = isAnchor ? doc.href.split('#')[1] : null
          const active = anchor ? hash === `#${anchor}` : false

          const card = (
            <MotionCard className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-[#0052ff]/30 sm:p-6">
              <Icon className="mb-3 size-8 text-[#0052ff]" aria-hidden />
              <h2 className="font-semibold text-gray-900">{doc.title}</h2>
              <p className="mt-1.5 text-sm text-gray-500">{doc.description}</p>
            </MotionCard>
          )

          return (
            <StaggerItem key={doc.slug}>
              {isAnchor ? (
                <a
                  href={doc.href}
                  className={active ? 'ring-2 ring-[#0052ff]/30 rounded-2xl' : 'block'}
                >
                  {card}
                </a>
              ) : (
                <Link href={doc.href} className="block">
                  {card}
                </Link>
              )}
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      <div className="space-y-8">
        <LegalSectionAnchor
          id="refund-policy"
          title={REFUND_POLICY.title}
          body={REFUND_POLICY.sections.map((s) => `${s.title}\n${s.body}`).join('\n\n')}
        />
        <LegalSectionAnchor
          id="compliance"
          title={COMPLIANCE_STATEMENT.title}
          body={COMPLIANCE_STATEMENT.sections.map((s) => `${s.title}\n${s.body}`).join('\n\n')}
        />
        <LegalSectionAnchor
          id="data-processing"
          title={DATA_PROCESSING.title}
          body={DATA_PROCESSING.sections.map((s) => `${s.title}\n${s.body}`).join('\n\n')}
        />
        <LegalSectionAnchor
          id="investor-responsibilities"
          title={INVESTOR_RESPONSIBILITIES.title}
          body={INVESTOR_RESPONSIBILITIES.sections
            .map((s) => `${s.title}\n${s.body}`)
            .join('\n\n')}
        />
      </div>
    </div>
  )
}
