'use client'

import { Download, Calendar, FileText, TrendingUp, Filter } from 'lucide-react'

export default function ReportsPage() {
  const reports = [
    {
      id: '1',
      title: 'Monthly Performance Report',
      date: 'June 2024',
      type: 'Performance',
      size: '2.4 MB',
    },
    {
      id: '2',
      title: 'Portfolio Analysis Report',
      date: 'June 2024',
      type: 'Portfolio',
      size: '1.8 MB',
    },
    {
      id: '3',
      title: 'Tax Summary Report',
      date: 'May 2024',
      type: 'Tax',
      size: '1.2 MB',
    },
    {
      id: '4',
      title: 'Investment Overview',
      date: 'April 2024',
      type: 'Overview',
      size: '3.1 MB',
    },
    {
      id: '5',
      title: 'Risk Assessment Report',
      date: 'March 2024',
      type: 'Risk',
      size: '2.0 MB',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-muted-foreground">Download and view your investment reports and statements.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input type="month" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
              <option>All Types</option>
              <option>Performance</option>
              <option>Portfolio</option>
              <option>Tax</option>
              <option>Overview</option>
              <option>Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{report.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{report.date}</span>
                    <span>•</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5">{report.type}</span>
                    <span>•</span>
                    <span>{report.size}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors flex-shrink-0">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Templates */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Generate New Report</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Monthly Statement', desc: 'Full account statement for the month' },
            { title: 'Portfolio Analysis', desc: 'Detailed breakdown of your holdings' },
            { title: 'Tax Report', desc: 'Capital gains and tax information' },
            { title: 'Performance Summary', desc: 'Investment returns and metrics' },
            { title: 'Risk Assessment', desc: 'Portfolio risk analysis' },
            { title: 'Custom Report', desc: 'Create your own custom report' },
          ].map((template, idx) => (
            <button
              key={idx}
              className="rounded-lg border border-border bg-background p-4 text-left hover:bg-secondary transition-colors"
            >
              <p className="font-semibold text-foreground">{template.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{template.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
