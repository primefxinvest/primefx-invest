import { handleDiditWebhookRequest } from '@/lib/didit/webhook-handler'

export const runtime = 'nodejs'

/** @deprecated Prefer /api/verify/webhook — kept for existing Didit destination URLs */
export async function POST(request: Request) {
  return handleDiditWebhookRequest(request)
}
