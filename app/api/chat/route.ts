import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'

export const runtime = 'nodejs'

const system = `You are PrimeAI, an expert investment advisor and financial assistant. You help users with:

1. Investment Analysis: Analyze portfolios, discuss asset allocation, evaluate securities
2. Market Insights: Provide market trends, economic indicators, and investment opportunities
3. Financial Education: Teach investing basics, strategies, and risk management
4. Portfolio Guidance: Offer personalized recommendations based on investment goals
5. General Finance: Answer questions about taxes, dividends, fees, and financial concepts

Guidelines:
- Be professional and knowledgeable about finance and investing
- Always remind users to do their own research and consult with professionals
- Provide data-driven insights when possible
- Ask clarifying questions to better understand user needs
- Maintain a balanced perspective on risk and returns
- Be honest about limitations and uncertainties
- Do not provide guaranteed returns or predictions

When discussing investments:
- Consider the user's risk tolerance and timeline
- Mention diversification importance
- Discuss fees and their impact on returns
- Acknowledge market volatility and risks
- Suggest reviewing strategies regularly

Remember: Past performance does not guarantee future results.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = (body.messages ?? []) as UIMessage[]

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'PrimeAI is not configured. Add OPENAI_API_KEY to your environment.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxOutputTokens: 1024,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('PrimeAI chat error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process chat request.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
