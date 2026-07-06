'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SectionNavItem {
  id: string
  label: string
}

export function StickySectionNav({ sections }: { sections: SectionNavItem[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActiveId(id)
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [sections])

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-20 z-40 hidden border-b border-gray-200 bg-white/95 py-3 backdrop-blur-md lg:block"
    >
      <div className="mx-auto flex max-w-8xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              activeId === id
                ? 'bg-blue-50 text-[#0052ff]'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}
