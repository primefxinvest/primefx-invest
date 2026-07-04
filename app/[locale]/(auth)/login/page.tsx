import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthHeroPanel, AuthMobileHero } from '@/components/auth/AuthHeroPanel'
import { AuthSplitShell } from '@/components/auth/AuthSplitShell'
import { LoginFormClient } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <>
      <AuthMobileHero variant="login" />
      <AuthSplitShell hero={<AuthHeroPanel variant="login" />}>
        <LoginFormClient />
      </AuthSplitShell>
    </>
  )
}
