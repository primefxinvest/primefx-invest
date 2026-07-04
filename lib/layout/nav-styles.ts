/** Shared sidebar nav item classes — spacing, hover, and active states. */
export const NAV_ITEM_BASE =
  'flex w-full min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-200'

export const NAV_ITEM_ACTIVE = 'bg-[#0052ff] text-white shadow-sm'

export const NAV_ITEM_INACTIVE = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

export const NAV_ICON_SLOT =
  'flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]'

export const NAV_SUB_ITEM_BASE =
  'flex w-full min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200'

export const NAV_SUB_ITEM_ACTIVE = 'bg-blue-50 text-[#0052ff] font-semibold'

export const NAV_SUB_ITEM_INACTIVE = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

export const NAV_SECTION_DIVIDER = 'mt-5 space-y-1 border-t border-gray-200 pt-5'

/** Show labels in mobile drawer; hide on tablet icon rail; show on desktop */
export const NAV_LABEL_CLASS = 'min-w-0 flex-1 truncate max-md:inline md:hidden lg:inline'

/** Wallet submenu visible in mobile drawer and desktop expanded sidebar */
export const NAV_WALLET_SUBMENU_CLASS = 'ml-1 space-y-0.5 border-l border-gray-200 pl-2 max-md:block md:hidden lg:block'
