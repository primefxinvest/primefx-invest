'use client'

import { Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CustomSelect } from '@/components/ui/custom-select'

type SupportCreateTicketModalProps = {
  open: boolean
  onClose: () => void
  subject: string
  description: string
  priority: string
  submitting: boolean
  onSubjectChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onSubmit: () => void
}

export function SupportCreateTicketModal({
  open,
  onClose,
  subject,
  description,
  priority,
  submitting,
  onSubjectChange,
  onDescriptionChange,
  onPriorityChange,
  onSubmit,
}: SupportCreateTicketModalProps) {
  const t = useTranslations('support')

  const priorityOptions = [
    { value: 'low', label: t('priorityLow') },
    { value: 'medium', label: t('priorityMedium') },
    { value: 'high', label: t('priorityHigh') },
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t('ticketModalTitle')}</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{t('subject')}</label>
            <input
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              placeholder={t('subjectPlaceholder')}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[#0052ff]/40 focus:ring-2 focus:ring-[#0052ff]/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('fieldDescription')}
            </label>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[#0052ff]/40 focus:ring-2 focus:ring-[#0052ff]/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{t('priority')}</label>
            <CustomSelect
              value={priority}
              onValueChange={onPriorityChange}
              options={priorityOptions}
              placeholder={t('priorityMedium')}
            />
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !subject.trim() || !description.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
