/**
 * PrimeFx dashboard spacing system
 * - section spacing: 32px
 * - card spacing: 24px
 * - internal card padding: 20px (see surfaces.ts)
 * - mobile page padding: 16px
 */

/** Vertical rhythm between major dashboard sections (32px). */
export const pageStackClass = 'space-y-8'

/** Vertical rhythm inside a section (24px). */
export const sectionStackClass = 'space-y-6'

/** Content blocks within a section card. */
export const sectionContentGapClass = 'space-y-4'

/** Page header row gap. */
export const pageHeaderGapClass = 'gap-3'

/** Grid gap between cards (24px). */
export const gridGapClass = 'gap-6'

/** Mobile page horizontal/vertical padding (16px). */
export const pagePaddingClass = 'px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6'

/** Section header bottom margin. */
export const sectionHeaderMbClass = 'mb-4'

/** Bottom safe area when mobile nav is visible. */
export const mobileNavBottomPadClass =
  'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0'
