import type { UIMessage } from 'ai'

export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

export const PRIMEAI_WELCOME_MESSAGE: UIMessage = {
  id: 'welcome',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: "Hello, I'm PrimeAI.\n\nI'm here to help you analyze portfolios, discover opportunities, understand risks, compare investment plans and make better financial decisions.\n\nHow can I help you today?",
    },
  ],
}
