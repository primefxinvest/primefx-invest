'use client'

import { useEffect, useState } from 'react'
import { Copy, Loader2, Shield, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  completeMfaEnrollment,
  disableMfa,
  getMfaStatus,
  startMfaEnrollment,
  type MfaEnrollment,
  type MfaStatus,
} from '@/lib/auth/mfa'
import { getQrCodeRenderOptions } from '@/lib/auth/totp'
import { cn } from '@/lib/utils'

interface TwoFactorModalProps {
  open: boolean
  onClose: () => void
  onStatusChange: (status: MfaStatus) => void
  userEmail: string
  initialEnabled: boolean
}

export default function TwoFactorModal({
  open,
  onClose,
  onStatusChange,
  userEmail,
  initialEnabled,
}: TwoFactorModalProps) {
  const [mode, setMode] = useState<'enable' | 'disable'>(initialEnabled ? 'disable' : 'enable')
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode(initialEnabled ? 'disable' : 'enable')
    setEnrollment(null)
    setCode('')
  }, [open, initialEnabled])

  useEffect(() => {
    if (!open || mode !== 'enable' || enrollment) return

    let active = true
    setStarting(true)

    startMfaEnrollment(userEmail).then((result) => {
      if (!active) return
      setStarting(false)
      if (!result.success || !result.enrollment) {
        toast.error(result.error ?? 'Could not start 2FA setup.')
        return
      }
      setEnrollment(result.enrollment)
    })

    return () => {
      active = false
    }
  }, [open, mode, enrollment, userEmail])

  if (!open) return null

  const qrRender = enrollment
    ? getQrCodeRenderOptions({ qrCode: enrollment.qrCode, uri: enrollment.uri })
    : null

  const qrContent = qrRender ? (
    qrRender.kind === 'image' ? (
      <img
        src={qrRender.src}
        alt="2FA QR code"
        className="mx-auto h-44 w-44 rounded-lg border border-gray-200 bg-white p-2"
      />
    ) : (
      <div
        className="mx-auto flex h-44 w-44 items-center justify-center rounded-lg border border-gray-200 bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: qrRender.markup }}
      />
    )
  ) : null

  const handleCopySecret = async () => {
    if (!enrollment?.secret) return
    await navigator.clipboard.writeText(enrollment.secret)
    toast.success('Secret copied to clipboard.')
  }

  const handleCompleteEnable = async () => {
    if (!enrollment) return
    setLoading(true)
    const result = await completeMfaEnrollment(enrollment, code)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error ?? 'Verification failed.')
      return
    }

    const status = await getMfaStatus()
    onStatusChange(status)
    toast.success('Two-factor authentication is now enabled.')
    onClose()
  }

  const handleDisable = async () => {
    setLoading(true)
    const result = await disableMfa(code)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error ?? 'Could not disable 2FA.')
      return
    }

    const status = await getMfaStatus()
    onStatusChange(status)
    toast.success('Two-factor authentication has been disabled.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052ff]/10">
              <Shield className="h-5 w-5 text-[#0052ff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {mode === 'enable'
                  ? 'Use Google Authenticator, Authy, or any TOTP app.'
                  : 'Enter your authenticator code to turn off 2FA.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'enable' ? (
          <div className="space-y-4">
            {starting || !enrollment ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0052ff]" />
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                  {qrContent}
                  <p className="mt-3 text-xs text-gray-500">
                    Scan this QR code with your authenticator app
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <code className="rounded bg-white px-2 py-1 text-xs text-gray-700">
                      {enrollment.secret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-white"
                      aria-label="Copy secret"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="enableCode" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <input
                    id="enableCode"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCompleteEnable}
                  disabled={loading || code.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0052ff] py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verify & Enable
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="disableCode" className="mb-1.5 block text-sm font-medium text-gray-700">
                Authenticator Code
              </label>
              <input
                id="disableCode"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff]"
              />
            </div>
            <button
              type="button"
              onClick={handleDisable}
              disabled={loading || code.length !== 6}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60',
                'bg-red-500 hover:bg-red-600'
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Disable 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
