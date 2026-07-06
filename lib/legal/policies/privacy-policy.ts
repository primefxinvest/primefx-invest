import type { LegalDocument } from '@/lib/legal/types'

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  description: 'How PrimeFx Invest collects, uses, protects, and retains your personal data.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'collection',
      title: 'Data Collection',
      body: `We collect information you provide during registration (name, email, phone), KYC verification (identity documents, selfies), wallet activity (deposits, withdrawals, transfers), investment history, referral data, support communications, and technical data (IP address, device type, browser, session logs).`,
    },
    {
      id: 'usage',
      title: 'Data Usage',
      body: `Your data is used to operate the platform, process transactions, verify identity, prevent fraud, provide customer support, improve services, comply with legal obligations, and send important account notifications. We do not sell your personal data to third parties.`,
    },
    {
      id: 'cookies',
      title: 'Cookies',
      body: `We use essential cookies for authentication and security, analytics cookies to understand platform usage, and preference cookies to remember your language and settings. See our Cookie Policy for details and controls.`,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      body: `We use privacy-conscious analytics to measure platform performance and user experience. Analytics data is aggregated where possible and does not include sensitive financial credentials.`,
    },
    {
      id: 'kyc-providers',
      title: 'KYC Providers',
      body: `Identity verification is processed through certified third-party providers including Didit. Verification data is transmitted securely and retained according to compliance requirements. Provider privacy policies apply to their processing activities.`,
    },
    {
      id: 'security',
      title: 'Security Measures',
      body: `We employ encryption in transit and at rest, access controls, session management, multi-factor authentication, fraud monitoring, and regular security assessments to protect your data.`,
    },
    {
      id: 'retention',
      title: 'Data Retention',
      body: `We retain personal data for as long as your account is active and as required by law (typically 5–7 years for financial records after account closure). KYC documents are retained per regulatory requirements.`,
    },
    {
      id: 'rights',
      title: 'User Rights',
      body: `Depending on your jurisdiction, you may have rights to access, correct, port, restrict, or object to processing of your personal data. Contact us to exercise these rights.`,
    },
    {
      id: 'deletion',
      title: 'Data Deletion Requests',
      body: `You may request account deletion by contacting support@primefxinvest.com. We will delete or anonymize data where legally permitted, but may retain certain records required for compliance, dispute resolution, and fraud prevention.`,
    },
    {
      id: 'international',
      title: 'International Transfers',
      body: `Your data may be processed in countries other than your residence. We ensure appropriate safeguards including standard contractual clauses and security measures for cross-border transfers.`,
    },
  ],
}
