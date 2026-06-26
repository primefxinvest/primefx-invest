import { Check } from 'lucide-react'
import { whyInvestItems } from '@/lib/invest/plan-config'

export default function WhyInvestWidget() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900">Why Invest with PrimeFx?</h3>
      <ul className="mt-4 space-y-3">
        {whyInvestItems.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-xs text-gray-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
