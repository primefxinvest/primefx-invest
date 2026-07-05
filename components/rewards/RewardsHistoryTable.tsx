'use client'

import { memo, useMemo } from 'react'
import { EmptyState } from '@/components/shared/data-state'
import type { RewardAchievement } from '@/lib/data/types'
import type { TransactionItem } from '@/lib/data/types'
import { dashboardCardClass } from '@/lib/layout/surfaces'

type HistoryRow = {
  id: string
  date: string
  type: string
  amount: string
  status: string
  source: string
}

function RewardsHistoryTableInner({
  achievements,
  transactions,
}: {
  achievements: RewardAchievement[]
  transactions: TransactionItem[]
}) {
  const rows = useMemo(() => {
    const fromAchievements: HistoryRow[] = achievements
      .filter((a) => a.earned)
      .map((a) => ({
        id: `ach-${a.id}`,
        date: a.earnedDate ?? '—',
        type: 'Achievement',
        amount: `+${a.points} pts`,
        status: 'Completed',
        source: a.name,
      }))

    const fromTx: HistoryRow[] = transactions
      .filter((tx) => tx.type === 'Bonus' || tx.type === 'Profit')
      .map((tx) => ({
        id: `tx-${tx.id}`,
        date: tx.date,
        type: tx.type === 'Bonus' ? 'Rank Bonus' : 'Profit Share',
        amount: tx.amount,
        status: tx.status,
        source: 'Wallet',
      }))

    return [...fromAchievements, ...fromTx].slice(0, 20)
  }, [achievements, transactions])

  return (
    <section aria-label="Reward history" className={dashboardCardClass}>
      <h2 className="text-base font-semibold text-foreground">Reward History</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Track achievements, bonuses, and referral rewards.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="No reward history yet"
          description="Complete achievements or earn referral commissions to see history here."
          compact
          className="mt-4"
        />
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border md:hidden" aria-label="Reward history">
            {rows.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{row.type}</p>
                    <p className="text-xs text-muted-foreground">{row.source}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.date}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-emerald-600">{row.amount}</p>
                    <p className="text-xs text-emerald-600">{row.status}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Reward Type</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4 text-muted-foreground">{row.date}</td>
                  <td className="py-3 pr-4 font-medium text-foreground">{row.type}</td>
                  <td className="py-3 pr-4 font-semibold text-emerald-600">{row.amount}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </section>
  )
}

export const RewardsHistoryTable = memo(RewardsHistoryTableInner)
