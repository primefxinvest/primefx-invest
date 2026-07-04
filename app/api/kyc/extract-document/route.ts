import { generateObject } from 'ai'
import { getAiConfigError, getVisionModel } from '@/lib/ai/provider'
import { AI_DOCUMENT_SCAN_UNAVAILABLE_USER_MESSAGE } from '@/lib/ai/user-errors'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  kycExtractedFieldsSchema,
  type KycDocumentScanKind,
} from '@/lib/kyc/extract-types'

export const runtime = 'nodejs'

const ID_PROMPT = `You extract identity fields from a government ID document image (national ID, passport, or driver's license).

Return only what is clearly visible on the document. Use null for fields you cannot read with reasonable confidence.
- fullName: full legal name as printed on the ID
- dateOfBirth: format as shown on the document, or ISO-like "YYYY-MM-DD" if unambiguous
- address: residential address if printed on this side of the ID (often on back; null if not visible)
- idNumber: document / passport / license number
- country: issuing country or nationality
- idType: one of national_id, passport, drivers_license
- confidence: high if most fields are clear, medium if partial, low if blurry or unclear
- notes: brief note if image quality limits extraction`

const ADDRESS_PROMPT = `You extract address details from a proof-of-address document (utility bill, bank statement, lease, etc.).

Return only what is clearly visible. Use null for fields you cannot read.
- fullName: account holder or recipient name
- dateOfBirth: null unless explicitly shown
- address: full mailing/residential address
- idNumber: null unless an account/reference number is clearly the main identifier
- country: country of the address
- idType: null
- confidence: high / medium / low
- notes: brief note if needed`

export async function POST(req: Request) {
  try {
    const model = getVisionModel()
    if (!model) {
      console.warn('[kyc/extract-document]', getAiConfigError())
      return Response.json(
        { error: AI_DOCUMENT_SCAN_UNAVAILABLE_USER_MESSAGE, code: 'AI_UNAVAILABLE' },
        { status: 503 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      imageDataUrl?: string
      documentKind?: KycDocumentScanKind
    }

    const imageDataUrl = body.imageDataUrl?.trim()
    const documentKind = body.documentKind

    if (!imageDataUrl?.startsWith('data:image/')) {
      return Response.json({ error: 'Invalid document image.' }, { status: 400 })
    }

    if (documentKind !== 'id_front' && documentKind !== 'proof_of_address') {
      return Response.json({ error: 'Invalid document type.' }, { status: 400 })
    }

    const prompt = documentKind === 'id_front' ? ID_PROMPT : ADDRESS_PROMPT

    const { object } = await generateObject({
      model,
      schema: kycExtractedFieldsSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageDataUrl },
          ],
        },
      ],
      temperature: 0.1,
    })

    return Response.json({ data: object })
  } catch (error) {
    console.error('[kyc/extract-document]', error)
    return Response.json({ error: 'Failed to scan document. Try a clearer photo.' }, { status: 500 })
  }
}
