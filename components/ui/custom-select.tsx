'use client'

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type CSSProperties,
  type ForwardedRef,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronUp, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface CustomSelectRef {
  focus: () => void
  blur: () => void
  open: () => void
  close: () => void
}

const DEFAULT_SEARCH_THRESHOLD = 5

interface CustomSelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  size?: 'sm' | 'default'
  align?: 'start' | 'center' | 'end'
  searchable?: boolean | 'auto'
  searchThreshold?: number
  isClearable?: boolean
  isLoading?: boolean
  error?: boolean
  /** Portal dropdown to document.body to avoid clipping in modals. Default: true */
  usePortal?: boolean
  id?: string
  /** Accessible name when no visible label is associated. */
  ariaLabel?: string
  /** ID of an element that labels this control. */
  ariaLabelledBy?: string
}

function CustomSelectInner(
  {
    value,
    defaultValue,
    onValueChange,
    options,
    placeholder = 'Select option',
    searchPlaceholder = 'Search...',
    disabled = false,
    className,
    triggerClassName,
    size = 'default',
    searchable = 'auto',
    searchThreshold = DEFAULT_SEARCH_THRESHOLD,
    isClearable = false,
    isLoading = false,
    error = false,
    usePortal = true,
    id,
    ariaLabel,
    ariaLabelledBy,
  }: CustomSelectProps,
  ref: ForwardedRef<CustomSelectRef>
) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const resolvedValue = value ?? internalValue

  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [openAbove, setOpenAbove] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const optionRefs = useRef<(HTMLLIElement | null)[]>([])

  const isSearchable =
    searchable === 'auto' ? options.length >= searchThreshold : Boolean(searchable)

  const filteredOptions = isSearchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const selectedOption = options.find((opt) => opt.value === resolvedValue)

  useImperativeHandle(ref, () => ({
    focus: () => buttonRef.current?.focus(),
    blur: () => {
      buttonRef.current?.blur()
      setIsOpen(false)
    },
    open: () => {
      if (!disabled && !isLoading) setIsOpen(true)
    },
    close: () => setIsOpen(false),
  }))

  useEffect(() => {
    if (usePortal) setPortalTarget(document.body)
  }, [usePortal])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      const isInsideContainer = containerRef.current?.contains(target)
      const isInsideList = listRef.current?.contains(target)
      if (!isInsideContainer && !isInsideList) setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('touchstart', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isOpen])

  const updatePosition = useCallback(() => {
    if (!isOpen || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const shouldFlip = spaceBelow < 220 && spaceAbove > spaceBelow

    setOpenAbove(shouldFlip)

    if (usePortal && portalTarget) {
      setMenuStyle({
        position: 'fixed',
        top: shouldFlip ? 'auto' : `${rect.bottom + 4}px`,
        bottom: shouldFlip ? `${viewportHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      })
    }
  }, [isOpen, portalTarget, usePortal])

  useEffect(() => {
    if (!isOpen) return

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (isOpen && highlightIndex >= 0 && optionRefs.current[highlightIndex]) {
      optionRefs.current[highlightIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isOpen, highlightIndex])

  useEffect(() => {
    setHighlightIndex(filteredOptions.length > 0 ? 0 : -1)
  }, [searchTerm, isOpen, filteredOptions.length])

  useEffect(() => {
    if (isOpen && isSearchable) {
      const timer = window.setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
    if (!isOpen) setSearchTerm('')
  }, [isOpen, isSearchable])

  const commitChange = (next: string) => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (disabled || isLoading) return
    setIsOpen((prev) => !prev)
  }

  const handleSelect = (optionValue: string) => {
    commitChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
    buttonRef.current?.focus()
  }

  const handleClear = (e?: { stopPropagation: () => void }) => {
    e?.stopPropagation()
    commitChange('')
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isLoading) return

    if (e.key === 'Tab') {
      setIsOpen(false)
      return
    }

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((prev) => (prev + 1 < filteredOptions.length ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredOptions.length - 1))
        break
      case 'Home':
        e.preventDefault()
        setHighlightIndex(0)
        break
      case 'End':
        e.preventDefault()
        setHighlightIndex(filteredOptions.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
          handleSelect(filteredOptions[highlightIndex].value)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
    }
  }

  const dropdownPanel = (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        openAbove ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2',
        !usePortal && 'absolute left-0 right-0 z-[99]',
        !usePortal && (openAbove ? 'bottom-full mb-2' : 'top-full mt-2')
      )}
      style={usePortal ? { ...menuStyle, maxHeight: '16rem' } : { maxHeight: '16rem' }}
    >
      {isSearchable ? (
        <div className="border-b border-border bg-muted/40 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              aria-label="Search options"
              className={cn(
                'h-9 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs font-medium text-foreground',
                'placeholder:text-muted-foreground',
                'outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30'
              )}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      ) : null}

      <ul
        ref={listRef}
        role="listbox"
        className="max-h-60 overflow-y-auto py-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => {
            const isSelected = option.value === resolvedValue
            const isHighlighted = highlightIndex === index

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                ref={(el) => {
                  optionRefs.current[index] = el
                }}
                onClick={() => !option.disabled && handleSelect(option.value)}
                onMouseEnter={() => !option.disabled && setHighlightIndex(index)}
                onMouseLeave={() => setHighlightIndex(-1)}
                className={cn(
                  'relative cursor-pointer select-none px-3 py-2.5 transition-colors',
                  size === 'sm' ? 'text-xs' : 'text-sm',
                  option.disabled && 'cursor-not-allowed opacity-40',
                  isHighlighted && !option.disabled && 'bg-primary/10 text-primary',
                  isSelected && 'bg-primary/5 font-medium text-primary',
                  !isHighlighted && !isSelected && 'text-foreground/80'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{option.label}</span>
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </div>
              </li>
            )
          })
        ) : (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">
            {searchTerm ? 'No results' : 'No options'}
          </li>
        )}
      </ul>
    </div>
  )

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled || isLoading}
        className={cn(
          'relative flex w-full items-center justify-between rounded-lg border border-border bg-card text-left font-medium text-foreground outline-none transition-all duration-150',
          size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
          !disabled && !error && 'hover:border-muted-foreground/40',
          isOpen && !error && !disabled && 'border-primary ring-2 ring-ring/30',
          !error && 'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30',
          error && 'border-destructive/60 focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/30',
          error && isOpen && 'border-destructive ring-2 ring-destructive/30',
          disabled && 'cursor-not-allowed bg-muted/30 opacity-50',
          triggerClassName
        )}
      >
        <span
          className={cn(
            'mr-6 block truncate',
            selectedOption ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <>
              {isClearable && resolvedValue && !disabled ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear selection"
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleClear(e)
                    }
                  }}
                  className="mr-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-destructive focus:outline-none"
                >
                  <X className="size-3.5" />
                </span>
              ) : null}
              <span className="text-muted-foreground">
                {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </>
          )}
        </div>
      </button>

      {isOpen ? (usePortal && portalTarget ? createPortal(dropdownPanel, portalTarget) : dropdownPanel) : null}
    </div>
  )
}

export const CustomSelect = forwardRef(CustomSelectInner)

CustomSelect.displayName = 'CustomSelect'
