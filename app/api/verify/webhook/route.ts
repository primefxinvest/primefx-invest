import { handleDiditWebhookRequest } from '@/lib/didit/webhook-handler'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleDiditWebhookRequest(request)
}
