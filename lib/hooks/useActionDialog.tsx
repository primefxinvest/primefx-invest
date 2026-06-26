'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogViewport,
} from '@/components/ui/dialog'

type PromptOptions = {
  title: string
  description?: string
  label?: string
  placeholder?: string
  confirmLabel?: string
  required?: boolean
  requiredMessage?: string
}

type ConfirmOptions = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type DialogState =
  | ({ kind: 'prompt' } & PromptOptions & { resolve: (value: string | null) => void })
  | ({ kind: 'confirm' } & ConfirmOptions & { resolve: (confirmed: boolean) => void })

export function useActionDialog() {
  const [state, setState] = useState<DialogState | null>(null)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback((result: string | null | boolean) => {
    setState((current) => {
      if (!current) return null
      if (current.kind === 'prompt') {
        current.resolve(typeof result === 'string' || result === null ? result : null)
      } else {
        current.resolve(result === true)
      }
      return null
    })
    setInput('')
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setInput('')
      setState({ kind: 'prompt', ...options, resolve })
    })
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ kind: 'confirm', ...options, resolve })
    })
  }, [])

  const handleOpenChange = (open: boolean) => {
    if (!open) close(state?.kind === 'confirm' ? false : null)
  }

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (state?.kind !== 'prompt') return

    const trimmed = input.trim()
    if (state.required && !trimmed) return

    close(trimmed || null)
  }

  const ActionDialog = () => {
    if (!state) return null

    if (state.kind === 'confirm') {
      return (
        <DialogRoot open onOpenChange={handleOpenChange}>
          <DialogPortal>
            <DialogBackdrop />
            <DialogViewport>
              <DialogPopup>
                <DialogClose onClick={() => close(false)} />
                <DialogTitle>{state.title}</DialogTitle>
                <DialogDescription>{state.description}</DialogDescription>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => close(false)}>
                    {state.cancelLabel ?? 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    variant={state.destructive ? 'destructive' : 'default'}
                    onClick={() => close(true)}
                  >
                    {state.confirmLabel ?? 'Confirm'}
                  </Button>
                </DialogFooter>
              </DialogPopup>
            </DialogViewport>
          </DialogPortal>
        </DialogRoot>
      )
    }

    const canSubmit = !state.required || input.trim().length > 0

    return (
      <DialogRoot open onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport>
            <DialogPopup>
              <DialogClose onClick={() => close(null)} />
              <form onSubmit={handlePromptSubmit}>
                <DialogTitle>{state.title}</DialogTitle>
                {state.description ? (
                  <DialogDescription>{state.description}</DialogDescription>
                ) : null}
                <div className="mt-4">
                  {state.label ? (
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      {state.label}
                    </label>
                  ) : null}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={state.placeholder}
                    autoFocus
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  {state.required && !input.trim() ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {state.requiredMessage ?? 'This field is required.'}
                    </p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => close(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {state.confirmLabel ?? 'Submit'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </DialogRoot>
    )
  }

  return { prompt, confirm, ActionDialog }
}
