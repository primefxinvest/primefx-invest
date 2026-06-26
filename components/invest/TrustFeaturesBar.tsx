import { Banknote, Brain, Layers, ShieldCheck } from 'lucide-react'

const icons = {
  fees: Banknote,
  withdraw: ShieldCheck,
  diversify: Layers,
  ai: Brain,
}

export default function TrustFeaturesBar() {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm sm:grid-cols-4">
      {[
        { label: 'No Hidden Fees', icon: icons.fees },
        { label: 'Withdraw Anytime', icon: icons.withdraw },
        { label: 'Smart Diversification', icon: icons.diversify },
        { label: 'AI Risk Management', icon: icons.ai },
      ].map(({ label, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      ))}
    </div>
  )
}
