export const chartAxisStyle = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fontSize: 11, fill: '#94a3b8' },
}

export const chartGridStyle = {
  strokeDasharray: '4 4',
  stroke: '#e5e7eb',
  vertical: true,
}

export const chartTooltipCursor = {
  stroke: '#0052ff',
  strokeWidth: 1,
  strokeDasharray: '4 4',
  strokeOpacity: 0.35,
}

export const chartTooltipWrapperProps = {
  wrapperStyle: { outline: 'none', zIndex: 50 },
  contentStyle: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    boxShadow: 'none',
  },
} as const

export const areaChartActiveDot = {
  r: 5,
  fill: '#0052ff',
  stroke: '#ffffff',
  strokeWidth: 2,
}
