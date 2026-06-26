'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      expand={false}
      closeButton
      closeButtonPosition="right"
      className="primefx-toaster font-sans"
      offset={{ top: '4.5rem', right: '1rem' }}
      gap={10}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast: 'primefx-toast font-sans antialiased',
          title: 'primefx-toast-title font-sans',
          description: 'primefx-toast-description font-sans',
          actionButton: 'primefx-toast-action font-sans',
          cancelButton: 'primefx-toast-cancel font-sans',
          closeButton: 'primefx-toast-close font-sans',
          success: 'primefx-toast-success',
          error: 'primefx-toast-error',
          warning: 'primefx-toast-warning',
          info: 'primefx-toast-info',
        },
      }}
      {...props}
    />
  )
}
