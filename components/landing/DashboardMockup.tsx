'use client'

import {
  Home,
  BarChart3,
  Calendar,
  Wallet,
  Settings,
  TrendingUp,
  Shield,
  Headphones,
  Sparkles,
  Globe,
  Bot,
} from 'lucide-react'

function MiniSparkline({ color = '#10b981' }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 32" className="h-8 w-full" fill="none" preserveAspectRatio="none">
      <path
        d="M0 24 L12 20 L24 22 L36 14 L48 16 L60 8 L72 10 L80 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProgressRing({ value }: { value: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#0052ff"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold text-[#0052ff]">{value}</span>
    </div>
  )
}

export default function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
      {/* Main dashboard card */}
      <div
        className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-blue-900/10"
        style={{ transform: 'perspective(1200px) rotateY(-8deg) rotateX(4deg)' }}
      >
        <div className="flex overflow-hidden rounded-2xl">
          {/* Sidebar */}
          <div className="flex w-12 shrink-0 flex-col items-center gap-4 bg-[#0f1f4d] py-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0052ff]">
              <span className="text-xs font-bold text-white">P</span>
            </div>
            {[Home, BarChart3, Calendar, Wallet, Settings].map((Icon, i) => (
              <Icon
                key={i}
                className={`h-4 w-4 ${i === 0 ? 'text-white' : 'text-white/40'}`}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-900">
                Welcome back, <span className="text-[#0052ff]">Smart Investor</span>
              </p>
              <p className="text-xs text-gray-500">Here&apos;s your portfolio overview</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Portfolio value */}
              <div className="col-span-1 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                <p className="text-[10px] font-medium text-gray-500">Portfolio Value</p>
                <p className="text-lg font-bold text-gray-900">$24,567.89</p>
                <p className="text-[10px] font-semibold text-emerald-500">+$4,567.89 (22.81%)</p>
                <MiniSparkline />
              </div>

              {/* PrimeAI card */}
              <div className="col-span-1 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0052ff]">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0052ff]">PrimeAI</span>
                </div>
                <p className="mt-1 text-[10px] text-gray-600">Your AI assistant is ready</p>
                <div className="mt-2 flex justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0052ff]/10">
                    <Bot className="h-4 w-4 text-[#0052ff]" />
                  </div>
                </div>
              </div>

              {/* AI Performance */}
              <div className="col-span-1 flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-3">
                <ProgressRing value={92} />
                <div>
                  <p className="text-[10px] font-medium text-gray-500">AI Performance</p>
                  <p className="text-xs font-bold text-emerald-500">Excellent</p>
                  <p className="text-[10px] text-gray-400">92/100</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="col-span-1 grid grid-cols-3 gap-1 rounded-xl border border-gray-100 bg-white p-2">
                {[
                  { label: 'Active', value: '8' },
                  { label: 'Profit', value: '$4.5K' },
                  { label: 'ROI', value: '22.8%' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-[9px] text-gray-400">{stat.label}</p>
                    <p className="text-[10px] font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prime Plan floating card */}
      <div
        className="absolute -right-4 top-8 z-10 w-36 rounded-xl bg-[#0f1f4d] p-3 shadow-xl"
        style={{ transform: 'perspective(800px) rotateY(-12deg)' }}
      >
        <p className="text-[9px] font-medium text-blue-300">Prime Plan</p>
        <p className="text-[10px] text-white/70">ROI (12 Months)</p>
        <p className="text-lg font-bold text-emerald-400">32.45%</p>
        <MiniSparkline color="#34d399" />
      </div>

      {/* Global Markets floating card */}
      <div className="absolute -bottom-2 -left-2 z-10 w-44 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
        <div className="mb-2 flex items-center gap-1.5">
          <Globe className="h-3 w-3 text-[#0052ff]" />
          <p className="text-[10px] font-bold text-gray-900">Global Markets</p>
        </div>
        <p className="mb-1.5 text-[9px] text-gray-500">Live Opportunities</p>
        {[
          { name: 'NASDAQ', change: '+1.24%', up: true },
          { name: 'GOLD', change: '+0.87%', up: true },
          { name: 'EUR/USD', change: '-0.32%', up: false },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between py-0.5">
            <span className="text-[9px] font-medium text-gray-700">{item.name}</span>
            <span className={`text-[9px] font-semibold ${item.up ? 'text-emerald-500' : 'text-red-500'}`}>
              {item.change}
            </span>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div className="absolute -bottom-14 left-1/2 z-10 flex w-[110%] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-lg">
        {[
          { icon: Shield, label: '256-bit Bank-Level Security' },
          { icon: Globe, label: 'Regulated Global Compliance' },
          { icon: Headphones, label: '24/7 Customer Support' },
          { icon: Sparkles, label: 'AI-Powered Smart Decisions' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-[#0052ff]" />
            <span className="text-[9px] font-medium text-gray-600 whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
