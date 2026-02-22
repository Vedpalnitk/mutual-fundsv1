import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useFATheme, formatCurrencyCompact } from '@/utils/fa'
import { CommissionRecord } from '@/services/api/business'
import { RevenueProjection } from '@/services/api/business'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface Props {
  commissionRecords: CommissionRecord[]
  projections: RevenueProjection['projections']
  loading: boolean
}

export default function RevenueTrailChart({ commissionRecords, projections, loading }: Props) {
  const { colors, isDark } = useFATheme()

  // Format period labels: "2026-02" → "Feb 26"
  const formatPeriod = (p: string) => {
    const parts = p.split('-')
    if (parts.length >= 2) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const monthIdx = parseInt(parts[1], 10) - 1
      return `${months[monthIdx] || parts[1]} ${parts[0].slice(2)}`
    }
    return p
  }

  const hasHistorical = commissionRecords.length > 0

  const chartOption = useMemo(() => {
    // Group commission records by period, summing expectedTrail and actualTrail
    const periodMap = new Map<string, { expected: number; actual: number }>()
    for (const r of commissionRecords) {
      const existing = periodMap.get(r.period) || { expected: 0, actual: 0 }
      existing.expected += r.expectedTrail
      existing.actual += r.actualTrail
      periodMap.set(r.period, existing)
    }

    const historicalPeriods = Array.from(periodMap.keys()).sort()
    const projectedPeriods = projections.map(p => p.period)

    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF'
    const tooltipBorder = isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.15)'
    const tooltipTextColor = isDark ? '#F8FAFC' : '#1E293B'
    const tooltipSecondaryColor = isDark ? '#94A3B8' : '#64748B'
    const axisLineColor = isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(59, 130, 246, 0.08)'
    const axisLabelColor = isDark ? '#94A3B8' : '#64748B'
    const splitLineColor = isDark ? 'rgba(147, 197, 253, 0.1)' : 'rgba(59, 130, 246, 0.06)'

    // ── Projection-only mode (no commission records uploaded yet) ──
    if (!hasHistorical) {
      if (projections.length === 0) return {}

      const periodLabels = projectedPeriods.map(formatPeriod)
      const trailData = projections.map(p => p.projectedTrail)

      const barColor = isDark
        ? { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: 'rgba(147, 197, 253, 0.8)' },
            { offset: 1, color: 'rgba(147, 197, 253, 0.3)' },
          ]}
        : { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.7)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.25)' },
          ]}

      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: tooltipTextColor, fontSize: 12 },
          formatter: (params: any) => {
            const p = params[0]
            if (!p) return ''
            return `<div style="font-weight: 600; margin-bottom: 4px; color: ${tooltipTextColor};">${p.name}</div>
              <div style="color: ${tooltipSecondaryColor};">Projected Trail: <span style="font-weight: 600; color: ${tooltipTextColor};">${formatCurrencyCompact(p.value)}</span></div>`
          },
        },
        legend: { show: false },
        grid: { left: 60, right: 16, top: 16, bottom: 32 },
        xAxis: {
          type: 'category',
          data: periodLabels,
          axisLine: { lineStyle: { color: axisLineColor } },
          axisTick: { show: false },
          axisLabel: { color: axisLabelColor, fontSize: 10, rotate: periodLabels.length > 8 ? 30 : 0 },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
          axisLabel: {
            color: axisLabelColor,
            fontSize: 11,
            formatter: (value: number) => formatCurrencyCompact(value),
          },
        },
        series: [{
          name: 'Projected Trail',
          type: 'bar',
          data: trailData,
          barMaxWidth: 32,
          itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { color: isDark ? '#93C5FD' : '#3B82F6' } },
        }],
      }
    }

    // ── Historical + projection mode (has commission records) ──
    // Merge periods (historical first, then projected that aren't already historical)
    const allPeriods = [...historicalPeriods]
    for (const p of projectedPeriods) {
      if (!allPeriods.includes(p)) allPeriods.push(p)
    }

    if (allPeriods.length === 0) return {}

    const expectedData: (number | null)[] = []
    const actualData: (number | null)[] = []
    const projectedData: (number | null)[] = []

    // Bridge: start projected line from last historical actual value
    let lastActualTrail: number | null = null
    if (historicalPeriods.length > 0) {
      const lastHist = periodMap.get(historicalPeriods[historicalPeriods.length - 1])
      if (lastHist) lastActualTrail = lastHist.actual
    }

    for (const period of allPeriods) {
      const hist = periodMap.get(period)
      expectedData.push(hist ? hist.expected : null)
      actualData.push(hist ? hist.actual : null)

      const proj = projections.find(p => p.period === period)
      const isLastHistorical = hist && historicalPeriods[historicalPeriods.length - 1] === period

      if (isLastHistorical && lastActualTrail !== null) {
        projectedData.push(lastActualTrail)
      } else if (proj && !hist) {
        projectedData.push(proj.projectedTrail)
      } else {
        projectedData.push(null)
      }
    }

    const periodLabels = allPeriods.map(formatPeriod)
    const expectedColor = isDark ? 'rgba(147, 197, 253, 0.65)' : 'rgba(59, 130, 246, 0.5)'
    const actualColor = isDark ? '#93C5FD' : '#3B82F6'
    const projectedColor = isDark ? '#FBBF24' : '#F59E0B'

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: tooltipTextColor, fontSize: 12 },
        formatter: (params: any) => {
          const period = params[0]?.name || ''
          let html = `<div style="font-weight: 600; margin-bottom: 6px; color: ${tooltipTextColor};">${period}</div>`
          for (const p of params) {
            if (p.value != null) {
              html += `<div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${p.color};"></span>
                <span style="color: ${tooltipSecondaryColor};">${p.seriesName}:</span>
                <span style="font-weight: 600; color: ${tooltipTextColor};">${formatCurrencyCompact(p.value)}</span>
              </div>`
            }
          }
          return html
        },
      },
      legend: {
        show: true,
        top: 0,
        right: 0,
        textStyle: { color: axisLabelColor, fontSize: 11 },
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
      },
      grid: { left: 60, right: 16, top: 36, bottom: 32 },
      xAxis: {
        type: 'category',
        data: periodLabels,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        axisLabel: { color: axisLabelColor, fontSize: 10, rotate: periodLabels.length > 8 ? 30 : 0 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLabel: {
          color: axisLabelColor,
          fontSize: 11,
          formatter: (value: number) => formatCurrencyCompact(value),
        },
      },
      series: [
        {
          name: 'Expected Trail',
          type: 'bar',
          data: expectedData,
          barGap: '10%',
          barMaxWidth: 28,
          itemStyle: { color: expectedColor, borderRadius: [3, 3, 0, 0] },
        },
        {
          name: 'Actual Trail',
          type: 'bar',
          data: actualData,
          barMaxWidth: 28,
          itemStyle: { color: actualColor, borderRadius: [3, 3, 0, 0] },
        },
        {
          name: 'Projected Trail',
          type: 'line',
          data: projectedData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          connectNulls: false,
          lineStyle: { width: 2.5, type: 'dashed', color: projectedColor },
          itemStyle: { color: projectedColor, borderWidth: 2, borderColor: isDark ? '#1E293B' : '#FFFFFF' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.12)' },
                { offset: 1, color: isDark ? 'rgba(251, 191, 36, 0)' : 'rgba(245, 158, 11, 0)' },
              ],
            },
          },
        },
      ],
    }
  }, [commissionRecords, projections, isDark, colors, hasHistorical])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 280 }}>
        <svg className="w-6 h-6 animate-spin" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (commissionRecords.length === 0 && projections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: 280 }}>
        <svg className="w-8 h-8 mb-2" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-xs" style={{ color: colors.textTertiary }}>No revenue data available</p>
      </div>
    )
  }

  return <ReactECharts option={chartOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
}
