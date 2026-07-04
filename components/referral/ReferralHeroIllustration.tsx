'use client'

export function ReferralHeroIllustration() {
  return (
    <div
      className="relative mx-auto flex h-[220px] w-full max-w-[320px] items-center justify-center sm:h-[260px] lg:mx-0 lg:max-w-none"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-violet-100/40 to-blue-50/60" />
      <svg viewBox="0 0 320 260" className="relative h-full w-full max-w-[300px]" fill="none">
        <defs>
          <linearGradient id="refGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0052ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle cx="160" cy="130" r="78" fill="url(#refGrad)" fillOpacity="0.12" />
        <circle cx="160" cy="130" r="52" fill="url(#refGrad)" fillOpacity="0.18" />
        <path
          d="M160 78 L188 118 L248 118 L200 148 L216 208 L160 176 L104 208 L120 148 L72 118 L132 118 Z"
          fill="url(#refGrad)"
          fillOpacity="0.35"
        />
        {[
          [88, 92],
          [232, 92],
          [68, 168],
          [252, 168],
          [160, 220],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <line x1="160" y1="130" x2={cx} y2={cy} stroke="#0052ff" strokeOpacity="0.25" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="16" fill="white" stroke="#0052ff" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="6" fill="#0052ff" fillOpacity="0.7" />
          </g>
        ))}
        <circle cx="160" cy="130" r="22" fill="white" stroke="#0052ff" strokeWidth="2.5" />
        <circle cx="160" cy="130" r="10" fill="#0052ff" />
      </svg>
    </div>
  )
}
