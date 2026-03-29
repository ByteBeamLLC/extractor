"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BarChart3,
  Users,
  MousePointerClick,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  Eye,
  ArrowRight,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts"

/* ── Types ── */

type DashboardData = {
  dateRange: { from: string; to: string; days: number }
  error?: string
  [key: string]: unknown
}

/* ── Colors ── */

const BLUE = "#2782ff"
const INDIGO = "#6366f1"
const EMERALD = "#10b981"
const AMBER = "#f59e0b"
const ROSE = "#f43f5e"
const COLORS = [BLUE, INDIGO, EMERALD, AMBER, ROSE, "#8b5cf6", "#06b6d4", "#ec4899"]

/* ── Small components ── */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <div className="border rounded-xl p-4 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-semibold mt-8 mb-3">{title}</h2>
  )
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`border rounded-xl p-4 bg-card ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  )
}

function FunnelStep({
  label,
  count,
  rate,
  isLast,
}: {
  label: string
  count: number
  rate?: number
  isLast?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium truncate">{label}</span>
          <span className="text-xs font-bold">{count.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${rate ?? 100}%` }}
          />
        </div>
        {rate !== undefined && (
          <span className="text-[10px] text-muted-foreground">{rate.toFixed(1)}%</span>
        )}
      </div>
      {!isLast && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
    </div>
  )
}

