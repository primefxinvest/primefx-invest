'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Layers,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import {
  AdminPlanBarTooltip,
  AdminTierPieTooltip,
  AdminVolumeTooltip,
  formatChartMonth,
} from '@/components/admin/AdminChartTooltips'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  chartAxisStyle,
  chartGridStyle,
  chartTooltipCursor,
  chartTooltipWrapperProps,
} from '@/components/charts/ChartTooltip'
import { formatCurrency } from '@/lib/data/format'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  totalUsers: number
  totalInvestments: number
  activeInvestments: number
  activePlans: number
  planDistribution: Array<{ name: string; investors: number; weeklyRoi: number }>
  tierDistribution: Record<string, number>
  countryDistribution: Record<string, number>
  completedDeposits: number
  completedWithdrawals: number
  netRevenue: number
  pendingDeposits: number
  pendingWithdrawals: number
  kycPending: number
  monthlyVolume: Array<{ month: string; deposits: number; withdrawals: number }>
}

const TIER_COLORS = ['#0052ff', '#10b981', '#f97316', '#8b5cf6', '#ec4899']
const PLAN_BAR_COLOR = '#10b981'
const PLAN_BAR_ACTIVE = '#059669'

const tooltipProps = {
  ...chartTooltipWrapperProps,
  cursor: { fill: 'rgba(0, 82, 255, 0.06)', radius: 6 },
  allowEscapeViewBox: { x: true, y: true },
}

const barTooltipProps = {
  ...chartTooltipWrapperProps,
  cursor: chartTooltipCursor,
  allowEscapeViewBox: { x: true, y: true },
}

