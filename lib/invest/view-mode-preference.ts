export const INVEST_VIEW_MODE_KEY = 'primefx_invest_view_mode'

export const INVEST_VIEW_MODES = ['table', 'grid', 'compare'] as const
export type InvestViewMode = (typeof INVEST_VIEW_MODES)[number]

const DEFAULT_VIEW_MODE: InvestViewMode = 'grid'

const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

export function isInvestMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function isInvestViewMode(value: string | null | undefined): value is InvestViewMode {
  return INVEST_VIEW_MODES.includes(value as InvestViewMode)
}

/** Cards on mobile; stored preference on desktop; grid when unset. */
export function readInvestViewModePreference(): InvestViewMode {
  if (typeof window === 'undefined') return DEFAULT_VIEW_MODE

  if (isInvestMobileViewport()) {
    return DEFAULT_VIEW_MODE
  }

  try {
    const stored = localStorage.getItem(INVEST_VIEW_MODE_KEY)
    if (isInvestViewMode(stored)) return stored
  } catch {
    // localStorage may be unavailable
  }

  return DEFAULT_VIEW_MODE
}

export function persistInvestViewModePreference(mode: InvestViewMode): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(INVEST_VIEW_MODE_KEY, mode)
  } catch {
    // ignore
  }
}
