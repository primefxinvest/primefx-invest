import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { VerifyCallbackClient } from '@/components/verify/VerifyCallbackClient'

function CallbackFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#0052ff]" />
    </div>
  )
}

export default function VerifyCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <VerifyCallbackClient />
    </Suspense>
  )
}
