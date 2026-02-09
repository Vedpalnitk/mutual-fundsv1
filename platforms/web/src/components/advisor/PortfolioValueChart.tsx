import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { portfolioApi } from '@/services/api'
import { useFATheme, formatCurrency } from '@/utils/fa'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

type Period = '1M' | '6M' | '1Y' | '3Y' | 'ALL'

interface PortfolioValueChartProps {
  clientId: string
}

interface HistoryPoint {
  date: string
  value: number
  invested: number
  dayChange: number
  dayChangePct: number
}

export default function PortfolioValueChart({ clientId }: PortfolioValueChartProps) {
  const { colors, isDark } = useFATheme()
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('1Y')
  const periods: Period[] = ['1M', '6M', '1Y', '3Y', 'ALL']

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await portfolioApi.getPortfolioHistory(clientId, period)
        setHistoryData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId, period])

  const periodReturn = useMemo(() => {
    if (historyData.length < 2) return null
    const start = historyData[0].value
    const end = historyData[historyData.length - 1].value
    return ((end - start) / start) * 100
  }, [historyData])

  const chartOption = useMemo(() => {
    if (!historyData.length) return {}

    const dates = historyData.map((d) =>
      new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
    )
    const values = historyData.map((d) => d.value)

    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF'
    const tooltipBorder = isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.15)'
    const tooltipTextColor = isDark ? '#F8FAFC' : '#1E293B'
    const tooltipSecondaryColor = isDark ? '#94A3B8' : '#64748B'
    const axisLineColor = isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(59, 130, 246, 0.08)'
    const axisLabelColor = isDark ? '#94A3B8' : '#64748B'
    const splitLineColor = isDark ? 'rgba(147, 197, 253, 0.1)' : 'rgba(59, 130, 246, 0.06)'
    const lineColors = isDark
      ? [
          { offset: 0, color: '#93C5FD' },
          { offset: 0.5, color: '#60A5FA' },
          { offset: 1, color: '#7DD3FC' },
        ]
      : [
          { offset: 0, color: '#3B82F6' },
          { offset: 0.5, color: '#2563EB' },
          { offset: 1, color: '#38BDF8' },
        ]
    const areaColors = isDark
      ? [
          { offset: 0, color: 'rgba(147, 197, 253, 0.15)' },
          { offset: 0.5, color: 'rgba(147, 197, 253, 0.05)' },
          { offset: 1, color: 'rgba(147, 197, 253, 0)' },
        ]
      : [
          { offset: 0, color: 'rgba(59, 130, 246, 0.12)' },
          { offset: 0.5, color: 'rgba(59, 130, 246, 0.04)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0)' },
        ]

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: tooltipTextColor, fontSize: 13 },
        formatter: (params: any) => {
          const data = params[0]
          const point = historyData[data.dataIndex]
          const gain = point.value - point.invested
          const gainPct = point.invested > 0 ? ((gain / point.invested) * 100).toFixed(1) : '0.0'
          return `
            <div style="font-weight: 600; margin-bottom: 4px; color: ${tooltipTextColor};">${data.name}</div>
            <div style="color: ${tooltipSecondaryColor}">Value: <span style="color: ${colors.primary}; font-weight: 600;">${formatCurrency(point.value)}</span></div>
            <div style="color: ${tooltipSecondaryColor}; margin-top: 2px;">Invested: ${formatCurrency(point.invested)}</div>
            <div style="color: ${gain >= 0 ? colors.success : colors.error}; margin-top: 2px; font-weight: 600;">
              ${gain >= 0 ? '+' : ''}${formatCurrency(gain)} (${gainPct}%)
            </div>
          `
        },
      },
      grid: { left: 60, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        axisLabel: {
          color: axisLabelColor,
          fontSize: 11,
          interval: Math.floor(dates.length / 6),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: (value: { min: number }) => (value.min * 0.98).toFixed(0),
        max: (value: { max: number }) => (value.max * 1.02).toFixed(0),
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLabel: {
          color: axisLabelColor,
          fontSize: 11,
          formatter: (value: number) => {
            if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
            if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
            return value.toString()
          },
        },
      },
      series: [
        {
          data: values,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: false,
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: lineColors,
            },
            shadowColor: isDark ? 'rgba(147, 197, 253, 0.3)' : 'rgba(59, 130, 246, 0.25)',
            shadowBlur: 10,
            shadowOffsetY: 5,
          },
          itemStyle: {
            color: colors.primary,
            borderWidth: 2,
            borderColor: isDark ? '#1E293B' : '#FFFFFF',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: areaColors,
            },
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 15,
              shadowColor: isDark ? 'rgba(147, 197, 253, 0.5)' : 'rgba(59, 130, 246, 0.4)',
            },
          },
        },
      ],
    }
  }, [historyData, isDark, colors])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 300 }}>
        <svg className="w-8 h-8 animate-spin" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <svg className="w-10 h-10 mb-3" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-sm" style={{ color: colors.textTertiary }}>No portfolio history available</p>
      </div>
    )
  }

  return (
    <div>
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {periodReturn !== null && (
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{
                background: periodReturn >= 0 ? `${colors.success}15` : `${colors.error}15`,
                color: periodReturn >= 0 ? colors.success : colors.error,
              }}
            >
              {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(2)}%
            </span>
          )}
          <span className="text-xs" style={{ color: colors.textTertiary }}>
            {period === 'ALL' ? 'All time' : `${period} return`}
          </span>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: colors.chipBg }}>
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background:
                  period === p
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                color: period === p ? 'white' : colors.textSecondary,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {historyData.length > 0 ? (
        <ReactECharts option={chartOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
      ) : (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <p className="text-sm" style={{ color: colors.textTertiary }}>
            No data available for this period
          </p>
        </div>
      )}
    </div>
  )
}
