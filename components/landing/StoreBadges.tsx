export function AppStoreBadge({ className }: { className?: string }) {
  return (
    <img
      src="/store-badges/app-store.svg"
      alt="Download on the App Store"
      className={className}
    />
  )
}

export function GooglePlayBadge({ className }: { className?: string }) {
  return (
    <img
      src="/store-badges/google-play.svg"
      alt="Get it on Google Play"
      className={className}
    />
  )
}
