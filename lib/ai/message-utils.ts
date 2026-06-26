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
      text: "Hello! I'm PrimeAI, your personal investment assistant. I can help you analyze portfolios, discuss investment strategies, answer market questions, and provide personalized financial advice. How can I help you today?",
    },
  ],
}
