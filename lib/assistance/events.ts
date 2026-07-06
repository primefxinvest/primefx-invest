export const ASSISTANCE_OPEN_EVENT = 'primefx:open-assistance'

export function openPrimeFxAssistance(options?: { tab?: 'home' | 'messages' | 'help'; helpSearch?: string }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ASSISTANCE_OPEN_EVENT, { detail: options }))
  }
}
