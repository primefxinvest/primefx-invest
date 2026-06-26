'use client'

import { fileToScanImageDataUrl } from '@/lib/kyc/document-media'
import type { KycDocumentScanKind, KycExtractedFields } from '@/lib/kyc/extract-types'

export async function scanKycDocument(
  file: File,
  documentKind: KycDocumentScanKind
): Promise<{ success: true; data: KycExtractedFields } | { success: false; error: string }> {
  try {
    const imageDataUrl = await fileToScanImageDataUrl(file)

    const response = await fetch('/api/kyc/extract-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl, documentKind }),
    })

    const payload = (await response.json()) as {
      data?: KycExtractedFields
      error?: string
    }

    if (!response.ok) {
      return { success: false, error: payload.error ?? 'Document scan failed.' }
    }

    if (!payload.data) {
      return { success: false, error: 'No details could be read from this document.' }
    }

    return { success: true, data: payload.data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Document scan failed.',
    }
  }
}
