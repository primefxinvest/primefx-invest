/** Canonical PrimeFx logo display sizes — keep proportions identical app-wide. */
export const LOGO_SIZES = {
  /** Sidebar icon rail (tablet) */
  sidebarIcon: 32,
  /** Sidebar with wordmark (desktop) */
  sidebarFull: 38,
  /** Mobile drawer header */
  mobileDrawer: 38,
  /** Landing / marketing nav */
  marketing: 36,
  /** Dashboard top bar (when shown) */
  navbar: 32,
  /** Auth form headers */
  authForm: 40,
  /** Auth hero panel */
  authHero: 44,
  /** MFA / compact auth */
  authCompact: 48,
} as const

export type LogoSizeKey = keyof typeof LOGO_SIZES
