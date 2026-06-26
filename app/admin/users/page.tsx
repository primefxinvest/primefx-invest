'use client'

import { Search, Filter, MoreVertical, Shield, Ban, Eye } from 'lucide-react'

export default function UserManagement() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', tier: 'Elite Investor', status: 'Active', joinDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', tier: 'Prime Investor', status: 'Active', joinDate: '2024-02-20' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', tier: 'Growth Investor', status: 'Pending KYC', joinDate: '2024-06-10' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', tier: 'Starter', status: 'Suspended', joinDate: '2024-03-05' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">User Management</h2>
        <p className="text-muted-foreground mt-1">Manage user accounts and access</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            className="bg-transparent outline-none flex-1 text-foreground placeholder-muted-foreground"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:bg-background transition-colors">
          <Filter className="h-5 w-5" />
          Filter
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Join Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4 text-foreground">{user.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{user.tier}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user.status === 'Active' ? 'bg-accent/10 text-accent' :
                    user.status === 'Pending KYC' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{user.joinDate}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-background rounded-lg transition-colors">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-background rounded-lg transition-colors">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-background rounded-lg transition-colors">
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
