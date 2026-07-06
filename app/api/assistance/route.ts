import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import {
  getActiveAiProviderLabel,
  getChatModel,
  getGeminiChatModelId,
  getPrimeAiConfigError,
  getPrimeAiUnavailableUserMessage,
  logPrimeAiConfig,
} from '@/lib/ai/provider'
import { buildLocaleSystemInstruction, resolveChatLocale } from '@/lib/ai/locale-chat'
import { getMessageText } from '@/lib/ai/message-utils'
import { getAssistanceAccountContext } from '@/lib/assistance/context'
import { ESCALATION_MARKER, ESCALATION_MARKER_END } from '@/lib/assistance/constants'
import { requireApiUser } from '@/lib/security/require-api-user'
import { enforceUserRateLimit, RateLimitExceededError, rateLimitResponse } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

const ASSISTANCE_SYSTEM = `You are PrimeFx Assistance, the official AI support assistant for PrimeFx Invest.

Branding:
- Name: PrimeFx Assistance
- Subtitle: AI Powered Support • Always Online
- You are helpful, professional, warm, and concise — like Revolut or Coinbase support.

You help users with:
- Deposits, Withdrawals, Investments, Verification (KYC), Transfers
- Referral Program, Portfolio, Rewards, Security, Technical Issues
- Account Management, General Questions

Guidelines:
1. Use the user's LIVE ACCOUNT CONTEXT below when answering account-specific questions.
2. When the user asks about pending withdrawals, deposits, KYC, or balances — reference their actual data.
3. Provide clear step-by-step solutions when possible.
4. Never modify accounts, process payments, or approve KYC — you can only guide and explain.
5. Do NOT invent transaction IDs, amounts, or statuses not in the context.
6. For investment advice, remind users that PrimeAI handles detailed portfolio analysis.
7. Be empathetic with payment delays and security concerns.

Escalation rules — append EXACTLY this marker at the END of your message when escalation is needed:
${ESCALATION_MARKER}reason here${ESCALATION_MARKER_END}

Escalate when:
- User explicitly requests human support
- You cannot resolve the issue with available information
- Payment issue requires manual review
- Compliance or KYC review is required beyond your scope
- A technical bug is confirmed that needs engineering
- Your confidence in the answer is low

Do NOT escalate for simple FAQ questions you can answer confidently.

When escalating, still provide a helpful partial answer before the marker.`

function getLastUserMessage(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') {
      return getMessageText(messages[i]!)
    }
  }
  return ''
}

function logAssistanceError(error: unknown, context: string) {
  if (error instanceof Error) {
    console.error(`[PrimeFx Assistance] ${context}:`, error.message)
    return
  }
  console.error(`[PrimeFx Assistance] ${context}:`, error)
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser()
    if (auth.response) return auth.response

    try {
      await enforceUserRateLimit('assistance', auth.user!.id)
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        return rateLimitResponse(err)
      }
      throw err
    }

    logPrimeAiConfig()

    const model = getChatModel()
    if (!model) {
      return new Response(
        JSON.stringify({
          error: getPrimeAiUnavailableUserMessage(),
          code: 'ASSISTANCE_UNAVAILABLE',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const messages = (body.messages ?? []) as UIMessage[]
    const locale = resolveChatLocale(body.locale)
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null
    const lastUserMessage = getLastUserMessage(messages)

    const [accountContext, investContext] = await Promise.all([
      getAssistanceAccountContext(auth.user!.id),
      import('@/lib/ai/invest-context').then((m) => m.getPrimeAIInvestContext()),
    ])

    const providerLabel = getActiveAiProviderLabel()
    const modelId = getGeminiChatModelId()

    const system = [
      ASSISTANCE_SYSTEM,
      buildLocaleSystemInstruction(locale),
      `AI engine: ${providerLabel} (${modelId})`,
      sessionId ? `Session ID: ${sessionId}` : '',
      '\n--- LIVE ACCOUNT CONTEXT (use for personalized answers) ---\n',
      accountContext,
      '\n--- INVESTMENT PLANS REFERENCE ---\n',
      investContext,
    ]
      .filter(Boolean)
      .join('\n')

    console.log('[PrimeFx Assistance] request:', lastUserMessage.slice(0, 80), 'locale:', locale)

    const result = streamText({
      model,
      system,
      messages: await convertToModelMessages(messages),
      temperature: 0.5,
      maxOutputTokens: 1024,
      onError({ error }) {
        logAssistanceError(error, 'stream error')
      },
    })

    return result.toUIMessageStreamResponse({
      onError(error) {
        logAssistanceError(error, 'response error')
        return getPrimeAiUnavailableUserMessage()
      },
    })
  } catch (error) {
    logAssistanceError(error, 'chat error')
    return new Response(
      JSON.stringify({ error: getPrimeAiUnavailableUserMessage(), code: 'ASSISTANCE_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
