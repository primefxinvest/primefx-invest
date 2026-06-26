import { ExternalLink, FileText } from 'lucide-react'
import type { AdminKycSubmissionDetail } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'
import { getIdTypeLabel } from '@/lib/kyc/upload'

function DocumentLink({
  label,
  url,
}: {
  label: string
  url: string | null
}) {
  if (!url) {
    return (
      <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
        {label}: not uploaded
      </div>
    )
  }

  const isPdf = url.includes('.pdf') || url.toLowerCase().includes('application/pdf')

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-secondary/40"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {isPdf ? <FileText className="h-4 w-4 text-muted-foreground" /> : null}
        {label}
      </span>
      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
    </a>
  )
}

export function AdminKycDocumentsSection({
  submission,
}: {
  submission: AdminKycSubmissionDetail | null
}) {
  if (!submission) {
    return (
      <p className="text-sm text-muted-foreground">
        No KYC documents submitted yet. The investor can upload documents from their profile page.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ID type</dt>
          <dd className="mt-1 text-sm font-medium">{getIdTypeLabel(submission.id_type)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ID number</dt>
          <dd className="mt-1 text-sm font-medium">{submission.id_number}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Country</dt>
          <dd className="mt-1 text-sm">{submission.country}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review status</dt>
          <dd className="mt-1 text-sm capitalize">{submission.review_status}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Submitted</dt>
          <dd className="mt-1 text-sm">
            {submission.submitted_at ? formatDateTime(submission.submitted_at) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reviewed</dt>
          <dd className="mt-1 text-sm">
            {submission.reviewed_at ? formatDateTime(submission.reviewed_at) : '—'}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DocumentLink label="ID front" url={submission.document_urls.documentFront} />
        <DocumentLink label="ID back" url={submission.document_urls.documentBack} />
        <DocumentLink label="Selfie" url={submission.document_urls.selfie} />
        <DocumentLink label="Proof of address" url={submission.document_urls.proofOfAddress} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {submission.document_urls.documentFront ? (
          <img
            src={submission.document_urls.documentFront}
            alt="ID front"
            className="max-h-48 w-full rounded-lg border border-border object-contain bg-background"
          />
        ) : null}
        {submission.document_urls.selfie ? (
          <img
            src={submission.document_urls.selfie}
            alt="Selfie"
            className="max-h-48 w-full rounded-lg border border-border object-contain bg-background"
          />
        ) : null}
      </div>
    </div>
  )
}
