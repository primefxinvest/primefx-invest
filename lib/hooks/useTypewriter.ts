'use client'

import { useEffect, useRef, useState } from 'react'

type UseTypewriterOptions = {
  /** Delay before typing starts (ms) */
  startDelay?: number
  /** Ms per character */
  speed?: number
  /** Skip animation and show full text immediately */
  skip?: boolean
  enabled?: boolean
}

export function useTypewriter(
  fullText: string,
  { startDelay = 600, speed = 18, skip = false, enabled = true }: UseTypewriterOptions = {}
) {
  const [displayed, setDisplayed] = useState(skip ? fullText : '')
  const [isDelaying, setIsDelaying] = useState(enabled && !skip)
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(skip)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!enabled || skip) {
      setDisplayed(fullText)
      setIsDelaying(false)
      setIsTyping(false)
      setIsComplete(true)
      return
    }

    setDisplayed('')
    setIsDelaying(true)
    setIsTyping(false)
    setIsComplete(false)
    indexRef.current = 0

    const delayTimer = window.setTimeout(() => {
      setIsDelaying(false)
      setIsTyping(true)
    }, startDelay)

    return () => window.clearTimeout(delayTimer)
  }, [fullText, enabled, skip, startDelay])

  useEffect(() => {
    if (!enabled || skip || isDelaying || isComplete) return

    if (indexRef.current >= fullText.length) {
      setIsTyping(false)
      setIsComplete(true)
      return
    }

    const timer = window.setTimeout(() => {
      indexRef.current += 1
      setDisplayed(fullText.slice(0, indexRef.current))
      if (indexRef.current >= fullText.length) {
        setIsTyping(false)
        setIsComplete(true)
      }
    }, speed)

    return () => window.clearTimeout(timer)
  }, [displayed, fullText, enabled, skip, isDelaying, isComplete, speed])

  return { displayed, isDelaying, isTyping, isComplete }
}
