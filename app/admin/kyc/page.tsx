'use client'

import { CheckCircle2, XCircle, Clock, Search } from 'lucide-react'

export default function KYCManagement() {
  const kycRequests = [
    { id: 1, user: 'John Doe', email: 'john@example.com', status: 'Pending', date: '2024-06-25', documents: 'ID, Proof of Address' },
    { id: 2, user: 'Jane Smith', email: 'jane@example.com', status: 'Approved', date: '2024-06-24', documents: 'Passport, Bank Statement' },
    { id: 3, user: 'Mike Johnson', email: 'mike@example.com', status: 'Rejected', date: '2024-06-23', documents: 'Incomplete Documents' },
    { id: 4, user: 'Sarah Williams', email: 'sarah@example.com', status: 'Pending Review', date: '2024-06-22', documents: 'ID, Income Verification' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">KYC Verification</h2>
        <p className="text-muted-foreground mt-1">Manage Know Your Customer verification</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 max-w-md">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search KYC requests..."
          className="bg-transparent outline-none flex-1 text-foreground placeholder-muted-foreground"
        />
      </div>

      {/* KYC Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Documents</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {kycRequests.map((request) => (
              <tr key={request.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4 text-foreground font-medium">{request.user}</td>
                <td className="px-6 py-4 text-muted-foreground">{request.email}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {request.status === 'Approved' && <CheckCircle2 className="h-5 w-5 text-accent" />}
                    {request.status === 'Rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                    {(request.status === 'Pending' || request.status === 'Pending Review') && <Clock className="h-5 w-5 text-orange-500" />}
                    <span className="text-sm">{request.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-sm">{request.documents}</td>
                <td className="px-6 py-4 text-muted-foreground">{request.date}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {(request.status === 'Pending' || request.status === 'Pending Review') && (
                      <>
                        <button className="px-3 py-1 bg-accent text-white rounded text-sm hover:opacity-90">Approve</button>
                        <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:opacity-90">Reject</button>
                      </>
                    )}
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