function RankTable({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  if (!data?.length) return <p className="text-xs text-muted-foreground">No data</p>
  const max = data[0]?.value || 1
  return (
    <div className="space-y-1.5">
      {data.slice(0, 10).map((row) => (
        <div key={row.name} className="flex items-center gap-2 text-xs">
          <span className="w-[45%] truncate font-medium" title={row.name}>
            {row.name || "(none)"}
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500/70"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="text-muted-foreground w-10 text-right tabular-nums">
            {row.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Helper: safe extract from Mixpanel results ── */

function extractSeries(data: unknown): { date: string; value: number }[] {
  if (!data || typeof data !== "object") return []
  const results = (data as Record<string, unknown>).results
  if (!results || typeof results !== "object") return []

  const series = Object.values(results as Record<string, unknown>)[0]
  if (!series || typeof series !== "object") return []

  return Object.entries(series as Record<string, number>).map(([date, value]) => ({
    date: date.slice(5),
    value: typeof value === "number" ? value : 0,
  }))
}

function extractBreakdown(data: unknown): { name: string; value: number }[] {
  if (!data || typeof data !== "object") return []
  const results = (data as Record<string, unknown>).results
  if (!results || typeof results !== "object") return []

  const series = Object.values(results as Record<string, unknown>)[0]
  if (!series || typeof series !== "object") return []

  return Object.entries(series as Record<string, number>)
    .filter(([name]) => name !== "$overall")
    .map(([name, value]) => ({ name: name || "(none)", value }))
    .sort((a, b) => b.value - a.value)
}

function extractFunnelSteps(data: unknown): { label: string; count: number }[] {
  if (!data || typeof data !== "object") return []
  const results = (data as Record<string, unknown>).results
  if (!results) return []

  if (Array.isArray(results)) {
    return results.map((step: { name?: string; count?: number }, i: number) => ({
      label: step.name || `Step ${i + 1}`,
      count: step.count || 0,
    }))
  }

  const steps = (results as Record<string, unknown>).steps
  if (Array.isArray(steps)) {
    return steps.map((step: { event?: string; count?: number }, i: number) => ({
      label: step.event || `Step ${i + 1}`,
      count: step.count || 0,
    }))
  }

  return []
}

function extractMetrics(data: unknown): Record<string, number> {
  if (!data || typeof data !== "object") return {}
  const results = (data as Record<string, unknown>).results
  if (!results || typeof results !== "object") return {}

  const metrics: Record<string, number> = {}
  for (const [key, val] of Object.entries(results as Record<string, unknown>)) {
    const cleanKey = key.replace(/ - (Total|Unique)$/, "")
    if (typeof val === "number") {
      metrics[cleanKey] = val
    } else if (typeof val === "object" && val !== null) {
      const values = Object.values(val as Record<string, number>)
      metrics[cleanKey] = values.reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0)
    }
  }
  return metrics
}

/* ── Main Dashboard ── */

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/dashboard?days=${days}`)
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setData(json)
      }
    } catch (e) {
      setError("Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="border border-red-200 bg-red-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Configuration Required</h2>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-sm text-red-600 mt-3">
            Get your API Secret from{" "}
            <a
              href="https://mixpanel.com/settings/project"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Mixpanel Project Settings
            </a>
            , then add it as an environment variable in Vercel.
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Extract all data from flat response
  const sessions = extractSeries(data.sessionsOverTime)
  const trafficSources = extractBreakdown(data.trafficSources)
  const topPages = extractBreakdown(data.topPages)
  const toolViews = extractBreakdown(data.toolViews)
  const signups = extractSeries(data.signupsOverTime)
  const ctaClicks = extractBreakdown(data.ctaClicks)
  const conversionFunnel = extractFunnelSteps(data.conversionFunnel)
  const hwtFunnel = extractFunnelSteps(data.hwtFunnel)
  const lpData = extractBreakdown(data.lpPerformance)
  const activation = extractMetrics(data.activationMetrics)

  // Compute totals from sessions series
  const totalSessions = sessions.reduce((s, d) => s + d.value, 0)
  const totalPageViews = topPages.reduce((s, d) => s + d.value, 0)

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {data.dateRange.from} — {data.dateRange.to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="text-sm border rounded-lg px-3 py-1.5 bg-card"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button
            onClick={fetchData}
            className="p-1.5 border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <StatCard label="Sessions" value={totalSessions.toLocaleString()} icon={Users} />
        <StatCard label="Page Views" value={totalPageViews.toLocaleString()} icon={Eye} />
        <StatCard label="Signups" value={activation.sign_up_completed ?? 0} icon={TrendingUp} />
        <StatCard label="Parsers Created" value={activation.parser_created ?? 0} icon={FileText} />
      </div>

      {/* ── Traffic & Sessions ── */}
      <SectionHeader title="Traffic & Sessions" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Sessions (Unique Users)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sessions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke={BLUE}
                fill={BLUE}
                fillOpacity={0.15}
                name="Sessions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Traffic Sources">
          {trafficSources.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={trafficSources}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {trafficSources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top Pages">
          <RankTable data={topPages.slice(0, 10)} />
        </ChartCard>

        <ChartCard title="Tool Page Views (by tool)">
          {toolViews.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={toolViews.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill={BLUE} radius={[0, 4, 4, 0]} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </ChartCard>
      </div>

      {/* ── Conversion Funnel ── */}
      <SectionHeader title="Conversion Funnel" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Full Funnel: Session → First Value">
          {conversionFunnel.length > 0 ? (
            <div className="space-y-3">
              {conversionFunnel.map((step, i) => (
                <FunnelStep
                  key={step.label}
                  label={step.label}
                  count={step.count}
                  rate={
                    i === 0
                      ? 100
                      : conversionFunnel[0].count > 0
                        ? (step.count / conversionFunnel[0].count) * 100
                        : 0
                  }
                  isLast={i === conversionFunnel.length - 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No funnel data</p>
          )}
        </ChartCard>

        <ChartCard title="Signups Over Time">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke={EMERALD}
                fill={EMERALD}
                fillOpacity={0.15}
                name="Signups"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Free Tools ── */}
      <SectionHeader title="Free Tool Engagement" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Handwriting Tool Funnel">
          {hwtFunnel.length > 0 ? (
            <div className="space-y-3">
              {hwtFunnel.map((step, i) => (
                <FunnelStep
                  key={step.label}
                  label={step.label}
                  count={step.count}
                  rate={
                    i === 0
                      ? 100
                      : hwtFunnel[0].count > 0
                        ? (step.count / hwtFunnel[0].count) * 100
                        : 0
                  }
                  isLast={i === hwtFunnel.length - 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </ChartCard>

        <ChartCard title="CTA Clicks by Location">
          {ctaClicks.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ctaClicks.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={INDIGO} radius={[4, 4, 0, 0]} name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </ChartCard>
      </div>

      {/* ── Landing Pages ── */}
      <SectionHeader title="Landing Pages" />
      <ChartCard title="LP Views & CTA Clicks">
        {lpData.length > 0 ? (
          <RankTable data={lpData} />
        ) : (
          <p className="text-xs text-muted-foreground">No LP data</p>
        )}
      </ChartCard>

      {/* ── Product Activation ── */}
      <SectionHeader title="Product Activation" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Demo Started" value={activation.demo_started ?? 0} icon={MousePointerClick} />
        <StatCard label="Demo Completed" value={activation.demo_completed ?? 0} icon={BarChart3} />
        <StatCard label="First Value" value={activation.first_value ?? 0} icon={TrendingUp} />
        <StatCard label="Parsers Created" value={activation.parser_created ?? 0} icon={FileText} />
      </div>
    </div>
  )
}
