'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { KycFileField } from '@/components/kyc/KycFileField'
import { KycExtractedDetailsCard } from '@/components/kyc/KycExtractedDetailsCard'
import { CustomSelect } from '@/components/ui/custom-select'
import { submitKycForReview } from '@/lib/kyc/actions'
import { fetchMyKycSubmission } from '@/lib/kyc/client-query'
import { scanKycDocument } from '@/lib/kyc/extract-client'
import type { KycExtractedFields } from '@/lib/kyc/extract-types'
import { uploadKycDocument } from '@/lib/kyc/client-upload'
import { KYC_ID_TYPES, type KycSubmission } from '@/lib/kyc/types'
import { getIdTypeLabel, requiresDocumentBack } from '@/lib/kyc/upload'
import { updateUserProfile } from '@/lib/profile/actions'
import type { UserProfile } from '@/lib/profile/types'
import { getCurrentUser } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function profileComplete(profile: UserProfile) {
  return Boolean(
    profile.fullName.trim() &&
      profile.phone.trim() &&
      profile.dateOfBirth.trim() &&
      profile.address.trim()
  )
}

export function KycSubmissionPanel({ profile }: { profile: UserProfile }) {
  const [submission, setSubmission] = useState<KycSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()

  const [idType, setIdType] = useState<(typeof KYC_ID_TYPES)[number]['value']>('national_id')
  const [idNumber, setIdNumber] = useState('')
  const [country, setCountry] = useState('')
  const [documentFront, setDocumentFront] = useState<File | null>(null)
  const [documentBack, setDocumentBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [proofOfAddress, setProofOfAddress] = useState<File | null>(null)
  const [scanningKind, setScanningKind] = useState<'id_front' | 'proof_of_address' | null>(null)
  const [idExtract, setIdExtract] = useState<KycExtractedFields | null>(null)
  const [addressExtract, setAddressExtract] = useState<KycExtractedFields | null>(null)
  const [applyingExtract, setApplyingExtract] = useState(false)

  const loadSubmission = useCallback(async () => {
    setLoading(true)
    try {
      const { data: authUser } = await getCurrentUser()
      if (!authUser) {
        setSubmission(null)
        return
      }

      const data = await fetchMyKycSubmission(authUser.id)
      setSubmission(data)
      if (data) {
        setIdType(data.idType)
        setIdNumber(data.idNumber)
        setCountry(data.country)
      } else if (profile.kycStatus !== 'Verified') {
        setCountry((current) => current || '')
      }
    } catch {
      setSubmission(null)
    } finally {
      setLoading(false)
    }
  }, [profile.kycStatus])

  useEffect(() => {
    loadSubmission()
  }, [loadSubmission])

  const isVerified = profile.kycStatus === 'Verified'
  const isUnderReview =
    submission?.reviewStatus === 'submitted' && profile.kycStatus === 'Pending'
  const canSubmit =
    !isVerified &&
    !isUnderReview &&
    (profile.kycStatus === 'Pending' || profile.kycStatus === 'Rejected' || !submission)

  const needsProfile = !profileComplete(profile)

  const runDocumentScan = async (
    file: File,
    kind: 'id_front' | 'proof_of_address'
  ) => {
    setScanningKind(kind)
    const result = await scanKycDocument(file, kind)
    setScanningKind(null)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    if (kind === 'id_front') {
      setIdExtract(result.data)
    } else {
      setAddressExtract(result.data)
    }

    const found = [
      result.data.fullName,
      result.data.dateOfBirth,
      result.data.idNumber,
      result.data.address,
      result.data.country,
    ].some((value) => Boolean(value?.trim()))

    if (found) {
      toast.success('Document scanned', {
        description: 'Review the suggested details and apply them to your form.',
      })
    } else {
      toast.message('Could not read text clearly', {
        description: 'Use a sharper photo or enter details manually.',
      })
    }
  }

  const handleDocumentFrontChange = (file: File | null) => {
    setDocumentFront(file)
    setIdExtract(null)
    if (file) void runDocumentScan(file, 'id_front')
  }

  const handleProofOfAddressChange = (file: File | null) => {
    setProofOfAddress(file)
    setAddressExtract(null)
    if (file) void runDocumentScan(file, 'proof_of_address')
  }

  const applyExtractedProfileFields = async (data: KycExtractedFields) => {
    const hasProfileFields = Boolean(
      data.fullName?.trim() || data.dateOfBirth?.trim() || data.address?.trim()
    )
    if (!hasProfileFields) return true

    const result = await updateUserProfile({
      fullName: data.fullName?.trim() || profile.fullName,
      phone: profile.phone,
      dateOfBirth: data.dateOfBirth?.trim() || profile.dateOfBirth,
      address: data.address?.trim() || profile.address,
      avatarUrl: profile.avatarUrl,
    })

    if (!result.success) {
      toast.error(result.error ?? 'Could not update profile from document.')
      return false
    }

    window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
    return true
  }

  const applyIdExtract = async () => {
    if (!idExtract) return
    setApplyingExtract(true)
    try {
      if (idExtract.idNumber?.trim()) setIdNumber(idExtract.idNumber.trim())
      if (idExtract.country?.trim()) setCountry(idExtract.country.trim())
      if (idExtract.idType) setIdType(idExtract.idType)
      await applyExtractedProfileFields(idExtract)
      setIdExtract(null)
      toast.success('ID details applied.')
    } finally {
      setApplyingExtract(false)
    }
  }

  const applyAddressExtract = async () => {
    if (!addressExtract) return
    setApplyingExtract(true)
    try {
      if (addressExtract.country?.trim()) {
        setCountry((current) => current || addressExtract.country!.trim())
      }
      await applyExtractedProfileFields(addressExtract)
      setAddressExtract(null)
      toast.success('Address details applied.')
    } finally {
      setApplyingExtract(false)
    }
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const { data: authUser } = await getCurrentUser()
        if (!authUser) {
          toast.error('You must be signed in to submit KYC.')
          return
        }

        if (!documentFront || !selfie || !proofOfAddress) {
          toast.error('Upload all required documents before submitting.')
          return
        }

        if (requiresDocumentBack(idType) && !documentBack) {
          toast.error('Upload the back of your ID document.')
          return
        }

        const userId = authUser.id
        const [frontPath, backPath, selfiePath, addressPath] = await Promise.all([
          uploadKycDocument(documentFront, userId, 'document-front'),
          documentBack
            ? uploadKycDocument(documentBack, userId, 'document-back')
            : Promise.resolve(undefined),
          uploadKycDocument(selfie, userId, 'selfie'),
          uploadKycDocument(proofOfAddress, userId, 'proof-of-address'),
        ])

        const result = await submitKycForReview({
          idType,
          idNumber,
          country,
          documentFrontPath: frontPath,
          documentBackPath: backPath,
          selfiePath,
          proofOfAddressPath: addressPath,
        })

        if (!result.success) {
          toast.error(result.error ?? 'Failed to submit KYC.')
          return
        }

        toast.success('KYC submitted for review.')
        setDocumentFront(null)
        setDocumentBack(null)
        setSelfie(null)
        setProofOfAddress(null)
        await loadSubmission()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to submit KYC.')
      }
    })
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading verification status…
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Identity Verification (KYC)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit government ID and proof of address to unlock deposits, withdrawals, and investing.
            Upload a clear JPG, PNG, or PDF — we can read name, date of birth, address, and ID number to
            help pre-fill the form.
          </p>
        </div>
        {isVerified ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Verified
          </div>
        ) : isUnderReview ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">
            <Clock className="h-4 w-4" />
            Under review
          </div>
        ) : profile.kycStatus === 'Rejected' ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            Rejected — resubmit
          </div>
        ) : null}
      </div>

      {isVerified ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Your identity has been verified. You have full access to wallet and investment features.</p>
        </div>
      ) : null}

      {isUnderReview ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Documents received</p>
            <p className="mt-1">
              Submitted {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'recently'}.
              Our compliance team typically reviews within 1–2 business days.
            </p>
            {submission ? (
              <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-amber-700">ID type</dt>
                  <dd className="font-medium">{getIdTypeLabel(submission.idType)}</dd>
                </div>
                <div>
                  <dt className="text-amber-700">Country</dt>
                  <dd className="font-medium">{submission.country}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>
      ) : null}

      {canSubmit ? (
        <div className="space-y-6">
          {needsProfile ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Complete your profile before submitting</p>
              <p className="mt-1">
                We need your full name, phone, date of birth, and address on file.{' '}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('primefx:open-edit-profile'))}
                  className="font-semibold underline"
                >
                  Edit profile
                </button>
              </p>
            </div>
          ) : null}

          {profile.kycStatus === 'Rejected' ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Your previous submission was rejected. Please upload updated documents and submit again.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">ID type</label>
              <CustomSelect
                value={idType}
                onValueChange={(value) => setIdType(value as typeof idType)}
                options={KYC_ID_TYPES.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                placeholder="Select ID type"
                disabled={pending}
                searchable={false}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">ID number</label>
              <input
                type="text"
                value={idNumber}
                disabled={pending}
                onChange={(event) => setIdNumber(event.target.value)}
                placeholder="As shown on your document"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-foreground">Country of residence</label>
              <input
                type="text"
                value={country}
                disabled={pending}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="e.g. United States"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {idExtract ? (
            <KycExtractedDetailsCard
              title="Details read from your ID"
              data={idExtract}
              onApply={applyIdExtract}
              onDismiss={() => setIdExtract(null)}
              applying={applyingExtract}
              applyLabel="Apply to form & profile"
            />
          ) : null}

          {addressExtract ? (
            <KycExtractedDetailsCard
              title="Details read from proof of address"
              data={addressExtract}
              onApply={applyAddressExtract}
              onDismiss={() => setAddressExtract(null)}
              applying={applyingExtract}
              applyLabel="Apply address to profile"
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <KycFileField
              label="Government ID (front)"
              required
              value={documentFront}
              onChange={handleDocumentFrontChange}
              disabled={pending}
              scanning={scanningKind === 'id_front'}
              hint="Clear photo of the front of your ID. JPG, PNG, or PDF — auto-scan supported."
            />
            {requiresDocumentBack(idType) ? (
              <KycFileField
                label="Government ID (back)"
                required
                value={documentBack}
                onChange={setDocumentBack}
                disabled={pending}
              />
            ) : null}
            <KycFileField
              label="Selfie with ID"
              required
              value={selfie}
              onChange={setSelfie}
              disabled={pending}
              hint="Hold your ID next to your face in good lighting."
            />
            <KycFileField
              label="Proof of address"
              required
              value={proofOfAddress}
              onChange={handleProofOfAddressChange}
              disabled={pending}
              scanning={scanningKind === 'proof_of_address'}
              hint="Utility bill or bank statement (last 3 months). Auto-scan supported."
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Documents are stored securely and only used for compliance review.
            </p>
            <button
              type="button"
              disabled={pending || needsProfile}
              onClick={handleSubmit}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Submit for review
            </button>
          </div>
        </div>
      ) : null}

      {!isVerified && !canSubmit && !isUnderReview ? (
        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <Link href="/support" className="font-medium text-primary hover:underline">
            Contact support
          </Link>
        </p>
      ) : null}
    </div>
  )
}
