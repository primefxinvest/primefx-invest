'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/shared/Logo'
import { RegistrationStepper } from '@/components/onboarding/RegistrationStepper'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tier: 'Starter',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions')
      return
    }

    setLoading(true)

    try {
      // Create Supabase account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            investor_tier: formData.tier,
          },
        },
      })

      if (authError) {
        setError(authError.message || 'Registration failed. Please try again.')
        return
      }

      // Create user profile in database
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            full_name: formData.name,
            investor_tier: formData.tier,
          }])

        if (profileError) {
          setError('Profile creation failed. Please contact support.')
          return
        }

        // Create wallet for user
        await supabase
          .from('wallet_balances')
          .insert([{
            user_id: authData.user.id,
            available_balance: 0,
            pending_balance: 0,
            bonus_balance: 0,
            total_balance: 0,
          }])

        // Create portfolio for user
        await supabase
          .from('portfolios')
          .insert([{
            user_id: authData.user.id,
            total_invested: 0,
            current_value: 0,
            profit_loss: 0,
            roi_percentage: 0,
          }])

        // Redirect to dashboard
        router.refresh()
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo showText={false} size={64} />
        </div>
        <h1 className="text-2xl font-bold">PrimeFx Invest</h1>
        <p className="text-muted-foreground text-sm mt-1">Create your investment account</p>
        <p className="mt-2 text-xs text-muted-foreground">
          All accounts start as <span className="font-medium">Starter Investors</span> 🌱 — upgrade by investing in higher plans.
        </p>
      </div>

      <RegistrationStepper activeStep={1} className="mb-8" />

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Terms Checkbox */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="rounded border border-border w-4 h-4 mt-1 cursor-pointer"
            disabled={loading}
          />
          <span className="text-sm text-muted-foreground">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Benefits */}
      <div className="mt-6 space-y-2 p-4 bg-primary/5 rounded-lg">
        <div className="flex gap-2 text-sm">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <span>256-bit encryption security</span>
        </div>
        <div className="flex gap-2 text-sm">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <span>24/7 PrimeAI support</span>
        </div>
        <div className="flex gap-2 text-sm">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <span>Instant investment access</span>
        </div>
      </div>

      {/* Sign In Link */}
      <p className="text-center text-muted-foreground text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}
