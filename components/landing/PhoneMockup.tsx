function MiniChart() {
  return (
    <svg viewBox="0 0 160 48" className="mt-2 h-12 w-full" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 38 L20 34 L40 36 L60 28 L80 30 L100 22 L120 24 L140 16 L160 12 L160 48 L0 48 Z"
        fill="url(#chartFill)"
      />
      <path
        d="M0 38 L20 34 L40 36 L60 28 L80 30 L100 22 L120 24 L140 16 L160 12"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const assets = [
  { name: 'NASDAQ', change: '+1.24%', up: true },
  { name: 'GOLD', change: '+0.87%', up: true },
  { name: 'EUR/USD', change: '-0.32%', up: false },
]

export default function PhoneMockup() {
  return (
    <div
      className="relative mx-auto w-[200px] shrink-0 sm:w-[220px]"
      style={{ transform: 'perspective(900px) rotateY(-12deg) rotateX(4deg) rotateZ(2deg)' }}
    >
      {/* Phone frame */}
      <div className="relative rounded-[2.25rem] border-[3px] border-gray-700 bg-gray-800 p-1.5 shadow-2xl shadow-blue-900/25">
        <div className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-gray-900" />
        {/* Screen */}
        <div className="overflow-hidden rounded-[1.85rem] bg-[#0c1633] px-3 pb-4 pt-7">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0052ff]">
              <span className="text-[9px] font-bold text-white">P</span>
            </div>
            <span className="text-[10px] font-semibold text-white">PrimeFx</span>
          </div>

          <p className="text-[9px] text-blue-300/70">Portfolio Balance</p>
          <p className="text-xl font-bold text-white">$24,567.89</p>
          <p className="text-[10px] font-semibold text-emerald-400">↑ +22.81%</p>

          <MiniChart />

          <p className="mb-2 mt-3 text-[9px] font-medium text-blue-300/70">Your Assets</p>
          <div className="space-y-1.5">
            {assets.map((asset) => (
              <div
                key={asset.name}
                className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5"
              >
                <span className="text-[9px] font-medium text-white/90">{asset.name}</span>
                <span
                  className={`text-[9px] font-bold ${asset.up ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {asset.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Reflection / depth */}
      <div className="absolute -bottom-3 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-full bg-blue-900/20 blur-md" />
    </div>
  )
}
