/** Shared sidebar nav item classes — spacing, hover, and active states. */
export const NAV_ITEM_BASE =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors'

export const NAV_ITEM_ACTIVE = 'bg-[#0052ff] text-white shadow-sm'

export const NAV_ITEM_INACTIVE = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

export const NAV_ICON_SLOT = 'flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4'

export const NAV_SUB_ITEM_BASE =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors'

export const NAV_SUB_ITEM_ACTIVE = 'bg-blue-50 text-[#0052ff]'

export const NAV_SUB_ITEM_INACTIVE = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

export const NAV_SECTION_DIVIDER = 'mt-4 space-y-1 border-t border-gray-200 pt-4'
