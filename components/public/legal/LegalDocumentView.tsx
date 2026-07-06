'use client'

import { Mail } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { m } from 'framer-motion'
import type { LegalDocument } from '@/lib/legal/types'
import { MotionCard } from '@/lib/motion/motion-card'
import { StaggerContainer, StaggerItem } from '@/lib/motion/stagger'
import { MOTION_VARIANTS } from '@/lib/motion/tokens'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'

interface LegalDocumentViewProps {
  document: LegalDocument
  showBackLink?: boolean
  children?: React.ReactNode
}

export function LegalDocumentView({
  document,
  showBackLink = true,
  children,
}: LegalDocumentViewProps) {
  const reduced = useReducedMotion()
  const Wrapper = reduced ? 'div' : m.div

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Wrapper
        {...(!reduced && {
          initial: 'initial',
          animate: 'animate',
          variants: MOTION_VARIANTS.slideUp,
        })}
      >
        {showBackLink ? (
          <Link
            href="/legal"
            className="mb-6 inline-flex text-sm font-medium text-[#0052ff] hover:underline"
          >
            ← Legal Center
          </Link>
        ) : null}

        <header className="mb-10 border-b border-gray-200 pb-8">
          <p className="text-xs font-semibold tracking-widest text-[#0052ff] uppercase">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            {document.title}
          </h1>
          <p className="mt-3 text-base text-gray-600">{document.description}</p>
          <p className="mt-4 text-xs text-gray-500">
            Last updated: {document.lastUpdated} · Contact:{' '}
            <a
              href={`mailto:${document.contactEmail}`}
              className="font-medium text-[#0052ff] hover:underline"
            >
              {document.contactEmail}
            </a>
          </p>
        </header>

        <StaggerContainer className="space-y-8" as="div">
          {document.sections.map((section) => (
            <StaggerItem key={section.id}>
              <MotionCard
                interactive={false}
                className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <section id={section.id}>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {section.body}
                  </div>
                </section>
              </MotionCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {children}

        <footer className="mt-12 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 shrink-0 text-[#0052ff]" aria-hidden />
            <div>
              <p className="font-semibold text-gray-900">Questions about this document?</p>
              <p className="mt-1 text-sm text-gray-600">
                Contact our legal and compliance team at{' '}
                <a
                  href={`mailto:${document.contactEmail}`}
                  className="font-medium text-[#0052ff] hover:underline"
                >
                  {document.contactEmail}
                </a>
              </p>
            </div>
          </div>
        </footer>
      </Wrapper>
    </article>
  )
}

export function LegalSectionAnchor({
  id,
  title,
  body,
  className,
}: {
  id: string
  title: string
  body: string
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8',
        className
      )}
    >
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">{body}</div>
    </section>
  )
}
