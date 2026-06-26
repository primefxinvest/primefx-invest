'use client'

import * as React from 'react'
import { Select } from '@base-ui/react/select'
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

function SelectRoot({ ...props }: Select.Root.Props<string>) {
  return <Select.Root {...props} />
}

function SelectGroup({ ...props }: Select.Group.Props) {
  return <Select.Group {...props} />
}

function SelectValue({ className, ...props }: Select.Value.Props) {
  return (
    <Select.Value
      data-slot="select-value"
      className={cn('flex flex-1 truncate text-left', className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: Select.Trigger.Props & {
  size?: 'sm' | 'default'
}) {
  return (
    <Select.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'group inline-flex w-fit min-w-[8.5rem] items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm outline-none transition-colors',
        'hover:bg-secondary/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[size=sm]:h-8 data-[size=sm]:px-3 data-[size=sm]:text-xs',
        'data-[size=default]:h-10',
        className
      )}
      {...props}
    >
      {children}
      <Select.Icon className="flex shrink-0 text-muted-foreground transition-transform group-data-[popup-open]:rotate-180">
        <ChevronDown className="size-4" />
      </Select.Icon>
    </Select.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  align = 'end',
  sideOffset = 6,
  header,
  ...props
}: Select.Popup.Props &
  Pick<Select.Positioner.Props, 'side' | 'align' | 'sideOffset'> & {
    header?: React.ReactNode
  }) {
  return (
    <Select.Portal>
      <Select.Positioner side={side} align={align} sideOffset={sideOffset} className="z-50">
        <Select.Popup
          data-slot="select-content"
          className={cn(
            'origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-lg',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            'transition-[transform,opacity] duration-150',
            className
          )}
          {...props}
        >
          {header}
          <SelectScrollUpButton />
          <Select.List className="max-h-64 overflow-y-auto p-1">{children}</Select.List>
          <SelectScrollDownButton />
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  )
}

function SelectLabel({ className, ...props }: Select.Label.Props) {
  return (
    <Select.Label
      data-slot="select-label"
      className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: Select.Item.Props) {
  return (
    <Select.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm outline-none',
        'text-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center text-primary">
        <Check className="size-4" />
      </Select.ItemIndicator>
    </Select.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <Select.ScrollUpArrow
      className={cn('flex cursor-default items-center justify-center py-1 text-muted-foreground', className)}
      {...props}
    >
      <ChevronUp className="size-4" />
    </Select.ScrollUpArrow>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <Select.ScrollDownArrow
      className={cn('flex cursor-default items-center justify-center py-1 text-muted-foreground', className)}
      {...props}
    >
      <ChevronDown className="size-4" />
    </Select.ScrollDownArrow>
  )
}

function SelectSearch({
  value,
  onValueChange,
  placeholder = 'Search...',
  className,
  inputRef,
}: {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
}) {
  return (
    <div
      data-slot="select-search"
      className={cn('border-b border-border bg-card p-2', className)}
      onKeyDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 shadow-sm">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  )
}

function SelectEmpty({ className, children = 'No results found', ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-empty"
      className={cn('px-2.5 py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  SelectRoot,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSearch,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
