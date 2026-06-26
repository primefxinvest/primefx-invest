'use client'

import { useMemo, useRef } from 'react'

interface MapPoint {
  lat: number
  lng: number
  label?: string
}

interface WorldMapProps {
  dots?: Array<{ start: MapPoint; end: MapPoint }>
  lineColor?: string
  className?: string
}

function projectPoint(lat: number, lng: number) {
  const x = (lng + 180) * (800 / 360)
  const y = (90 - lat) * (400 / 180)
  return { x, y }
}

function isLand(lat: number, lng: number) {
  const regions = [
    { lat: [15, 72], lng: [-170, -50] },
    { lat: [-55, 15], lng: [-82, -34] },
    { lat: [36, 72], lng: [-25, 45] },
    { lat: [-35, 38], lng: [-20, 55] },
    { lat: [5, 42], lng: [25, 65] },
    { lat: [-45, -10], lng: [110, 155] },
    { lat: [-45, -10], lng: [165, 180] },
  ]

  return regions.some(
    (r) => lat >= r.lat[0] && lat <= r.lat[1] && lng >= r.lng[0] && lng <= r.lng[1]
  )
}

function buildDottedMapSvg() {
  const dots: string[] = []

  for (let lat = -56; lat <= 72; lat += 5) {
    for (let lng = -180; lng < 180; lng += 5) {
      if (!isLand(lat, lng)) continue
      const { x, y } = projectPoint(lat, lng)
      dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="#94a3b8" fill-opacity="0.45"/>`)
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">${dots.join('')}</svg>`
}

function createCurvedPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const midX = (start.x + end.x) / 2
  const midY = Math.min(start.y, end.y) - 50
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`
}

export function WorldMap({ dots = [], lineColor = '#0052ff', className }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dottedMap = useMemo(() => buildDottedMapSvg(), [])

  return (
    <div
      className={`relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-slate-50 ${className ?? ''}`}
    >
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(dottedMap)}`}
        className="pointer-events-none h-full w-full select-none [mask-image:linear-gradient(to_bottom,transparent,white_12%,white_88%,transparent)]"
        alt="World map"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      >
        <defs>
          <linearGradient id="portfolio-map-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="50%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng)
          const endPoint = projectPoint(dot.end.lat, dot.end.lng)
          const path = createCurvedPath(startPoint, endPoint)

          return (
            <g key={`path-group-${i}`}>
              <path
                d={path}
                fill="none"
                stroke="url(#portfolio-map-gradient)"
                strokeWidth="1"
                strokeDasharray="1000"
                strokeDashoffset="1000"
                opacity="0.85"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1000"
                  to="0"
                  dur="1.2s"
                  begin={`${0.25 * i}s`}
                  fill="freeze"
                />
              </path>
            </g>
          )
        })}

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng)
          const endPoint = projectPoint(dot.end.lat, dot.end.lng)

          return (
            <g key={`points-group-${i}`}>
              {[startPoint, endPoint].map((point, j) => (
                <g key={j}>
                  <circle cx={point.x} cy={point.y} r="2.5" fill={lineColor} opacity="0.9" />
                  <circle cx={point.x} cy={point.y} r="2.5" fill={lineColor} opacity="0.4">
                    <animate attributeName="r" from="2.5" to="8" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
