import { Users, DollarSign, Globe, Star, Activity } from 'lucide-react'

const stats = [
  { icon: Users, value: '120,000+', label: 'Happy Investors' },
  { icon: DollarSign, value: '$250M+', label: 'Assets Under Management' },
  { icon: Globe, value: '150+', label: 'Countries Worldwide' },
  { icon: Star, value: '4.9/5', label: 'Average Rating' },
  { icon: Activity, value: '99.9%', label: 'Uptime & Reliability' },
]

export default function GlobalImpactSection() {
  return (
    <section className="border-y border-gray-200 bg-white py-10">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-xs font-semibold tracking-widest text-[#0052ff]">
          GLOBAL IMPACT
        </p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Icon className="h-5 w-5 text-[#0052ff]" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
