import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useFATheme } from '@/utils/fa'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface AllocationItem {
  assetClass: string
  value: number
  percentage: number
  color: string
}

interface AssetAllocationChartProps {
  allocation: AllocationItem[]
  height?: number
  showLegend?: boolean
}

const getAssetClassColor = (assetClass: string, isDark: boolean): string => {
  const colors: Record<string, { light: string; dark: string }> = {
    Equity: { light: '#3B82F6', dark: '#60A5FA' },
    Debt: { light: '#10B981', dark: '#34D399' },
    Hybrid: { light: '#8B5CF6', dark: '#A78BFA' },
    Gold: { light: '#F59E0B', dark: '#FBBF24' },
    International: { light: '#EC4899', dark: '#F472B6' },
    Liquid: { light: '#06B6D4', dark: '#22D3EE' },
    Other: { light: '#94A3B8', dark: '#CBD5E1' },
  }
  return colors[assetClass]?.[isDark ? 'dark' : 'light'] || colors.Other[isDark ? 'dark' : 'light']
}

export default function AssetAllocationChart({
  allocation,
  height = 260,
  showLegend = true,
}: AssetAllocationChartProps) {
  const { colors, isDark } = useFATheme()

  const chartData = useMemo(() => {
    return allocation
      .filter((a) => a.percentage > 0)
      .map((a) => ({
        name: a.assetClass,
        value: a.percentage,
        itemStyle: {
          color: getAssetClassColor(a.assetClass, isDark),
        },
      }))
  }, [allocation, isDark])

  const chartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        borderColor: colors.cardBorder,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: colors.textPrimary, fontSize: 13 },
        formatter: (params: any) => {
          const item = allocation.find((a) => a.assetClass === params.name)
          return `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${params.color};"></div>
              <span style="font-weight: 600;">${params.name}</span>
            </div>
            <div style="margin-top: 4px; color: ${colors.textSecondary};">
              ${params.value.toFixed(1)}%${item ? ` (${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.value)})` : ''}
            </div>
          `
        },
      },
      legend: showLegend
        ? {
            orient: 'vertical' as const,
            right: 10,
            top: 'center',
            itemWidth: 12,
            itemHeight: 12,
            itemGap: 12,
            textStyle: {
              color: colors.textSecondary,
              fontSize: 12,
            },
            formatter: (name: string) => {
              const item = chartData.find((d) => d.name === name)
              return `${name}  ${item?.value.toFixed(1)}%`
            },
          }
        : undefined,
      series: [
        {
          name: 'Allocation',
          type: 'pie',
          radius: ['55%', '80%'],
          center: showLegend ? ['35%', '50%'] : ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: isDark ? '#0B1120' : '#FFFFFF',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: colors.textPrimary,
              formatter: '{b}\n{d}%',
            },
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          labelLine: { show: false },
          data: chartData,
        },
      ],
    }
  }, [chartData, allocation, colors, isDark, showLegend])

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height, color: colors.textTertiary }}
      >
        <p className="text-sm">No allocation data</p>
      </div>
    )
  }

  return (
    <ReactECharts
      option={chartOption}
      style={{ height }}
      opts={{ renderer: 'svg' }}
    />
  )
}
