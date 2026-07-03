/** Full investment & referral terms — published in Legal Center. */

export const INVESTMENT_TERMS_VERSION = '2026-01'

export const INVESTMENT_TERMS_SECTIONS = [
  {
    id: 'referral-ranks',
    title: 'Referral Rank Rewards',
    body: `PrimeFx Bronze — 50 Members — $150 Bonus
PrimeFx Silver — 100 Members — $300 Bonus
PrimeFx Gold — 300 Members — $800 Bonus
PrimeFx Platinum — 500 Members — $1,500 Bonus
PrimeFx Diamond — 1,000 Members — $2,000 Bonus + 3 Days Vacation Trip (Asia or Europe)
PrimeFx Ambassador — 2,500 Members — Company Car, AcademyFx Office, $1,000 Monthly Salary, 0.5% of all team profits every week`,
  },
  {
    id: 'profit-sharing',
    title: 'Referral Profit Sharing Program',
    body: `Level 1 (L1): 5% of profits every week
Level 2 (L2): 2% of profits every week
Level 3 (L3): 1% of profits every week
Level 4 (L4): 0.5% of profits every week`,
  },
  {
    id: 'management',
    title: '1. Investment Management',
    body: 'PrimeFx Invest provides its members with a team of professional traders specialized in Gold (XAU/USD) trading. The entrusted capital is managed according to a trading strategy and risk management approach established by the PrimeFx trading team.',
  },
  {
    id: 'ownership',
    title: '2. Investor Capital Ownership',
    body: 'The investor remains the owner of their capital at all times. PrimeFx Invest commits to managing the entrusted funds professionally and in accordance with the conditions established by the platform.',
  },
  {
    id: 'capital-withdrawal',
    title: '3. Capital Withdrawal',
    body: 'The investor may request the withdrawal of their capital according to PrimeFx Invest withdrawal conditions. Any withdrawal request must be submitted at least seven (7) days before the desired withdrawal date. This period allows PrimeFx Invest to ensure efficient operational management and orderly processing of withdrawal requests. You may also contact PrimeFx Support for assistance.',
  },
  {
    id: 'trading',
    title: '4. Trading Activities',
    body: 'PrimeFx Invest primarily conducts trading activities in the Gold market (XAU/USD). Trading operations are carried out from Monday to Friday, as financial markets are closed during weekends. Investment performance calculations are based only on the five trading days of each week.',
  },
  {
    id: 'referral-policy',
    title: '5. Referral Program',
    body: 'PrimeFx Invest offers a referral program designed to reward members who recommend the platform. Referral commissions are accrued during the week and distributed according to platform policies — not necessarily immediately — in order to preserve the financial stability of the program, especially when investors may withdraw capital.',
  },
  {
    id: 'modifications',
    title: '6. Modification of Terms',
    body: 'PrimeFx Invest reserves the right to modify these Terms and Conditions whenever necessary to improve services, adapt to market developments, or comply with applicable legal and regulatory requirements. Members will be informed of any significant changes through in-app notifications.',
  },
  {
    id: 'fees',
    title: 'Platform Fees',
    body: 'P2P Transfer Fee: 1.2% per transfer\nWithdrawal Fee: 5% per withdrawal',
  },
] as const

export function buildInvestmentTermsPlainText(): string {
  return INVESTMENT_TERMS_SECTIONS.map((s) => `${s.title}\n\n${s.body}`).join('\n\n---\n\n')
}
