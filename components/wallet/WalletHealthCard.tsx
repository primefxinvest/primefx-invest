import { Shield } from 'lucide-react'

export default function WalletHealthCard() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900">Wallet Health</h2>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="#ecfdf5" strokeWidth="8" />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 48}`}
              strokeDashoffset={`${2 * Math.PI * 48 * (1 - 0.92)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Shield className="h-7 w-7 text-emerald-500" />
          </div>
        </div>

        <p className="mt-4 text-sm font-semibold text-emerald-600">Secure & Protected</p>
        <p className="mt-1 text-center text-xs text-gray-500">
          Your wallet is secure with 256-bit encryption
        </p>

        <span className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          All Systems Normal
        </span>
      </div>
    </div>
  )
}
