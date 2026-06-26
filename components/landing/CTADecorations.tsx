export function CTADecorations() {
  return (
    <div className="pointer-events-none relative h-full min-h-[200px] w-full">
      {/* Large 3D growth arrows */}
      <svg
        viewBox="0 0 160 140"
        className="absolute right-0 top-0 h-36 w-40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="arrowGrad1" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a4fd6" />
            <stop offset="100%" stopColor="#4d8bff" />
          </linearGradient>
          <linearGradient id="arrowGrad2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f3db8" />
            <stop offset="100%" stopColor="#3d7af5" />
          </linearGradient>
        </defs>
        {/* Back arrow */}
        <path
          d="M30 110 L30 50 L50 50 L50 70 L110 10 L130 30 L70 90 L90 90 L90 110 Z"
          fill="url(#arrowGrad2)"
          opacity="0.7"
        />
        {/* Front arrow */}
        <path
          d="M55 125 L55 65 L75 65 L75 85 L125 35 L145 55 L95 105 L115 105 L115 125 Z"
          fill="url(#arrowGrad1)"
        />
      </svg>

      {/* Gold coin stack */}
      <svg
        viewBox="0 0 80 70"
        className="absolute bottom-4 left-4 h-16 w-20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="40" cy="58" rx="28" ry="8" fill="#b8860b" opacity="0.4" />
        <ellipse cx="40" cy="50" rx="28" ry="8" fill="#f5c842" stroke="#d4a017" strokeWidth="1.5" />
        <ellipse cx="40" cy="42" rx="28" ry="8" fill="#f9d45c" stroke="#d4a017" strokeWidth="1.5" />
        <ellipse cx="40" cy="34" rx="28" ry="8" fill="#f5c842" stroke="#d4a017" strokeWidth="1.5" />
        <text x="40" y="38" textAnchor="middle" fill="#b8860b" fontSize="14" fontWeight="bold">$</text>
      </svg>

      {/* Plant in blue pot */}
      <svg
        viewBox="0 0 60 80"
        className="absolute bottom-2 right-8 h-20 w-14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 65 Q30 55 45 65 L42 75 Q30 78 18 75 Z" fill="#1a4fd6" />
        <rect x="17" y="62" width="26" height="8" rx="2" fill="#0f3db8" />
        <path d="M30 62 Q20 40 12 30 Q25 35 30 50 Z" fill="#22c55e" />
        <path d="M30 62 Q40 38 48 28 Q38 38 30 50 Z" fill="#16a34a" />
        <path d="M30 55 Q30 30 30 18 Q35 30 30 48 Z" fill="#4ade80" />
      </svg>
    </div>
  )
}
