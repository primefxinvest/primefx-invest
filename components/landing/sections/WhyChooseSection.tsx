import { Bot, Globe, Shield, Users, Eye, Headphones } from 'lucide-react'

const features = [
  {
    icon: Bot,
    color: 'bg-blue-100 text-[#0052ff]',
    title: 'AI-Powered Edge',
    description:
      'Our proprietary AI analyzes global markets 24/7 to identify high-probability investment opportunities before they peak.',
  },
  {
    icon: Globe,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Diverse Opportunities',
    description:
      'Access forex, commodities, indices, and digital assets across 150+ countries — all from one unified platform.',
  },
  {
    icon: Shield,
    color: 'bg-purple-100 text-purple-600',
    title: 'Bank-Level Security',
    description:
      '256-bit SSL encryption, cold storage, and multi-factor authentication keep your funds and data fully protected.',
  },
  {
    icon: Users,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Expert Management',
    description:
      'A team of seasoned financial analysts and portfolio managers work alongside AI to maximize your returns.',
  },
  {
    icon: Eye,
    color: 'bg-teal-100 text-teal-600',
    title: 'Transparent & Fair',
    description:
      'No hidden fees, no surprises. Real-time portfolio tracking and detailed reports so you always know where you stand.',
  },
  {
    icon: Headphones,
    color: 'bg-red-100 text-red-500',
    title: '24/7 Human Support',
    description:
      'Our dedicated support team is available around the clock via live chat, email, and phone whenever you need help.',
  },
]

export default function WhyChooseSection() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#0052ff]">
            WHY CHOOSE PRIMEAI INVEST?
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Why Thousands Choose Us
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            We combine cutting-edge technology with proven investment strategies to deliver
            consistent, secure returns for investors at every level.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, color, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
