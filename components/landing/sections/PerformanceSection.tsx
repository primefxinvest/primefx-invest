'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  areaChartActiveDot,
  chartAxisStyle,
  chartGridStyle,
  ChartTooltipContent,
  chartTooltipCursor,
  chartTooltipWrapperProps,
} from '@/components/charts/ChartTooltip'

const chartData = [
  { month: 'Jan', primeai: 100, sp500: 100 },
  { month: 'Feb', primeai: 108, sp500: 102 },
  { month: 'Mar', primeai: 115, sp500: 104 },
  { month: 'Apr', primeai: 122, sp500: 106 },
  { month: 'May', primeai: 130, sp500: 108 },
  { month: 'Jun', primeai: 138, sp500: 110 },
  { month: 'Jul', primeai: 148, sp500: 112 },
  { month: 'Aug', primeai: 155, sp500: 113 },
  { month: 'Sep', primeai: 162, sp500: 115 },
  { month: 'Oct', primeai: 170, sp500: 116 },
  { month: 'Nov', primeai: 178, sp500: 118 },
  { month: 'Dec', primeai: 185, sp500: 120 },
]

const statValues = [
  { value: '+24.8%', color: 'text-emerald-500' },
  { value: '92%', color: 'text-[#0052ff]' },
  { value: '$250M+', color: 'text-emerald-500' },
  { value: '120K+', color: 'text-[#0052ff]' },
]

const liveMarkets = [
  { name: 'EUR/USD', price: '1.0842', change: '+0.32%', up: true },
  { name: 'Gold', price: '$2,341', change: '+1.12%', up: true },
  { name: 'Bitcoin', price: '$67,420', change: '+2.45%', up: true },
  { name: 'Apple', price: '$189.30', change: '-0.18%', up: false },
  { name: 'Tesla', price: '$248.50', change: '+1.87%', up: true },
]

export default function PerformanceSection() {
  const t = useTranslations('landing.performance')
  const [timeframe, setTimeframe] = useState('1Y')
  const gradientId = useId().replace(/:/g, '')
  const timeframes = t.raw('timeframes') as string[]

  const stats = [
    { ...statValues[0], label: t('statReturn') },
    { ...statValues[1], label: t('statWinRate') },
    { ...statValues[2], label: t('statAum') },
    { ...statValues[3], label: t('statInvestors') },
  ]

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest text-[#0052ff]">{t('eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900">{t('title')}</h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{t('subtitle')}</p>
            <Link
              href="/market-insights"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
            >
              {t('viewReport')}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="mt-1 text-[10px] leading-tight text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">{t('comparison')}</h3>
                <div className="flex gap-1">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        timeframe === tf
                          ? 'bg-[#0052ff] text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0052ff" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0052ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis dataKey="month" {...chartAxisStyle} dy={8} />
                  <YAxis {...chartAxisStyle} width={40} />
                  <Tooltip
                    {...chartTooltipWrapperProps}
                    cursor={chartTooltipCursor}
                    content={
                      <ChartTooltipContent
                        valueFormatter={(value) => `${Number(value).toFixed(1)}`}
                        showSeriesDot
                      />
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="primeai"
                    name={t('primeaiReturn')}
                    stroke="#0052ff"
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={areaChartActiveDot}
                  />
                  <Line
                    type="monotone"
                    dataKey="sp500"
                    name={t('sp500')}
                    stroke="#9ca3af"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4, fill: '#9ca3af', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900">{t('liveMarkets')}</h3>
              <p className="mt-1 text-xs text-gray-500">{t('liveMarketsSubtitle')}</p>
              <div className="mt-4 space-y-3">
                {liveMarkets.map((market) => (
                  <div
                    key={market.name}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{market.name}</p>
                      <p className="text-[10px] text-gray-500">{market.price}</p>
                    </div>
                    <span
                      className={`text-xs font-bold ${market.up ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {market.change}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/market-insights"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0052ff] hover:underline"
              >
                {t('viewOpportunities')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
