/** Shared card and layout surface tokens — semantic theme classes only. */

/** Primary dashboard card (profile, settings, rewards, community). */
export const cardSurfaceClass =
  'rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6'

/** Metric / status cards on dashboard and wallet. */
export const statusCardSurfaceClass =
  'rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 xl:p-5'

/** Admin portal cards — same padding as status cards. */
export const statusCardAdminSurfaceClass =
  'rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 xl:p-5'

/** Loading skeleton card — matches live card borders. */
export const skeletonCardSurfaceClass =
  'rounded-xl border border-border/90 bg-card p-4 shadow-sm sm:p-5'

/** Compact inner tiles inside cards. */
export const innerTileSurfaceClass = 'rounded-xl border border-border bg-background p-4'

/** Standard control radius (inputs, nav items). */
export const controlRadiusClass = 'rounded-lg'

/** Standard panel radius (cards, sections). */
export const panelRadiusClass = 'rounded-xl'

/** Compact dashboard widget card — dense but readable. */
export const dashboardCardClass =
  'rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5'

/** Dashboard section title. */
export const dashboardSectionTitleClass = 'text-sm font-semibold text-foreground'

/** Dashboard muted label text. */
export const dashboardMutedTextClass = 'text-xs text-muted-foreground sm:text-sm'
