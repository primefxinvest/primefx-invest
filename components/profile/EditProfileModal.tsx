'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { UpdateProfileInput, UserProfile } from '@/lib/profile/types'
import { updateUserProfile } from '@/lib/profile/actions'
import { getCurrentUser } from '@/lib/supabase'
import {
  AVATAR_PRESETS,
  getDefaultAvatarUrl,
  getPresetAvatarUrl,
  uploadAvatarImage,
  validateAvatarFile,
} from '@/lib/profile/avatar'
import { cn } from '@/lib/utils'

interface EditProfileModalProps {
  profile: UserProfile | null
  open: boolean
  onClose: () => void
  onSuccess: (profile: UserProfile) => void
}

function getSelectedPresetId(url: string) {
  const match = AVATAR_PRESETS.find((preset) => url.includes(encodeURIComponent(preset.id)))
  return match?.id ?? null
}

export default function EditProfileModal({
  profile,
  open,
  onClose,
  onSuccess,
}: EditProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<UpdateProfileInput>({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    avatarUrl: '',
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [usingCustomPhoto, setUsingCustomPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (open && profile) {
      setForm({
        fullName: profile.fullName,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        avatarUrl: profile.avatarUrl,
      })
      setAvatarPreview(profile.avatarUrl)
      setSelectedPreset(getSelectedPresetId(profile.avatarUrl))
      setUsingCustomPhoto(
        profile.avatarUrl.startsWith('data:') || !profile.avatarUrl.includes('api.dicebear.com')
      )
    }
  }, [open, profile])

  if (!open || !profile) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePresetSelect = (presetId: string) => {
    const url = getPresetAvatarUrl(presetId)
    setSelectedPreset(presetId)
    setUsingCustomPhoto(false)
    setAvatarPreview(url)
    setForm((prev) => ({ ...prev, avatarUrl: url }))
  }

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateAvatarFile(file)
    if (validationError) {
      toast.error(validationError)
      e.target.value = ''
      return
    }

    setUploadingAvatar(true)

    try {
      const { data: authUser } = await getCurrentUser()
      const userId = authUser?.id ?? profile.id
      const { url } = await uploadAvatarImage(file, userId)

      setAvatarPreview(url)
      setForm((prev) => ({ ...prev, avatarUrl: url }))
      setSelectedPreset(null)
      setUsingCustomPhoto(true)
      toast.success('Photo selected.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load image.')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleRemoveAvatar = () => {
    const fallback = getPresetAvatarUrl('classic')
    setAvatarPreview(fallback)
    setForm((prev) => ({ ...prev, avatarUrl: fallback }))
    setSelectedPreset('classic')
    setUsingCustomPhoto(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.fullName.trim()) {
      toast.error('Full name is required.')
      return
    }

    setLoading(true)
    const result = await updateUserProfile({
      ...form,
      avatarUrl: avatarPreview || form.avatarUrl,
    })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error ?? 'Failed to update profile.')
      return
    }

    if (result.profile) {
      onSuccess(result.profile)
    }

    toast.success('Profile updated successfully.')
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
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
            <p className="text-xs text-gray-500">{profile.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={avatarPreview || getDefaultAvatarUrl(profile.fullName)}
                    alt="Profile preview"
                    className="h-20 w-20 rounded-full border-4 border-white bg-white object-cover shadow-sm"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Profile Photo</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Pick an avatar below or upload your own photo.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarSelect}
                    disabled={loading || uploadingAvatar}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || uploadingAvatar}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052ff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Upload Photo
                    </button>
                    {(usingCustomPhoto || selectedPreset) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={loading || uploadingAvatar}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Choose Avatar
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {AVATAR_PRESETS.map((preset) => {
                    const url = getPresetAvatarUrl(preset.id)
                    const isSelected = selectedPreset === preset.id && !usingCustomPhoto
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        onClick={() => handlePresetSelect(preset.id)}
                        disabled={loading || uploadingAvatar}
                        className={cn(
                          'relative rounded-full p-0.5 transition-all hover:scale-105',
                          isSelected ? 'ring-2 ring-[#0052ff] ring-offset-2' : 'ring-1 ring-gray-200'
                        )}
                      >
                        <img
                          src={url}
                          alt={preset.label}
                          className="h-10 w-10 rounded-full bg-white object-cover"
                        />
                        {isSelected && (
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0052ff] text-white">
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff]"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff]"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="mb-1.5 block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                placeholder="January 15, 1990"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff]"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff]"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingAvatar}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
