import { AuthHeroPanel, AuthMobileHero } from '@/components/auth/AuthHeroPanel'
import { AuthSplitShell } from '@/components/auth/AuthSplitShell'
import { SignupFormClient } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <>
      <AuthMobileHero variant="signup" />
      <AuthSplitShell hero={<AuthHeroPanel variant="signup" />}>
        <SignupFormClient />
      </AuthSplitShell>
    </>
  )
}
