'use client'

import { ArrowUpRight, ArrowDownLeft, Download, Filter, Search } from 'lucide-react'

export default function TransactionsPage() {
  const transactions = [
    {
      id: '1',
      type: 'buy',
      security: 'Apple Inc.',
      ticker: 'AAPL',
      quantity: 10,
      price: 150.25,
      amount: 1502.50,
      date: '2024-06-25',
      status: 'completed',
      time: '14:30 UTC',
    },
    {
      id: '2',
      type: 'sell',
      security: 'Microsoft Corporation',
      ticker: 'MSFT',
      quantity: 5,
      price: 420.50,
      amount: 2102.50,
      date: '2024-06-24',
      status: 'completed',
      time: '10:15 UTC',
    },
    {
      id: '3',
      type: 'deposit',
      security: 'Bank Transfer',
      ticker: 'USD',
      quantity: 1,
      price: 10000,
      amount: 10000,
      date: '2024-06-22',
      status: 'completed',
      time: '09:00 UTC',
    },
    {
      id: '4',
      type: 'buy',
      security: 'Tesla Inc.',
      ticker: 'TSLA',
      quantity: 8,
      price: 245.75,
      amount: 1966.00,
      date: '2024-06-20',
      status: 'completed',
      time: '16:45 UTC',
    },
    {
      id: '5',
      type: 'withdraw',
      security: 'Bank Transfer',
      ticker: 'USD',
      quantity: 1,
      price: 5000,
      amount: 5000,
      date: '2024-06-18',
      status: 'completed',
      time: '11:30 UTC',
    },
    {
      id: '6',
      type: 'buy',
      security: 'Amazon.com Inc.',
      ticker: 'AMZN',
      quantity: 15,
      price: 185.40,
      amount: 2781.00,
      date: '2024-06-15',
      status: 'completed',
      time: '13:20 UTC',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="mt-1 text-muted-foreground">View and manage all your investment transactions.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 hover:bg-secondary transition-colors">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <select className="rounded-lg border border-border bg-background px-4 py-2">
              <option>All Types</option>
              <option>Buy</option>
              <option>Sell</option>
              <option>Deposit</option>
              <option>Withdraw</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Security</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Price</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((transaction) => {
                const isBuy = transaction.type === 'buy' || transaction.type === 'deposit'
                const Icon = isBuy ? ArrowDownLeft : ArrowUpRight
                const iconColor = isBuy ? 'text-emerald-500' : 'text-red-500'

                return (
                  <tr key={transaction.id} className="hover:bg-secondary transition-colors">
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 rounded-lg p-2 ${isBuy ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-red-100 dark:bg-red-950'}`}>
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                        <span className={`text-sm font-semibold capitalize ${isBuy ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{transaction.security}</p>
                        <p className="text-xs text-muted-foreground">{transaction.ticker}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{transaction.quantity}</td>
                    <td className="px-6 py-4 text-sm text-foreground">${transaction.price}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">${transaction.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-foreground">{transaction.date}</p>
                        <p className="text-xs text-muted-foreground">{transaction.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Showing 1-6 of 47 transactions</p>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-border px-3 py-2 hover:bg-secondary transition-colors disabled:opacity-50">
            Previous
          </button>
          <button className="rounded-lg bg-primary px-3 py-2 text-white hover:bg-blue-700 transition-colors">
            1
          </button>
          <button className="rounded-lg border border-border px-3 py-2 hover:bg-secondary transition-colors">
            2
          </button>
          <button className="rounded-lg border border-border px-3 py-2 hover:bg-secondary transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
