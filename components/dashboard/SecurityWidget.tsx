import { Shield } from 'lucide-react'

export default function SecurityWidget() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <Shield className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Security Status</p>
          <p className="text-lg font-bold text-emerald-500">Very Strong</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">92</p>
          <p className="text-[10px] text-gray-400">/100</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full w-[92%] rounded-full bg-emerald-500" />
      </div>
      <p className="mt-2 text-[10px] text-gray-500">Your account is well protected</p>
    </div>
  )
}
