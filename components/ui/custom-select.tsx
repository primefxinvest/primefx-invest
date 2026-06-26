'use client'

import { useMemo, useRef, useState } from 'react'
import {
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectRoot,
  SelectSearch,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
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
  /** Enable search. `'auto'` turns it on when option count meets the threshold. */
  searchable?: boolean | 'auto'
  searchThreshold?: number
}

function filterOptions(options: SelectOption[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return options

  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(normalized) ||
      option.value.toLowerCase().includes(normalized)
  )
}

export function CustomSelect({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  disabled,
  className,
  triggerClassName,
  size = 'default',
  align = 'end',
  searchable = 'auto',
  searchThreshold = DEFAULT_SEARCH_THRESHOLD,
}: CustomSelectProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isSearchable =
    searchable === 'auto' ? options.length >= searchThreshold : Boolean(searchable)

  const filteredOptions = useMemo(
    () => (isSearchable ? filterOptions(options, searchQuery) : options),
    [isSearchable, options, searchQuery]
  )

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchQuery('')
      return
    }

    if (isSearchable) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }

  return (
    <SelectRoot
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => {
        if (next != null) onValueChange?.(next)
      }}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      items={filteredOptions.map((option) => ({ value: option.value, label: option.label }))}
    >
      <SelectTrigger size={size} className={cn(className, triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        align={align}
        header={
          isSearchable ? (
            <SelectSearch
              inputRef={searchInputRef}
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder={searchPlaceholder}
            />
          ) : undefined
        }
      >
        {filteredOptions.length === 0 ? (
          <SelectEmpty />
        ) : (
          filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </SelectRoot>
  )
}
