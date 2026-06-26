'use client'

import { CheckCircle2, Clock, XCircle, Search } from 'lucide-react'

export default function TransactionManagement() {
  const transactions = [
    { id: 'TRX001', user: 'John Doe', type: 'Deposit', amount: '$5,000', status: 'Completed', date: '2024-06-25' },
    { id: 'TRX002', user: 'Jane Smith', type: 'Withdrawal', amount: '$2,500', status: 'Pending', date: '2024-06-25' },
    { id: 'TRX003', user: 'Mike Johnson', type: 'Profit', amount: '+$450', status: 'Completed', date: '2024-06-24' },
    { id: 'TRX004', user: 'Sarah Williams', type: 'Transfer', amount: '$1,200', status: 'Failed', date: '2024-06-24' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Transaction Management</h2>
        <p className="text-muted-foreground mt-1">Monitor and manage all transactions</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 max-w-md">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions..."
          className="bg-transparent outline-none flex-1 text-foreground placeholder-muted-foreground"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4 text-foreground font-mono text-sm">{tx.id}</td>
                <td className="px-6 py-4 text-foreground">{tx.user}</td>
                <td className="px-6 py-4 text-muted-foreground">{tx.type}</td>
                <td className="px-6 py-4 text-foreground font-semibold">{tx.amount}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {tx.status === 'Completed' && <CheckCircle2 className="h-5 w-5 text-accent" />}
                    {tx.status === 'Pending' && <Clock className="h-5 w-5 text-orange-500" />}
                    {tx.status === 'Failed' && <XCircle className="h-5 w-5 text-red-500" />}
                    <span className="text-sm">{tx.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
