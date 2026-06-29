export const WALLET_NAV_ITEMS = [
  { href: '/wallet', label: 'Overview' },
  { href: '/wallet/deposit', label: 'Deposit' },
  { href: '/wallet/withdraw', label: 'Withdraw' },
  { href: '/wallet/transfer', label: 'Transfer' },
  { href: '/transactions', label: 'Transaction History' },
] as const

export function isWalletNavActive(pathname: string, href: string) {
  if (href === '/wallet') return pathname === '/wallet'
  if (href === '/transactions') return pathname === '/transactions'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isWalletSectionActive(pathname: string) {
  return (
    pathname === '/wallet' ||
    pathname.startsWith('/wallet/') ||
    pathname === '/transactions'
  )
}
