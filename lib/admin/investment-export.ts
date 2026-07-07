import type { AdminInvestmentRow } from '@/lib/admin/investment-types'

export function exportInvestmentsCsv(rows: AdminInvestmentRow[], filename = 'investments.csv') {
  const headers = [
    'Investment ID',
    'Reference',
    'User Name',
    'Email',
    'Plan',
    'Amount',
    'Current Value',
    'Accumulated Profit',
    'Weekly %',
    'Daily Profit',
    'Status',
    'Start Date',
    'ROI %',
  ]

  const lines = rows.map((row) => {
    const roi = row.amount > 0 ? ((row.current_value - row.amount) / row.amount) * 100 : 0
    return [
      row.id,
      row.reference_id ?? '',
      row.user_name ?? '',
      row.user_email,
      row.plan_name,
      row.amount.toFixed(2),
      row.current_value.toFixed(2),
      row.accumulated_profit.toFixed(2),
      row.roi_percentage.toFixed(2),
      row.daily_profit.toFixed(4),
      row.status,
      row.start_date,
      roi.toFixed(2),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  })

  const csv = [headers.join(','), ...lines].join('\n')
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
}

export function exportInvestmentsExcel(rows: AdminInvestmentRow[], filename = 'investments.xls') {
  const headers = [
    'Investment ID',
    'Reference',
    'User Name',
    'Email',
    'Plan',
    'Amount',
    'Current Value',
    'Accumulated Profit',
    'Weekly %',
    'Daily Profit',
    'Status',
    'Start Date',
    'ROI %',
  ]

  const body = rows
    .map((row) => {
      const roi = row.amount > 0 ? ((row.current_value - row.amount) / row.amount) * 100 : 0
      return `<tr>
        <td>${escapeHtml(row.id)}</td>
        <td>${escapeHtml(row.reference_id ?? '')}</td>
        <td>${escapeHtml(row.user_name ?? '')}</td>
        <td>${escapeHtml(row.user_email)}</td>
        <td>${escapeHtml(row.plan_name)}</td>
        <td>${row.amount.toFixed(2)}</td>
        <td>${row.current_value.toFixed(2)}</td>
        <td>${row.accumulated_profit.toFixed(2)}</td>
        <td>${row.roi_percentage.toFixed(2)}</td>
        <td>${row.daily_profit.toFixed(4)}</td>
        <td>${escapeHtml(row.status)}</td>
        <td>${escapeHtml(row.start_date)}</td>
        <td>${roi.toFixed(2)}</td>
      </tr>`
    })
    .join('')

  const html = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`
  downloadBlob(html, filename, 'application/vnd.ms-excel')
}

export function printInvestmentsPdf(rows: AdminInvestmentRow[]) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768')
  if (!win) return

  const tableRows = rows
    .map((row) => {
      const roi = row.amount > 0 ? ((row.current_value - row.amount) / row.amount) * 100 : 0
      return `<tr>
        <td>${escapeHtml(row.reference_id ?? row.id.slice(0, 8))}</td>
        <td>${escapeHtml(row.user_name ?? row.user_email)}</td>
        <td>${escapeHtml(row.plan_name)}</td>
        <td>$${row.amount.toFixed(2)}</td>
        <td>$${row.accumulated_profit.toFixed(2)}</td>
        <td>${row.status}</td>
        <td>${roi.toFixed(1)}%</td>
      </tr>`
    })
    .join('')

  win.document.write(`<!DOCTYPE html><html><head><title>Investments Export</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f8fafc}</style>
    </head><body><h1>Investment Management Export</h1><p>${rows.length} investments</p>
    <table><thead><tr><th>ID</th><th>User</th><th>Plan</th><th>Amount</th><th>Profit</th><th>Status</th><th>ROI</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
