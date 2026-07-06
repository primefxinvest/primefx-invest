import type { ReferralListItem } from '@/lib/referral/analytics'

function escapeCsv(value: string | number | null | undefined): string {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function buildReferralNetworkCsv(referrals: ReferralListItem[]): string {
  const headers = [
    'Name',
    'Email',
    'Username',
    'Country',
    'Rank',
    'Generation',
    'Status',
    'Investment Plan',
    'Team Volume',
    'Commission Earned',
    'Date Joined',
  ]

  const rows = referrals.map((member) =>
    [
      member.name,
      member.email,
      member.username ?? '',
      member.country ?? '',
      member.rankName,
      member.networkLevel ?? 1,
      member.status,
      member.investmentPlan ?? '',
      member.teamVolumeUsd,
      member.commissionEarned,
      member.joinedDate,
    ]
      .map(escapeCsv)
      .join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

export function downloadReferralNetworkCsv(referrals: ReferralListItem[], filename = 'primefx-network.csv') {
  const csv = buildReferralNetworkCsv(referrals)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
