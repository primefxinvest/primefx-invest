/** Decorative growth chart for auth hero — no interaction, lazy-friendly SVG */
export function AuthHeroChart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="authChartGlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052ff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0052ff" stopOpacity="0.55" />
        </linearGradient>
        <filter id="authChartBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={160 - i * 8 - (i % 3) * 6}
          width="18"
          height={40 + i * 8 + (i % 3) * 6}
          rx="3"
          fill="url(#authChartGlow)"
          opacity={0.35 + i * 0.05}
        />
      ))}
      <path
        d="M20 150 C80 140, 120 120, 180 100 S300 50, 380 25"
        stroke="#0052ff"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#authChartBlur)"
        opacity="0.9"
      />
      <path
        d="M20 150 C80 140, 120 120, 180 100 S300 50, 380 25"
        stroke="#60a5fa"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="380" cy="25" r="5" fill="#0052ff" opacity="0.9" />
      <circle cx="380" cy="25" r="10" fill="#0052ff" opacity="0.2" />
    </svg>
  )
}
