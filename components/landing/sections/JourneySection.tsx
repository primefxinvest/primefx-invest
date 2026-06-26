import Link from 'next/link'
import { UserPlus, Layers, Wallet, TrendingUp, Banknote } from 'lucide-react'

const steps = [
  {
    num: 1,
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up in under 2 minutes with just your email and basic info.',
  },
  {
    num: 2,
    icon: Layers,
    title: 'Choose Your Plan',
    description: 'Pick from Starter, Growth, Prime, or Elite based on your goals.',
  },
  {
    num: 3,
    icon: Wallet,
    title: 'Fund Your Account',
    description: 'Deposit via bank transfer, card, or crypto — funds credited instantly.',
  },
  {
    num: 4,
    icon: TrendingUp,
    title: 'We Invest For You',
    description: 'Our AI and expert team manage your portfolio around the clock.',
  },
  {
    num: 5,
    icon: Banknote,
    title: 'Grow & Withdraw',
    description: 'Watch your wealth grow and withdraw profits anytime, hassle-free.',
  },
]

export default function JourneySection() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#0052ff]">HOW IT WORKS</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Your Journey To Financial Freedom
          </h2>
        </div>

        <div className="relative">
          <div className="hidden lg:absolute lg:left-0 lg:right-0 lg:top-8 lg:block">
            <div className="mx-auto h-px max-w-5xl border-t-2 border-dashed border-gray-300" />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map(({ num, icon: Icon, title, description }) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-[#0052ff] bg-white shadow-sm">
                  <span className="absolute -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0052ff] text-[10px] font-bold text-white">
                    {num}
                  </span>
                  <Icon className="h-6 w-6 text-[#0052ff]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-xl bg-[#0052ff] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-colors hover:bg-blue-700"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </section>
  )
}
