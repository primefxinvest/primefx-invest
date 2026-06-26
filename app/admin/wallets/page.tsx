'use client'

import { Search, Eye } from 'lucide-react'

export default function WalletManagement() {
  const wallets = [
    { id: 1, user: 'John Doe', available: '$8,500', pending: '$2,000', bonus: '$500', total: '$11,000' },
    { id: 2, user: 'Jane Smith', available: '$15,200', pending: '$0', bonus: '$1,200', total: '$16,400' },
    { id: 3, user: 'Mike Johnson', available: '$3,600', pending: '$5,000', bonus: '$300', total: '$8,900' },
    { id: 4, user: 'Sarah Williams', available: '$22,800', pending: '$0', bonus: '$800', total: '$23,600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Wallet Management</h2>
        <p className="text-muted-foreground mt-1">Monitor and manage user wallets</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 max-w-md">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search wallets..."
          className="bg-transparent outline-none flex-1 text-foreground placeholder-muted-foreground"
        />
      </div>

      {/* Wallets Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Available</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Pending</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Bonus</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total Balance</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {wallets.map((wallet) => (
              <tr key={wallet.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4 text-foreground font-medium">{wallet.user}</td>
                <td className="px-6 py-4 text-accent font-semibold">{wallet.available}</td>
                <td className="px-6 py-4 text-orange-500 font-semibold">{wallet.pending}</td>
                <td className="px-6 py-4 text-primary font-semibold">{wallet.bonus}</td>
                <td className="px-6 py-4 text-foreground font-bold">{wallet.total}</td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-background rounded-lg transition-colors">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
