/** Shared card and layout surface tokens — semantic theme classes only. */

/** Primary dashboard card (profile, settings, rewards, community). */
export const cardSurfaceClass =
  'rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5'

/** Metric / status cards on dashboard and wallet. */
export const statusCardSurfaceClass =
  'rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5'

/** Admin portal cards — same padding as status cards. */
export const statusCardAdminSurfaceClass =
  'rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5'

/** Loading skeleton card — matches live card borders. */
export const skeletonCardSurfaceClass =
  'rounded-xl border border-border/90 bg-card p-4 shadow-sm sm:p-5'

/** Compact inner tiles inside cards. */
export const innerTileSurfaceClass = 'rounded-xl border border-border bg-background p-4'

/** Standard control radius (inputs, nav items). */
export const controlRadiusClass = 'rounded-lg'

/** Standard panel radius (cards, sections). */
export const panelRadiusClass = 'rounded-xl'

/** Compact dashboard widget card — dense but readable (20px padding). */
export const dashboardCardClass =
  'rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5'

/** Dashboard section title — primary hierarchy. */
export const dashboardSectionTitleClass = 'text-sm font-semibold tracking-tight text-foreground sm:text-base'

/** Dashboard section subtitle / link row. */
export const dashboardSectionSubtitleClass = 'text-xs text-muted-foreground sm:text-sm'

/** Dashboard muted label text. */
export const dashboardMutedTextClass = 'text-xs text-muted-foreground sm:text-sm'

/** Standard dashboard icon container (cards, quick actions). */
export const dashboardIconBoxClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10'
