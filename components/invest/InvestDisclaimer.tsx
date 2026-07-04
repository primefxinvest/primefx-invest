export function InvestDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Investment risk disclosure"
      className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 sm:px-5 sm:py-4"
    >
      <p className="text-xs leading-relaxed text-amber-950/90 sm:text-[13px]">
        <span className="font-semibold">Risk disclosure:</span> Investments involve risk,
        including possible loss of capital. Returns are not guaranteed. Past performance does not
        indicate future results. Only invest what you can afford to lose.
      </p>
    </div>
  )
}
