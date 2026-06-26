import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, WebP, or GIF image.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Image must be smaller than 5 MB.'
  }
  return null
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image.'))
    reader.readAsDataURL(file)
  })
}

export async function resizeImageFile(
  file: File,
  maxDimension = 320,
  quality = 0.85
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not process image.'))
        return
      }

      ctx.drawImage(image, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    image.onerror = () => reject(new Error('Invalid image file.'))
    image.src = dataUrl
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function isDataUrl(url: string) {
  return url.startsWith('data:')
}

export async function uploadAvatarImage(
  file: File,
  userId: string
): Promise<{ url: string; useLocalOnly: boolean }> {
  const validationError = validateAvatarFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const resizedDataUrl = await resizeImageFile(file)
  const path = `${userId}/avatar.jpg`
  const blob = dataUrlToBlob(resizedDataUrl)

  const { error } = await supabase.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  })

  if (!error) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return { url: `${data.publicUrl}?t=${Date.now()}`, useLocalOnly: false }
  }

  return { url: resizedDataUrl, useLocalOnly: true }
}

export function getDefaultAvatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

export const AVATAR_PRESETS = [
  { id: 'classic', label: 'Classic' },
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'bold', label: 'Bold' },
  { id: 'creative', label: 'Creative' },
  { id: 'calm', label: 'Calm' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'minimal', label: 'Minimal' },
] as const

export function getPresetAvatarUrl(presetId: string) {
  return getDefaultAvatarUrl(presetId)
}

export function isPresetAvatar(url: string) {
  return url.includes('api.dicebear.com')
}
