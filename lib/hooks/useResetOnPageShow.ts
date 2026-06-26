'use client'

import { useEffect } from 'react'

/** Reset transient UI state when the browser restores a page from the back/forward cache. */
export function useResetOnPageShow(reset: () => void) {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        reset()
      }
    }

    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [reset])
}
