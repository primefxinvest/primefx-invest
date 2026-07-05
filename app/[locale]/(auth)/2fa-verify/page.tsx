import { TwoFactorVerifyForm } from '@/components/auth/TwoFactorVerifyForm'

export default function TwoFactorVerifyPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="w-full max-w-[520px] min-w-0">
        <TwoFactorVerifyForm />
      </div>
    </div>
  )
}
