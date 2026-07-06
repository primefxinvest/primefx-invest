import type { Metadata } from 'next'
import type { LegalDocument } from '@/lib/legal/types'
import { buildPageMetadata } from '@/lib/seo/metadata'

export function createLegalPageMetadata(
  document: LegalDocument,
  path: string,
  keywords: string[]
): Metadata {
  return buildPageMetadata({
    title: document.title,
    description: document.description,
    path,
    keywords,
  })
}
