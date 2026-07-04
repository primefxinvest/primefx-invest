import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { getActiveAiProviderLabel, getChatModel, getPrimeAiConfigError, getPrimeAiUnavailableUserMessage } from '@/lib/ai/provider'
import { getPrimeAIInvestContext } from '@/lib/ai/invest-context'

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

export async function POST(req: Request) {
  try {
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
    const investContext = await getPrimeAIInvestContext()
    const providerLabel = getActiveAiProviderLabel()

    const system = `${BASE_SYSTEM}\n\nAI engine: ${providerLabel}\n\n${investContext}`

    const result = streamText({
      model,
      system,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxOutputTokens: 1024,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('PrimeAI chat error:', error)
    return new Response(
      JSON.stringify({ error: getPrimeAiUnavailableUserMessage(), code: 'PRIMEAI_ERROR' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