export function AdminAnalyticsView({ data }: { data: AnalyticsData }) {
  const [activeTierIndex, setActiveTierIndex] = useState<number | undefined>(undefined)
  const [activePlanIndex, setActivePlanIndex] = useState<number | undefined>(undefined)
  const [hoveredPlanName, setHoveredPlanName] = useState<string | null>(null)

  const totalTierUsers = Object.values(data.tierDistribution).reduce((a, b) => a + b, 0) || 1
  const totalPlanInvestors =
    data.planDistribution.reduce((sum, plan) => sum + plan.investors, 0) || 1

  const monthlyVolume = useMemo(
    () =>
      data.monthlyVolume.map((row) => ({
        ...row,
        label: formatChartMonth(row.month),
      })),
    [data.monthlyVolume]
  )

  const tierChartData = useMemo(
    () =>
      Object.entries(data.tierDistribution).map(([name, value], index) => ({
        name,
        value,
        color: TIER_COLORS[index % TIER_COLORS.length],
        percent: Math.round((value / totalTierUsers) * 100),
      })),
    [data.tierDistribution, totalTierUsers]
  )

  const planChartData = useMemo(
    () =>
      data.planDistribution.map((plan) => ({
        name: plan.name,
        investors: plan.investors,
        roi: plan.weeklyRoi,
        share: Math.round((plan.investors / totalPlanInvestors) * 100),
      })),
    [data.planDistribution, totalPlanInvestors]
  )

  const metrics = [
    { label: 'Total Users', value: data.totalUsers.toLocaleString(), icon: Users },
    { label: 'Net Revenue', value: formatCurrency(data.netRevenue), icon: DollarSign },
    { label: 'Total Deposits', value: formatCurrency(data.completedDeposits), icon: ArrowUpRight },
    {
      label: 'Total Withdrawals',
      value: formatCurrency(data.completedWithdrawals),
      icon: ArrowDownRight,
    },
    { label: 'Active Investments', value: data.activeInvestments.toLocaleString(), icon: TrendingUp },
    { label: 'Active Plans', value: data.activePlans.toLocaleString(), icon: Layers },
    { label: 'Pending KYC', value: data.kycPending.toLocaleString(), icon: Wallet },
    {
      label: 'Pending Txns',
      value: (data.pendingDeposits + data.pendingWithdrawals).toLocaleString(),
      icon: Wallet,
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics Center"
        description="Hover charts for details — interactive platform growth and distribution"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-xl font-bold">{metric.value}</p>
                </div>
                <Icon className="h-7 w-7 text-primary opacity-20" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-1 text-lg font-bold">Monthly volume</h3>
          <p className="mb-4 text-xs text-muted-foreground">Last 6 months · hover bars for breakdown</p>
          <div className="h-80">
            {monthlyVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyVolume}
                  margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                  barCategoryGap={monthlyVolume.length === 1 ? '35%' : '18%'}
                  barGap={6}
                >
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis dataKey="label" {...chartAxisStyle} dy={8} />
                  <YAxis
                    {...chartAxisStyle}
                    width={52}
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${v}`
                    }
                  />
                  <Tooltip
                    {...tooltipProps}
                    content={<AdminVolumeTooltip />}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="deposits"
                    fill="#0052ff"
                    name="Deposits"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                    activeBar={{ fill: '#0041cc', opacity: 1 }}
                    animationDuration={700}
                  />
                  <Bar
                    dataKey="withdrawals"
                    fill="#f97316"
                    name="Withdrawals"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                    activeBar={{ fill: '#ea580c', opacity: 1 }}
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No completed volume data yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-1 text-lg font-bold">Investor tier mix</h3>
          <p className="mb-4 text-xs text-muted-foreground">Hover segments for investor counts</p>
          <div className="h-80">
            {tierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={activeTierIndex !== undefined ? 98 : 92}
                    paddingAngle={3}
                    activeIndex={activeTierIndex}
                    activeShape={{ outerRadius: 104, stroke: '#fff', strokeWidth: 2 }}
                    onMouseEnter={(_, index) => setActiveTierIndex(index)}
                    onMouseLeave={() => setActiveTierIndex(undefined)}
                    animationDuration={700}
                  >
                    {tierChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke="transparent"
                        opacity={
                          activeTierIndex === undefined || activeTierIndex === index ? 1 : 0.45
                        }
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    {...chartTooltipWrapperProps}
                    content={<AdminTierPieTooltip />}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={48}
                    formatter={(value, entry) => {
                      const payload = entry.payload as { percent?: number } | undefined
                      return (
                        <span className="text-sm text-muted-foreground">
                          {value}{' '}
                          <span className="font-semibold text-foreground">
                            ({payload?.percent ?? 0}%)
                          </span>
                        </span>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No tier data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-1 text-lg font-bold">Plan distribution</h3>
          <p className="mb-4 text-xs text-muted-foreground">Hover rows to highlight share</p>
          <div className="space-y-4">
            {data.planDistribution.map((plan) => {
              const percent = Math.round((plan.investors / totalPlanInvestors) * 100)
              const isHovered = hoveredPlanName === plan.name
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    isHovered && 'bg-primary/5'
                  )}
                  onMouseEnter={() => setHoveredPlanName(plan.name)}
                  onMouseLeave={() => setHoveredPlanName(null)}
                >
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">
                      {plan.name}{' '}
                      <span className="font-normal text-muted-foreground">
                        ({plan.weeklyRoi}% weekly)
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {plan.investors.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isHovered ? 'bg-emerald-600' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-1 text-lg font-bold">Plan investors</h3>
          <p className="mb-4 text-xs text-muted-foreground">Horizontal bars · hover for ROI details</p>
          <div className="h-72">
            {planChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={planChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  barCategoryGap="22%"
                >
                  <CartesianGrid {...chartGridStyle} horizontal={false} />
                  <XAxis
                    type="number"
                    {...chartAxisStyle}
                    tickFormatter={(v) => v.toLocaleString()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    {...chartAxisStyle}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    {...barTooltipProps}
                    content={<AdminPlanBarTooltip />}
                  />
                  <Bar
                    dataKey="investors"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                    animationDuration={700}
                    onMouseEnter={(_, index) => setActivePlanIndex(index)}
                    onMouseLeave={() => setActivePlanIndex(undefined)}
                  >
                    {planChartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={activePlanIndex === index ? PLAN_BAR_ACTIVE : PLAN_BAR_COLOR}
                        opacity={activePlanIndex === undefined || activePlanIndex === index ? 1 : 0.5}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No plan investor data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold">Tier breakdown</h3>
          <div className="space-y-4">
            {Object.entries(data.tierDistribution).map(([tier, count], index) => {
              const percent = Math.round((count / totalTierUsers) * 100)
              const color = TIER_COLORS[index % TIER_COLORS.length]
              return (
                <div key={tier}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {tier}
                    </span>
                    <span className="text-muted-foreground">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold">Geographic distribution</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.countryDistribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([country, count]) => (
                <div
                  key={country}
                  className="rounded-lg border border-transparent bg-background p-3 text-sm transition-colors hover:border-border hover:shadow-sm"
                >
                  <p className="font-medium">{country}</p>
                  <p className="text-muted-foreground">{count} users</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
