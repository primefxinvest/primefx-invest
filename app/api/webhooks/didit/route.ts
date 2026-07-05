import { handleDiditWebhookRequest } from '@/lib/didit/webhook-handler'

export const runtime = 'nodejs'

/** @deprecated Alias for /api/verify/webhook — canonical handler is /api/verify/webhook */
export async function POST(request: Request) {
  return handleDiditWebhookRequest(request)
}
