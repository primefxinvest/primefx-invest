import type { LegalDocument } from '@/lib/legal/types'

export const COOKIE_POLICY: LegalDocument = {
  title: 'Cookie Policy',
  description: 'How PrimeFx Invest uses cookies and similar technologies.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'essential',
      title: 'Essential Cookies',
      body: `Required for authentication, session management, security tokens, and core platform functionality. These cannot be disabled without preventing you from using the platform.`,
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      body: `Help us understand how visitors use the platform — pages visited, session duration, and error rates. Data is aggregated to improve performance and user experience.`,
    },
    {
      id: 'security',
      title: 'Security Cookies',
      body: `Used to detect fraud, prevent abuse, and protect against automated attacks. These cookies support rate limiting and suspicious activity detection.`,
    },
    {
      id: 'preferences',
      title: 'Preference Cookies',
      body: `Remember your language selection, display preferences, and cookie consent choices for a consistent experience across sessions.`,
    },
    {
      id: 'management',
      title: 'Managing Cookies',
      body: `You can control non-essential cookies through the preference panel on this page or your browser settings. Disabling essential cookies will affect platform functionality.`,
    },
  ],
}
