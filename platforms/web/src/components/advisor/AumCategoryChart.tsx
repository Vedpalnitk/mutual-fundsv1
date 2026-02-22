import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useFATheme, formatCurrencyCompact } from '@/utils/fa'
import { AumSnapshot } from '@/services/api/business'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface Props {
  snapshots: AumSnapshot[]
  loading: boolean
}

export default function AumCategoryChart({ snapshots, loading }: Props) {
  const { colors, isDark } = useFATheme()

  const chartOption = useMemo(() => {
    if (snapshots.length === 0) return {}

    // Determine date format based on range
    const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const rangeDays = sorted.length > 1
      ? (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / 86400000
      : 0

    const dateLabels = sorted.map(s => {
      const d = new Date(s.date)
      if (rangeDays > 180) {
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      }
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    })

    const equityData = sorted.map(s => s.equityAum)
    const debtData = sorted.map(s => s.debtAum)
    const hybridData = sorted.map(s => s.hybridAum)

    const equityColor = isDark ? '#60A5FA' : '#3B82F6'
    const debtColor = isDark ? '#34D399' : '#10B981'
    const hybridColor = isDark ? '#A78BFA' : '#8B5CF6'

    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF'
    const tooltipBorder = isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.15)'
    const tooltipTextColor = isDark ? '#F8FAFC' : '#1E293B'
    const tooltipSecondaryColor = isDark ? '#94A3B8' : '#64748B'
    const axisLineColor = isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(59, 130, 246, 0.08)'
    const axisLabelColor = isDark ? '#94A3B8' : '#64748B'
    const splitLineColor = isDark ? 'rgba(147, 197, 253, 0.1)' : 'rgba(59, 130, 246, 0.06)'

    const makeAreaGradient = (baseColor: string, darkOpacity: number, lightOpacity: number) => ({
      type: 'linear' as const,
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: `${baseColor}${isDark ? Math.round(darkOpacity * 255).toString(16).padStart(2, '0') : Math.round(lightOpacity * 255).toString(16).padStart(2, '0')}` },
        { offset: 1, color: `${baseColor}0D` },
      ],
    })

    const makeSeries = (name: string, data: number[], color: string, darkOp: number, lightOp: number) => ({
      name,
      type: 'line',
      stack: 'total',
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color },
      areaStyle: { color: makeAreaGradient(color, darkOp, lightOp) },
      emphasis: { focus: 'series' as const },
      data,
    })

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
          const date = params[0]?.name || ''
          const total = params.reduce((s: number, p: any) => s + (p.value || 0), 0)
          let html = `<div style="font-weight: 600; margin-bottom: 6px; color: ${tooltipTextColor};">${date}</div>`
          for (const p of params) {
            html += `<div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${p.color};"></span>
              <span style="color: ${tooltipSecondaryColor};">${p.seriesName}:</span>
              <span style="font-weight: 600; color: ${tooltipTextColor};">${formatCurrencyCompact(p.value)}</span>
            </div>`
          }
          html += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; font-weight: 600; color: ${tooltipTextColor};">
            Total: ${formatCurrencyCompact(total)}
          </div>`
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
        boundaryGap: false,
        data: dateLabels,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        axisLabel: {
          color: axisLabelColor,
          fontSize: 10,
          interval: Math.max(0, Math.floor(dateLabels.length / 6)),
        },
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
        makeSeries('Equity', equityData, equityColor, 0.25, 0.2),
        makeSeries('Debt', debtData, debtColor, 0.25, 0.2),
        makeSeries('Hybrid', hybridData, hybridColor, 0.25, 0.2),
      ],
    }
  }, [snapshots, isDark, colors])

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

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: 280 }}>
        <svg className="w-8 h-8 mb-2" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
        <p className="text-xs" style={{ color: colors.textTertiary }}>No AUM snapshot data available</p>
      </div>
    )
  }

  return <ReactECharts option={chartOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
}
