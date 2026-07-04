type AuthDividerProps = {
  label: string
}

export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <div className="relative my-5 sm:my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-xs text-muted-foreground sm:text-sm">{label}</span>
      </div>
    </div>
  )
}
