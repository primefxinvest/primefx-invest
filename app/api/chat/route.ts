import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import {
  getActiveAiProviderLabel,
  getChatModel,
  getGeminiChatModelId,
  getPrimeAiConfigError,
  getPrimeAiUnavailableUserMessage,
  logPrimeAiConfig,
} from '@/lib/ai/provider'
import { getPrimeAIInvestContext } from '@/lib/ai/invest-context'
import { getMessageText } from '@/lib/ai/message-utils'
import { requireApiUser } from '@/lib/security/require-api-user'
import { enforceUserRateLimit, RateLimitExceededError, rateLimitResponse } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

const BASE_SYSTEM = `You are PrimeAI, an expert investment advisor for the PrimeFx Invest platform.

You help users with:
1. Investment Analysis: portfolios, asset allocation, plan comparison
2. Market Insights: trends, opportunities, and risk awareness
3. Financial Education: investing basics, strategies, risk management
4. Portfolio Guidance: recommendations aligned with user goals
5. Platform help: explain PrimeFx plans, wallet, deposits, withdrawals, and KYC

Guidelines:
- Be professional, clear, and concise
- When discussing PrimeFx products, use ONLY the investment plans listed below from the live database
- Always remind users to do their own research and consult licensed professionals
- Do not guarantee returns or predict markets with certainty
- Mention diversification, fees, volatility, and suitability for the user's risk tolerance

Remember: Past performance does not guarantee future results.`

function getLastUserMessage(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') {
      return getMessageText(messages[i]!)
    }
  }
  return ''
}

function logGeminiError(error: unknown, context: string) {
  if (error instanceof Error) {
    console.error(`[PrimeAI] ${context}:`, error.message, error.stack)
    return
  }
  console.error(`[PrimeAI] ${context}:`, error)
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser()
    if (auth.response) return auth.response

    try {
      await enforceUserRateLimit('chat', auth.user!.id)
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        return rateLimitResponse(err)
      }
      throw err
    }

    logPrimeAiConfig()

    const model = getChatModel()
    if (!model) {
      console.warn('[PrimeAI]', getPrimeAiConfigError())
      return new Response(
        JSON.stringify({
          error: getPrimeAiUnavailableUserMessage(),
          code: 'PRIMEAI_UNAVAILABLE',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await req.json()
    const messages = (body.messages ?? []) as UIMessage[]
    const lastUserMessage = getLastUserMessage(messages)
    console.log('PrimeAI request:', lastUserMessage)

    const investContext = await getPrimeAIInvestContext()
    const providerLabel = getActiveAiProviderLabel()
    const modelId = getGeminiChatModelId()

    const system = `${BASE_SYSTEM}\n\nAI engine: ${providerLabel} (${modelId})\n\n${investContext}`

    const result = streamText({
      model,
      system,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxOutputTokens: 1024,
      onError({ error }) {
        logGeminiError(error, 'Gemini stream error')
      },
    })

    return result.toUIMessageStreamResponse({
      onError(error) {
        logGeminiError(error, 'Gemini response error')
        return getPrimeAiUnavailableUserMessage()
      },
    })
  } catch (error) {
    logGeminiError(error, 'PrimeAI chat error')
    return new Response(
      JSON.stringify({ error: getPrimeAiUnavailableUserMessage(), code: 'PRIMEAI_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
