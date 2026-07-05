export function InvestDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Investment risk disclosure"
      className="rounded-xl border border-border bg-muted/30 px-4 py-3 sm:px-5 sm:py-4"
    >
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
        <span className="font-semibold text-foreground">Risk disclosure:</span> Investments involve
        risk, including possible loss of capital. Investment performance may vary. Returns depend on
        market conditions and investment strategy. Past performance does not indicate future results.
        Only invest what you can afford to lose.
      </p>
    </div>
  )
}
