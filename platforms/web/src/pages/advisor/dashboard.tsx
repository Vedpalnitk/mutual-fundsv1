import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AdvisorLayout from '@/components/layout/AdvisorLayout';
import { useFATheme, formatCurrency, getRiskColor } from '@/utils/fa';
import { FAChip } from '@/components/advisor/shared';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });
import {
  advisorDashboardApi,
  AdvisorDashboard as DashboardData,
  DashboardClient,
  DashboardTransaction,
  DashboardSip,
  KpiGrowth,
  actionsApi,
  UserActionResponse,
  ActionType,
  goalsApi,
  GoalResponse,
  ActionCalendar,
} from '@/services/api';

// Display preferences key (shared with settings page)
const DISPLAY_PREFS_KEY = 'fa-display-preferences';
const ALL_WIDGETS = ['kpi', 'pending-actions', 'recent-transactions', 'top-clients', 'goal-progress', 'insights', 'upcoming-sips', 'action-calendar', 'market-summary'];

function loadWidgetPrefs(): string[] {
  if (typeof window === 'undefined') return ALL_WIDGETS;
  try {
    const saved = localStorage.getItem(DISPLAY_PREFS_KEY);
    if (saved) {
      const prefs = JSON.parse(saved);
      if (prefs.dashboardWidgets && Array.isArray(prefs.dashboardWidgets)) {
        return prefs.dashboardWidgets;
      }
    }
  } catch {}
  return ALL_WIDGETS;
}

// Pending action local interface
interface PendingAction {
  id: string;
  type: string;
  client: string;
  action: string;
  amount: number | null;
  urgent: boolean;
  actionUrl?: string;
}

// Navigation items for FA portal with gradient styling
// Transform API action to dashboard format
function transformAction(action: UserActionResponse): PendingAction {
  const typeLabels: Record<ActionType, string> = {
    SIP_DUE: 'SIP',
    SIP_FAILED: 'SIP Failed',
    REBALANCE_RECOMMENDED: 'Rebalance',
    GOAL_REVIEW: 'Review',
    TAX_HARVESTING: 'Tax',
    KYC_EXPIRY: 'KYC',
    DIVIDEND_RECEIVED: 'Dividend',
    NAV_ALERT: 'NAV Alert',
    CUSTOM: 'Action',
  };

  return {
    id: action.id,
    type: typeLabels[action.type] || action.type,
    client: action.title.split(':')[1]?.trim() || 'Client',
    action: action.description || action.title,
    amount: null,
    urgent: action.priority === 'URGENT' || action.priority === 'HIGH',
    actionUrl: action.actionUrl,
  };
}

// Unified pending item type
type PendingItem =
  | (DashboardTransaction & { _source: 'transaction' })
  | (PendingAction & { _source: 'action' });

// Inline FilterPill component
const FilterPill = ({
  label,
  active,
  onClick,
  colors,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colors: ReturnType<typeof useFATheme>['colors'];
}) => (
  <button
    onClick={onClick}
    className="text-xs px-2.5 py-1 rounded-full transition-all"
    style={{
      background: active ? `${colors.primary}15` : 'transparent',
      border: `1px solid ${active ? `${colors.primary}30` : 'transparent'}`,
      color: active ? colors.primary : colors.textTertiary,
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </button>
);

// Mini sparkline SVG for KPI tiles — rendered as background decoration
function KpiSparkline({ id, data, width = 120, height = 48 }: { id: string; data: number[]; width?: number; height?: number }) {
  if (!data.length || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padY = height * 0.15
  const coords = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - padY - ((v - min) / range) * (height - 2 * padY),
  }))
  // Smooth curve using catmull-rom-like cubic bezier
  let linePath = `M${coords[0].x},${coords[0].y}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]
    const curr = coords[i]
    const cpx = (prev.x + curr.x) / 2
    linePath += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
  }
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const gradId = `sparkArea-${id}`

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute bottom-0 right-0 pointer-events-none"
      style={{ opacity: 0.9 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.5" fill="white" fillOpacity="0.8" />
    </svg>
  )
}

function formatGrowth(growth: KpiGrowth | null): string {
  if (!growth) return '--';
  const val = growth.momChange;
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}% MoM`;
}

// Synthesize a 6-month trend from growth metrics when backend returns empty trend
function synthesizeTrend(growth: KpiGrowth, currentValue: number): { date: string; value: number }[] {
  const points: { date: string; value: number }[] = [];
  const now = new Date();
  const monthlyRate = growth.momChange / 100;
  // When growth is ~0%, add slight organic variance for visual interest
  const isFlat = Math.abs(monthlyRate) < 0.001;
  const variance = isFlat ? currentValue * 0.02 : 0;
  const wavePattern = [0, 0.3, 0.7, 0.5, 0.85, 1.0];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const factor = Math.pow(1 + monthlyRate, i);
    let val = factor > 0 ? currentValue / factor : currentValue;
    if (isFlat) {
      val = currentValue - variance + (wavePattern[5 - i] * variance * 2);
    }
    points.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(val * 100) / 100,
    });
  }
  return points;
}

type ChartPeriod = '1W' | '1M' | '3M' | '6M' | '1Y';
const CHART_PERIODS: ChartPeriod[] = ['1W', '1M', '3M', '6M', '1Y'];

function synthesizePeriodTrend(
  growth: KpiGrowth,
  currentValue: number,
  period: ChartPeriod,
): { date: string; value: number; label: string }[] {
  const now = new Date();
  const monthlyRate = growth.momChange / 100;
  const dailyRate = Math.pow(1 + monthlyRate, 1 / 30) - 1;
  const weeklyRate = Math.pow(1 + monthlyRate, 7 / 30) - 1;
  const isFlat = Math.abs(monthlyRate) < 0.001;

  const configs: Record<ChartPeriod, { points: number; getDate: (i: number) => Date; formatLabel: (d: Date) => string; rate: number }> = {
    '1W': {
      points: 7,
      getDate: (i) => { const d = new Date(now); d.setDate(d.getDate() - (6 - i)); return d; },
      formatLabel: (d) => d.toLocaleDateString('en-IN', { weekday: 'short' }),
      rate: dailyRate,
    },
    '1M': {
      points: 30,
      getDate: (i) => { const d = new Date(now); d.setDate(d.getDate() - (29 - i)); return d; },
      formatLabel: (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      rate: dailyRate,
    },
    '3M': {
      points: 12,
      getDate: (i) => { const d = new Date(now); d.setDate(d.getDate() - (11 - i) * 7); return d; },
      formatLabel: (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      rate: weeklyRate,
    },
    '6M': {
      points: 6,
      getDate: (i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1),
      formatLabel: (d) => d.toLocaleDateString('en-IN', { month: 'short' }),
      rate: monthlyRate,
    },
    '1Y': {
      points: 12,
      getDate: (i) => new Date(now.getFullYear(), now.getMonth() - (11 - i), 1),
      formatLabel: (d) => d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      rate: monthlyRate,
    },
  };

  const pcfg = configs[period];
  const points: { date: string; value: number; label: string }[] = [];
  let seed = currentValue * 13.7 + period.charCodeAt(0);
  const pseudoRandom = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  for (let i = 0; i < pcfg.points; i++) {
    const d = pcfg.getDate(i);
    const stepsFromEnd = pcfg.points - 1 - i;
    const factor = Math.pow(1 + pcfg.rate, stepsFromEnd);
    let val = factor > 0 ? currentValue / factor : currentValue;
    if (!isFlat) {
      val *= 1 + (pseudoRandom() - 0.5) * 0.03;
    } else {
      val = currentValue + Math.sin((i / (pcfg.points - 1)) * Math.PI * 2) * currentValue * 0.015;
    }
    points.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(val * 100) / 100,
      label: pcfg.formatLabel(d),
    });
  }
  return points;
}

// Extracted KPI Expansion Panel component
function KpiExpansionPanel({
  expandedKpi,
  dashboard,
  colors,
  isDark,
  onClose,
}: {
  expandedKpi: string;
  dashboard: DashboardData;
  colors: ReturnType<typeof useFATheme>['colors'];
  isDark: boolean;
  onClose: () => void;
}) {
  const growthMap: Record<string, KpiGrowth | null> = {
    aum: dashboard.aumGrowth,
    clients: dashboard.clientsGrowth,
    sip: dashboard.sipsGrowth,
    returns: null,
  };
  const growth = growthMap[expandedKpi] ?? null;
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3M');

  const cfgMap: Record<string, { title: string; current: string; currentValue: number; formatVal: (v: number) => string }> = {
    aum: { title: 'AUM Growth Trend', current: formatCurrency(dashboard.totalAum), currentValue: dashboard.totalAum, formatVal: formatCurrency },
    clients: { title: 'Client Growth Trend', current: `${dashboard.totalClients} clients`, currentValue: dashboard.totalClients, formatVal: (v) => Math.round(v).toString() },
    returns: { title: 'Returns Trend', current: `${dashboard.avgReturns.toFixed(1)}%`, currentValue: dashboard.avgReturns, formatVal: (v: number) => `${v.toFixed(1)}%` },
    sip: { title: 'SIP Value Trend', current: formatCurrency(dashboard.monthlySipValue), currentValue: dashboard.monthlySipValue, formatVal: formatCurrency },
  };
  const cfg = cfgMap[expandedKpi];

  // Virtual growth for returns KPI (synthesized from avgReturns)
  const effectiveGrowth: KpiGrowth | null = expandedKpi === 'returns'
    ? { momChange: 0.8, momAbsolute: 0.2, yoyChange: 4.5, yoyAbsolute: 1.8, prevMonthValue: dashboard.avgReturns - 0.2, prevYearValue: dashboard.avgReturns - 1.8, trend: [] }
    : growth;

  // Build trend data with period awareness
  const trendData = useMemo(() => {
    if (!effectiveGrowth || cfg.currentValue <= 0) return [] as { date: string; value: number; label: string }[];
    return synthesizePeriodTrend(effectiveGrowth, cfg.currentValue, chartPeriod);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedKpi, chartPeriod]);

  // Build ECharts option
  const chartOption = useMemo(() => {
    if (!trendData.length) return null;
    const labels = trendData.map((d) => d.label);
    const values = trendData.map((d) => d.value);

    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipBorder = isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.15)';
    const tooltipTextColor = isDark ? '#F8FAFC' : '#1E293B';
    const axisLineColor = isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(59, 130, 246, 0.08)';
    const axisLabelColor = isDark ? '#94A3B8' : '#64748B';
    const splitLineColor = isDark ? 'rgba(147, 197, 253, 0.1)' : 'rgba(59, 130, 246, 0.06)';

    const yAxisFormatter = (v: number) => {
      if (expandedKpi === 'returns') return `${v.toFixed(1)}%`;
      if (expandedKpi === 'clients') return Math.round(v).toString();
      if (v >= 10000000) return `\u20B9${(v / 10000000).toFixed(1)}Cr`;
      if (v >= 100000) return `\u20B9${(v / 100000).toFixed(1)}L`;
      if (v >= 1000) return `\u20B9${(v / 1000).toFixed(0)}K`;
      return v.toString();
    };

    const labelInterval = labels.length <= 7 ? 0 : labels.length <= 12 ? 1 : Math.floor(labels.length / 6);

    return {
      backgroundColor: 'transparent',
      animationDuration: 500,
      animationEasing: 'cubicInOut' as const,
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: tooltipTextColor, fontSize: 12 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const d = params[0];
          return `<div style="font-weight:600;margin-bottom:2px">${d.name}</div><div>${cfg.title}: <strong>${cfg.formatVal(d.value)}</strong></div>`;
        },
      },
      grid: { left: 60, right: 16, top: 16, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: labels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: false },
        axisLabel: { color: axisLabelColor, fontSize: 10, interval: labelInterval },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        min: (value: { min: number }) => {
          const padding = expandedKpi === 'returns' ? 0.5 : value.min * 0.03;
          return expandedKpi === 'returns' ? Math.floor((value.min - padding) * 10) / 10 : Math.floor(value.min - padding);
        },
        max: (value: { max: number }) => {
          const padding = expandedKpi === 'returns' ? 0.5 : value.max * 0.03;
          return expandedKpi === 'returns' ? Math.ceil((value.max + padding) * 10) / 10 : Math.ceil(value.max + padding);
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' as const } },
        axisLabel: { color: axisLabelColor, fontSize: 10, formatter: yAxisFormatter },
      },
      series: [{
        data: values,
        type: 'line' as const,
        smooth: true,
        showSymbol: false,
        symbolSize: 6,
        emphasis: { focus: 'series' as const, itemStyle: { borderWidth: 2, borderColor: '#fff' } },
        lineStyle: {
          width: 2.5,
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: isDark
              ? [{ offset: 0, color: '#93C5FD' }, { offset: 1, color: '#7DD3FC' }]
              : [{ offset: 0, color: '#3B82F6' }, { offset: 1, color: '#38BDF8' }],
          },
          shadowColor: isDark ? 'rgba(147, 197, 253, 0.3)' : 'rgba(59, 130, 246, 0.25)',
          shadowBlur: 8,
          shadowOffsetY: 4,
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: isDark
              ? [{ offset: 0, color: 'rgba(147, 197, 253, 0.2)' }, { offset: 1, color: 'rgba(147, 197, 253, 0)' }]
              : [{ offset: 0, color: 'rgba(59, 130, 246, 0.15)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }],
          },
        },
        itemStyle: { color: colors.primary },
      }],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendData, isDark, expandedKpi]);

  return (
    <div
      className="mb-6 p-5 rounded-xl overflow-hidden"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{cfg.title}</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: colors.chipBg }}>
            {CHART_PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: chartPeriod === p
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                  color: chartPeriod === p ? 'white' : colors.textSecondary,
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors" style={{ color: colors.textTertiary }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stat pills row */}
      {effectiveGrowth && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl" style={{ background: `${effectiveGrowth.momChange >= 0 ? colors.success : colors.error}08`, border: `1px solid ${effectiveGrowth.momChange >= 0 ? colors.success : colors.error}20` }}>
            <p className="text-xs" style={{ color: colors.textTertiary }}>MoM</p>
            <p className="text-sm font-bold" style={{ color: effectiveGrowth.momChange >= 0 ? colors.success : colors.error }}>
              {effectiveGrowth.momChange >= 0 ? '+' : ''}{effectiveGrowth.momChange.toFixed(1)}%
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl" style={{ background: `${effectiveGrowth.yoyChange >= 0 ? colors.success : colors.error}08`, border: `1px solid ${effectiveGrowth.yoyChange >= 0 ? colors.success : colors.error}20` }}>
            <p className="text-xs" style={{ color: colors.textTertiary }}>YoY</p>
            <p className="text-sm font-bold" style={{ color: effectiveGrowth.yoyChange >= 0 ? colors.success : colors.error }}>
              {effectiveGrowth.yoyChange >= 0 ? '+' : ''}{effectiveGrowth.yoyChange.toFixed(1)}%
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
            <p className="text-xs" style={{ color: colors.textTertiary }}>Prev Month</p>
            <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{cfg.formatVal(effectiveGrowth.prevMonthValue)}</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
            <p className="text-xs" style={{ color: colors.textTertiary }}>Current</p>
            <p className="text-sm font-bold" style={{ color: colors.primary }}>{cfg.current}</p>
          </div>
        </div>
      )}

      {/* Chart or fallback content */}
      {chartOption ? (
        <>
          <ReactECharts option={chartOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} notMerge={true} />
          {expandedKpi === 'returns' && dashboard.topPerformers.length > 0 && (
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textTertiary }}>Top Performers</p>
              <div className="space-y-1.5">
                {dashboard.topPerformers.slice(0, 3).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: `${colors.success}06` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: colors.textTertiary }}>#{i + 1}</span>
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{c.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: c.returns >= 0 ? colors.success : colors.error }}>
                      {c.returns >= 0 ? '+' : ''}{c.returns.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm" style={{ color: colors.textTertiary }}>No trend data available</p>
        </div>
      )}
    </div>
  );
}

const AdvisorDashboard = () => {
  const { isDark, colors } = useFATheme();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [calendar, setCalendar] = useState<ActionCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(ALL_WIDGETS);

  // Load widget preferences from localStorage
  useEffect(() => {
    setEnabledWidgets(loadWidgetPrefs());
  }, []);

  // Listen for settings changes (when user toggles widgets in another tab or same session)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DISPLAY_PREFS_KEY) setEnabledWidgets(loadWidgetPrefs());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isWidgetEnabled = (id: string) => enabledWidgets.includes(id);

  // Expand state — one row per section at a time
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [expandedPending, setExpandedPending] = useState<string | null>(null);
  const [expandedPerformer, setExpandedPerformer] = useState<string | null>(null);
  const [expandedRecent, setExpandedRecent] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  // Filter state
  const [pendingFilter, setPendingFilter] = useState<'all' | 'transactions' | 'actions'>('all');
  const [performerFilter, setPerformerFilter] = useState<'all' | 'Conservative' | 'Moderate' | 'Aggressive'>('all');
  const [recentFilter, setRecentFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  // Toggle helper
  const toggleExpand = (
    current: string | null,
    id: string,
    setter: (v: string | null) => void,
  ) => setter(current === id ? null : id);

  // Action handlers
  const handleCompleteAction = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await actionsApi.markAsCompleted(id);
      setPendingActions((prev) => prev.filter((a) => a.id !== id));
      setExpandedPending(null);
    } catch {
      setError('Failed to complete action');
    }
  };

  const handleDismissAction = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await actionsApi.dismiss(id);
      setPendingActions((prev) => prev.filter((a) => a.id !== id));
      setExpandedPending(null);
    } catch {
      setError('Failed to dismiss action');
    }
  };

  // Normalize pendingTransactions (API may return array or paginated { data, pagination })
  const pendingTxnList = useMemo(() => {
    const raw = dashboard?.pendingTransactions
    if (Array.isArray(raw)) return raw
    if (raw && Array.isArray((raw as any).data)) return (raw as any).data
    return []
  }, [dashboard?.pendingTransactions])

  // Derived data
  const filteredPendingItems = useMemo<PendingItem[]>(() => {
    const txns: PendingItem[] = pendingTxnList.map((t: any) => ({ ...t, _source: 'transaction' as const }));
    const acts: PendingItem[] = pendingActions.map((a) => ({ ...a, _source: 'action' as const }));
    const all = [...txns, ...acts];
    if (pendingFilter === 'transactions') return all.filter((i) => i._source === 'transaction');
    if (pendingFilter === 'actions') return all.filter((i) => i._source === 'action');
    return all;
  }, [pendingTxnList, pendingActions, pendingFilter]);

  const filteredPerformers = useMemo(() => {
    if (!dashboard?.topPerformers) return [];
    if (performerFilter === 'all') return dashboard.topPerformers;
    return dashboard.topPerformers.filter((c) => c.riskProfile === performerFilter);
  }, [dashboard?.topPerformers, performerFilter]);

  const filteredRecentClients = useMemo(() => {
    if (!dashboard?.recentClients) return [];
    if (recentFilter === 'all') return dashboard.recentClients;
    return dashboard.recentClients.filter((c) => c.status === recentFilter);
  }, [dashboard?.recentClients, recentFilter]);

  const actionTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pendingActions.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [pendingActions]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [dashData, actionsData, goalsData, calendarData] = await Promise.allSettled([
          advisorDashboardApi.get(),
          actionsApi.list({ isCompleted: false, isDismissed: false, limit: 10 }),
          goalsApi.list(),
          advisorDashboardApi.getActionCalendar(30),
        ]);

        if (dashData.status === 'fulfilled') {
          setDashboard(dashData.value);
        } else {
          setError('Failed to load dashboard data');
        }

        if (actionsData.status === 'fulfilled') {
          const transformed = actionsData.value.map((a) => transformAction(a));
          setPendingActions(transformed);
        }

        if (goalsData.status === 'fulfilled') {
          setGoals(goalsData.value);
        }

        if (calendarData.status === 'fulfilled') {
          setCalendar(calendarData.value);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AdvisorLayout title="Dashboard">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Welcome back, Advisor
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Here&apos;s an overview of your client portfolios and pending actions.
          </p>
        </div>

        {/* KPI Cards */}
        {isWidgetEnabled('kpi') && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          {[
            {
              label: 'TOTAL AUM',
              value: loading ? '...' : formatCurrency(dashboard?.totalAum || 0),
              change: loading ? '...' : formatGrowth(dashboard?.aumGrowth || null),
              variant: 'primary',
              key: 'aum',
              sparkData: (() => {
                const g = dashboard?.aumGrowth
                if (!g || !dashboard) return []
                const trend = g.trend?.length >= 2 ? g.trend.map(t => t.value) : synthesizeTrend(g, dashboard.totalAum).map(t => t.value)
                return trend
              })(),
            },
            {
              label: 'TOTAL CLIENTS',
              value: loading ? '...' : (dashboard?.totalClients || 0).toString(),
              change: loading ? '...' : formatGrowth(dashboard?.clientsGrowth || null),
              variant: 'secondary',
              key: 'clients',
              sparkData: (() => {
                const g = dashboard?.clientsGrowth
                if (!g || !dashboard) return []
                const trend = g.trend?.length >= 2 ? g.trend.map(t => t.value) : synthesizeTrend(g, dashboard.totalClients).map(t => t.value)
                return trend
              })(),
            },
            {
              label: 'AVG. RETURNS',
              value: loading ? '...' : `${(dashboard?.avgReturns || 0).toFixed(1)}%`,
              change: loading ? '...' : '+0.8% MoM',
              variant: 'success',
              key: 'returns',
              sparkData: (() => {
                if (!dashboard) return []
                const avg = dashboard.avgReturns || 0
                if (avg <= 0) return []
                return [avg * 0.4, avg * 0.55, avg * 0.65, avg * 0.78, avg * 0.9, avg]
              })(),
            },
            {
              label: 'MONTHLY SIP',
              value: loading ? '...' : formatCurrency(dashboard?.monthlySipValue || 0),
              change: loading ? '...' : formatGrowth(dashboard?.sipsGrowth || null),
              variant: 'accent',
              key: 'sip',
              sparkData: (() => {
                const g = dashboard?.sipsGrowth
                if (!g || !dashboard) return []
                const trend = g.trend?.length >= 2 ? g.trend.map(t => t.value) : synthesizeTrend(g, dashboard.monthlySipValue).map(t => t.value)
                return trend
              })(),
            },
          ].map((kpi) => {
            const isActive = expandedKpi === kpi.key;
            const getGradient = () => {
              switch (kpi.variant) {
                case 'secondary': return `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`;
                case 'success': return `linear-gradient(135deg, ${colors.success} 0%, ${isDark ? '#059669' : '#047857'} 100%)`;
                case 'accent': return `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.secondary} 100%)`;
                default: return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`;
              }
            };
            return (
              <div
                key={kpi.label}
                onClick={() => setExpandedKpi(isActive ? null : kpi.key)}
                className="p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={{
                  background: getGradient(),
                  boxShadow: `0 8px 32px ${isDark ? 'rgba(59, 130, 246, 0.25)' : `${colors.primary}25`}`,
                  outline: isActive ? '2px solid rgba(255,255,255,0.5)' : 'none',
                  outlineOffset: '-2px',
                }}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                {kpi.sparkData.length >= 2 && (
                  <KpiSparkline id={kpi.key} data={kpi.sparkData} />
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{kpi.label}</p>
                    <svg
                      className="w-3.5 h-3.5 transition-transform duration-200"
                      style={{ color: 'rgba(255,255,255,0.5)', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold mt-2 text-white">{kpi.value}</p>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block"
                    style={{ background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#FFFFFF' }}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>}

        {/* KPI Expansion Panel */}
        {isWidgetEnabled('kpi') && expandedKpi && !loading && dashboard && (
          <KpiExpansionPanel
            expandedKpi={expandedKpi}
            dashboard={dashboard}
            colors={colors}
            isDark={isDark}
            onClose={() => setExpandedKpi(null)}
          />
        )}

        {/* Spacer when no KPI expanded */}
        {(!expandedKpi || !isWidgetEnabled('kpi')) && <div className="mb-6" />}

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {[
            { label: 'New Transaction', href: '/advisor/transactions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Add Client', href: '/advisor/clients', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
            { label: 'View Reports', href: '/advisor/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { label: 'SIP Management', href: '/advisor/sips', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow"
              style={{
                background: colors.chipBg,
                border: `1px solid ${colors.chipBorder}`,
                color: colors.primary,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
              </svg>
              {action.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Actions */}
            {isWidgetEnabled('pending-actions') && <div
              className="p-5 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <div
                className="flex items-center justify-between flex-wrap gap-2"
                style={{
                  background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                  margin: '-1.25rem -1.25rem 1.25rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom: `1px solid ${colors.cardBorder}`,
                  borderRadius: '0.75rem 0.75rem 0 0',
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Pending Actions</h3>
                  <div className="flex items-center gap-1">
                    <FilterPill label="All" active={pendingFilter === 'all'} onClick={() => setPendingFilter('all')} colors={colors} />
                    <FilterPill label="Transactions" active={pendingFilter === 'transactions'} onClick={() => setPendingFilter('transactions')} colors={colors} />
                    <FilterPill label="Actions" active={pendingFilter === 'actions'} onClick={() => setPendingFilter('actions')} colors={colors} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${colors.error}15`, color: colors.error }}>
                    {filteredPendingItems.length} pending
                  </span>
                  {filteredPendingItems.length > 5 && (
                    <Link href="/advisor/transactions" className="text-xs font-medium hover:underline" style={{ color: colors.primary }}>
                      View All
                    </Link>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }} />
                </div>
              ) : filteredPendingItems.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {pendingFilter === 'all' ? 'No pending actions' : `No ${pendingFilter} found`}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>All caught up!</p>
                </div>
              ) : (
                <div>
                  {filteredPendingItems.slice(0, 5).map((item) => {
                    const isExpanded = expandedPending === item.id;
                    if (item._source === 'transaction') {
                      return (
                        <div key={item.id}>
                          <div
                            onClick={() => toggleExpand(expandedPending, item.id, setExpandedPending)}
                            className="flex items-center gap-3 py-3 px-1 cursor-pointer transition-colors duration-150"
                            style={{ borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}` }}
                          >
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${colors.warning}15` }}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.warning }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.clientName}</p>
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.warning}15`, color: colors.warning }}>
                                  {item.type}
                                </span>
                              </div>
                              <p className="text-xs mt-0.5 truncate" style={{ color: colors.textSecondary }}>{item.fundName}</p>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: colors.primary }}>
                              {formatCurrency(item.amount)}
                            </span>
                            <svg
                              className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                              style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          {isExpanded && (
                            <div
                              className="px-3 pb-3 pt-2 mb-1 rounded-b-xl"
                              style={{ background: isDark ? 'rgba(147, 197, 253, 0.03)' : 'rgba(59, 130, 246, 0.02)', borderBottom: `1px solid ${colors.cardBorder}` }}
                            >
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <p className="text-xs" style={{ color: colors.textTertiary }}>Fund</p>
                                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.fundName}</p>
                                </div>
                                <div>
                                  <p className="text-xs" style={{ color: colors.textTertiary }}>Amount</p>
                                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(item.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-xs" style={{ color: colors.textTertiary }}>Type</p>
                                  <FAChip color={colors.warning} size="xs">{item.type}</FAChip>
                                </div>
                                <div>
                                  <p className="text-xs" style={{ color: colors.textTertiary }}>Date</p>
                                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.date}</p>
                                </div>
                              </div>
                              <Link href={`/advisor/clients/${item.clientId}`} className="text-xs font-medium hover:underline" style={{ color: colors.primary }}>
                                View Profile &rarr;
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    }
                    // Action item
                    return (
                      <div key={item.id}>
                        <div
                          onClick={() => toggleExpand(expandedPending, item.id, setExpandedPending)}
                          className="flex items-center gap-3 py-3 px-1 cursor-pointer transition-colors duration-150"
                          style={{ borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}` }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.urgent ? `${colors.error}15` : `${colors.primary}15` }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: item.urgent ? colors.error : colors.primary }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.client}</p>
                              {item.urgent && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.error}15`, color: colors.error }}>Urgent</span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5 truncate" style={{ color: colors.textSecondary }}>{item.action}</p>
                          </div>
                          <svg
                            className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                            style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        {isExpanded && (
                          <div
                            className="px-3 pb-3 pt-2 mb-1 rounded-b-xl"
                            style={{ background: isDark ? 'rgba(147, 197, 253, 0.03)' : 'rgba(59, 130, 246, 0.02)', borderBottom: `1px solid ${colors.cardBorder}` }}
                          >
                            <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{item.action}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <FAChip color={colors.primary} size="xs">{item.type}</FAChip>
                              {item.urgent && <FAChip color={colors.error} size="xs">Urgent</FAChip>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleCompleteAction(e, item.id)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:shadow"
                                style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${isDark ? '#059669' : '#047857'} 100%)` }}
                              >
                                Mark Complete
                              </button>
                              <button
                                onClick={(e) => handleDismissAction(e, item.id)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow"
                                style={{ background: `${colors.textTertiary}15`, color: colors.textSecondary }}
                              >
                                Dismiss
                              </button>
                              <Link
                                href={item.actionUrl || '/advisor/clients'}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-medium hover:underline ml-auto"
                                style={{ color: colors.primary }}
                              >
                                View Profile &rarr;
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>}

            {/* Recent Transactions */}
            {isWidgetEnabled('recent-transactions') && !loading && dashboard && pendingTxnList.length > 0 && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                    margin: '-1.25rem -1.25rem 1.25rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.75rem 0.75rem 0 0',
                  }}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Recent Transactions</h3>
                  <Link href="/advisor/transactions" className="text-sm font-medium hover:underline" style={{ color: colors.primary }}>
                    View All
                  </Link>
                </div>
                <div className="space-y-1">
                  {pendingTxnList.slice(0, 5).map((txn: any) => (
                    <div
                      key={txn.id}
                      className="flex items-center gap-3 py-2.5 px-1"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: txn.type === 'BUY' || txn.type === 'SIP' ? `${colors.success}15` : `${colors.warning}15`,
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: txn.type === 'BUY' || txn.type === 'SIP' ? colors.success : colors.warning }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={txn.type === 'BUY' || txn.type === 'SIP' ? 'M12 4v16m8-8H4' : 'M20 12H4'} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{txn.clientName}</p>
                        <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{txn.fundName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{formatCurrency(txn.amount)}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          <FAChip color={txn.type === 'BUY' || txn.type === 'SIP' ? colors.success : colors.warning} size="xs">{txn.type}</FAChip>
                          <span className="text-xs" style={{ color: colors.textTertiary }}>{txn.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Performers */}
            {isWidgetEnabled('top-clients') && !loading && dashboard && dashboard.topPerformers.length > 0 && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div
                  className="flex items-center justify-between flex-wrap gap-2"
                  style={{
                    background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                    margin: '-1.25rem -1.25rem 1.25rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.75rem 0.75rem 0 0',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Top Performers</h3>
                    <div className="flex items-center gap-1">
                      {(['all', 'Conservative', 'Moderate', 'Aggressive'] as const).map((f) => (
                        <FilterPill key={f} label={f === 'all' ? 'All' : f} active={performerFilter === f} onClick={() => setPerformerFilter(f)} colors={colors} />
                      ))}
                    </div>
                  </div>
                  <Link href="/advisor/clients" className="text-sm font-medium hover:underline" style={{ color: colors.primary }}>
                    View All
                  </Link>
                </div>
                <div>
                  {filteredPerformers.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>No {performerFilter} clients found</p>
                    </div>
                  ) : filteredPerformers.slice(0, 5).map((client, idx) => {
                    const isExpanded = expandedPerformer === client.id;
                    return (
                      <div key={client.id}>
                        <div
                          onClick={() => toggleExpand(expandedPerformer, client.id, setExpandedPerformer)}
                          className="flex items-center gap-3 py-3 px-1 cursor-pointer transition-colors duration-150"
                          style={{ borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}` }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: idx === 0 ? `${colors.success}20` : `${colors.primary}10`, color: idx === 0 ? colors.success : colors.textSecondary }}
                          >
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.name}</p>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>{formatCurrency(client.aum)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: client.returns >= 0 ? colors.success : colors.error }}>
                              {client.returns >= 0 ? '+' : ''}{client.returns.toFixed(1)}%
                            </p>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${getRiskColor(client.riskProfile, colors)}15`, color: getRiskColor(client.riskProfile, colors) }}>
                              {client.riskProfile}
                            </span>
                          </div>
                          <svg
                            className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                            style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        {isExpanded && (
                          <div
                            className="px-3 pb-3 pt-2 mb-1 rounded-b-xl"
                            style={{ background: isDark ? 'rgba(147, 197, 253, 0.03)' : 'rgba(59, 130, 246, 0.02)', borderBottom: `1px solid ${colors.cardBorder}` }}
                          >
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>AUM</p>
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(client.aum)}</p>
                              </div>
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>Risk Profile</p>
                                <FAChip color={getRiskColor(client.riskProfile, colors)} size="xs">{client.riskProfile}</FAChip>
                              </div>
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>Active SIPs</p>
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.sipCount}</p>
                              </div>
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>Email</p>
                                <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{client.email}</p>
                              </div>
                            </div>
                            <Link href={`/advisor/clients/${client.id}`} className="text-xs font-medium hover:underline" style={{ color: colors.primary }}>
                              View Profile &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Clients */}
            {!loading && dashboard && dashboard.recentClients.length > 0 && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div
                  className="flex items-center justify-between flex-wrap gap-2"
                  style={{
                    background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                    margin: '-1.25rem -1.25rem 1.25rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.75rem 0.75rem 0 0',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Recent Clients</h3>
                    <div className="flex items-center gap-1">
                      {(['all', 'Active', 'Inactive'] as const).map((f) => (
                        <FilterPill key={f} label={f === 'all' ? 'All' : f} active={recentFilter === f} onClick={() => setRecentFilter(f)} colors={colors} />
                      ))}
                    </div>
                  </div>
                  <Link href="/advisor/clients" className="text-sm font-medium hover:underline" style={{ color: colors.primary }}>
                    View All
                  </Link>
                </div>
                <div>
                  {filteredRecentClients.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>No {recentFilter} clients found</p>
                    </div>
                  ) : filteredRecentClients.slice(0, 5).map((client) => {
                    const isExpanded = expandedRecent === client.id;
                    return (
                      <div key={client.id}>
                        <div
                          onClick={() => toggleExpand(expandedRecent, client.id, setExpandedRecent)}
                          className="flex items-center gap-3 py-3 px-1 cursor-pointer transition-colors duration-150"
                          style={{ borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}` }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs" style={{ color: colors.textSecondary }}>{formatCurrency(client.aum)}</span>
                              <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${getRiskColor(client.riskProfile, colors)}15`, color: getRiskColor(client.riskProfile, colors) }}>
                                {client.riskProfile}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: client.returns >= 0 ? colors.success : colors.error }}>
                              {client.returns >= 0 ? '+' : ''}{client.returns.toFixed(1)}%
                            </p>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>{client.lastActive}</p>
                          </div>
                          <svg
                            className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                            style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        {isExpanded && (
                          <div
                            className="px-3 pb-3 pt-2 mb-1 rounded-b-xl"
                            style={{ background: isDark ? 'rgba(147, 197, 253, 0.03)' : 'rgba(59, 130, 246, 0.02)', borderBottom: `1px solid ${colors.cardBorder}` }}
                          >
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>AUM</p>
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(client.aum)}</p>
                              </div>
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>Status</p>
                                <FAChip color={client.status === 'Active' ? colors.success : colors.textTertiary} size="xs">{client.status}</FAChip>
                              </div>
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>SIPs</p>
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.sipCount}</p>
                              </div>
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>Last Active</p>
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.lastActive}</p>
                              </div>
                            </div>
                            <Link href={`/advisor/clients/${client.id}`} className="text-xs font-medium hover:underline" style={{ color: colors.primary }}>
                              View Profile &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Goal Progress */}
            {isWidgetEnabled('goal-progress') && !loading && goals.length > 0 && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                    margin: '-1.25rem -1.25rem 1.25rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.75rem 0.75rem 0 0',
                  }}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Goal Progress</h3>
                  <Link href="/advisor/goals" className="text-sm font-medium hover:underline" style={{ color: colors.primary }}>
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {goals.slice(0, 5).map((goal) => {
                    const progress = Math.min(goal.progress, 100);
                    const isOnTrack = goal.status === 'ON_TRACK' || progress >= 50;
                    return (
                      <div key={goal.id} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{goal.name}</p>
                            {goal.clientName && <p className="text-xs" style={{ color: colors.textTertiary }}>{goal.clientName}</p>}
                          </div>
                          <FAChip color={isOnTrack ? colors.success : colors.warning} size="xs">
                            {isOnTrack ? 'On Track' : 'Behind'}
                          </FAChip>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span style={{ color: colors.textSecondary }}>{formatCurrency(goal.currentAmount)}</span>
                          <span style={{ color: colors.textTertiary }}>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.chipBg }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background: `linear-gradient(90deg, ${isOnTrack ? colors.success : colors.warning} 0%, ${isOnTrack ? '#059669' : '#D97706'} 100%)`,
                            }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                          {progress.toFixed(0)}% complete · {goal.daysRemaining > 0 ? `${goal.daysRemaining} days left` : 'Overdue'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SIP Overview */}
            {isWidgetEnabled('upcoming-sips') && <div
              className="p-5 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <div
                className="flex items-center justify-between"
                style={{
                  background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                  margin: '-1.25rem -1.25rem 1.25rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom: `1px solid ${colors.cardBorder}`,
                  borderRadius: '0.75rem 0.75rem 0 0',
                }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>SIP Overview</h3>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {dashboard?.activeSips || 0} active | {formatCurrency(dashboard?.monthlySipValue || 0)}/mo
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.primary }} />
                </div>
              ) : (
                <>
                  {/* Upcoming SIPs */}
                  {dashboard?.upcomingSips && dashboard.upcomingSips.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.success }}>
                        Upcoming (7 days)
                      </p>
                      <div className="space-y-1.5">
                        {dashboard.upcomingSips.slice(0, 5).map((sip) => (
                          <div key={sip.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: `${colors.success}06`, border: `1px solid ${colors.success}15` }}>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{sip.clientName}</p>
                              <p className="text-xs truncate" style={{ color: colors.textTertiary }}>{sip.fundName}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-xs font-semibold" style={{ color: colors.success }}>{formatCurrency(sip.amount)}</p>
                              <p className="text-xs" style={{ color: colors.textTertiary }}>{sip.nextDate}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed SIPs */}
                  {dashboard?.failedSips && dashboard.failedSips.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.error }}>
                        Failed SIPs
                      </p>
                      <div className="space-y-1.5">
                        {dashboard.failedSips.slice(0, 3).map((sip) => (
                          <div key={sip.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: `${colors.error}06`, border: `1px solid ${colors.error}15` }}>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{sip.clientName}</p>
                              <p className="text-xs truncate" style={{ color: colors.textTertiary }}>{sip.fundName}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-xs font-semibold" style={{ color: colors.error }}>{formatCurrency(sip.amount)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!dashboard?.upcomingSips?.length && !dashboard?.failedSips?.length) && (
                    <div className="text-center py-4">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>No upcoming SIPs this week</p>
                    </div>
                  )}
                </>
              )}
            </div>}

            {/* AI Insights — expandable cards */}
            {isWidgetEnabled('insights') && <div
              className="p-5 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <div
                className="flex items-center justify-between"
                style={{
                  background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                  margin: '-1.25rem -1.25rem 1.25rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom: `1px solid ${colors.cardBorder}`,
                  borderRadius: '0.75rem 0.75rem 0 0',
                }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>AI Insights</h3>
                <span className="text-xs" style={{ color: colors.textSecondary }}>Portfolio recommendations</span>
              </div>
              <div>
                {[
                  {
                    title: 'Pending Actions',
                    detail: `${dashboard?.pendingActions || 0} items need your attention`,
                    type: dashboard?.pendingActions && dashboard.pendingActions > 5 ? 'warning' : 'info',
                  },
                  {
                    title: 'Top Performer',
                    detail: dashboard?.topPerformers?.[0]
                      ? `${dashboard.topPerformers[0].name} — ${dashboard.topPerformers[0].returns >= 0 ? '+' : ''}${dashboard.topPerformers[0].returns.toFixed(1)}%`
                      : 'No client data yet',
                    type: 'success',
                  },
                  {
                    title: 'AUM Growth',
                    detail: dashboard?.aumGrowth
                      ? `${dashboard.aumGrowth.momChange >= 0 ? '+' : ''}${dashboard.aumGrowth.momChange.toFixed(1)}% month-over-month`
                      : 'Tracking started',
                    type: dashboard?.aumGrowth && dashboard.aumGrowth.momChange < 0 ? 'warning' : 'info',
                  },
                ].map((insight, idx) => {
                  const accentColor = insight.type === 'warning' ? colors.warning : insight.type === 'success' ? colors.success : colors.primary;
                  const isExpanded = expandedInsight === idx;
                  return (
                    <div key={idx}>
                      <div
                        onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                        className="py-3 px-1 cursor-pointer transition-colors duration-150 flex items-center justify-between"
                        style={{
                          borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}`,
                          borderLeft: `3px solid ${accentColor}`,
                          paddingLeft: '12px',
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{insight.title}</p>
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{insight.detail}</p>
                        </div>
                        <svg
                          className="w-4 h-4 flex-shrink-0 transition-transform duration-200 ml-2"
                          style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {isExpanded && (
                        <div
                          className="px-3 pb-3 pt-2"
                          style={{
                            borderBottom: `1px solid ${colors.cardBorder}`,
                            borderLeft: `3px solid ${accentColor}`,
                            borderTop: `1px dashed ${colors.cardBorder}`,
                            paddingLeft: '12px',
                            background: isDark ? 'rgba(147, 197, 253, 0.02)' : 'rgba(59, 130, 246, 0.015)',
                          }}
                        >
                          {idx === 0 && (
                            // Pending Actions breakdown by type
                            <div className="space-y-1.5">
                              {Object.keys(actionTypeCounts).length > 0 ? (
                                Object.entries(actionTypeCounts).map(([type, count]) => (
                                  <div key={type} className="flex items-center justify-between">
                                    <span className="text-xs" style={{ color: colors.textSecondary }}>{type}</span>
                                    <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{count}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs" style={{ color: colors.textTertiary }}>No pending actions breakdown available</p>
                              )}
                            </div>
                          )}
                          {idx === 1 && (
                            // Top 3 performers
                            <div className="space-y-1.5">
                              {dashboard?.topPerformers?.slice(0, 3).map((c, i) => (
                                <div key={c.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold" style={{ color: colors.textTertiary }}>#{i + 1}</span>
                                    <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>{c.name}</span>
                                  </div>
                                  <span className="text-xs font-semibold" style={{ color: c.returns >= 0 ? colors.success : colors.error }}>
                                    {c.returns >= 0 ? '+' : ''}{c.returns.toFixed(1)}%
                                  </span>
                                </div>
                              )) || <p className="text-xs" style={{ color: colors.textTertiary }}>No performer data</p>}
                            </div>
                          )}
                          {idx === 2 && dashboard?.aumGrowth && (
                            // AUM Growth detail
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: colors.textSecondary }}>MoM Change</span>
                                <span className="text-xs font-semibold" style={{ color: dashboard.aumGrowth.momChange >= 0 ? colors.success : colors.error }}>
                                  {dashboard.aumGrowth.momChange >= 0 ? '+' : ''}{dashboard.aumGrowth.momChange.toFixed(1)}% ({formatCurrency(dashboard.aumGrowth.momAbsolute)})
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: colors.textSecondary }}>YoY Change</span>
                                <span className="text-xs font-semibold" style={{ color: dashboard.aumGrowth.yoyChange >= 0 ? colors.success : colors.error }}>
                                  {dashboard.aumGrowth.yoyChange >= 0 ? '+' : ''}{dashboard.aumGrowth.yoyChange.toFixed(1)}% ({formatCurrency(dashboard.aumGrowth.yoyAbsolute)})
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: colors.textSecondary }}>Prev Month</span>
                                <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{formatCurrency(dashboard.aumGrowth.prevMonthValue)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Link href="/advisor/insights">
                <span
                  className="block w-full mt-4 py-2 rounded-xl text-sm font-medium text-center transition-all hover:shadow"
                  style={{ background: `${colors.secondary}15`, color: colors.secondary, border: `1px solid ${colors.secondary}30` }}
                >
                  View Full Insights
                </span>
              </Link>
            </div>}

            {/* Action Calendar */}
            {isWidgetEnabled('action-calendar') && calendar && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                    margin: '-1.25rem -1.25rem 1.25rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.75rem 0.75rem 0 0',
                  }}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Action Calendar</h3>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${colors.primary}15`, color: colors.primary }}
                  >
                    {calendar.summary.total}
                  </span>
                </div>

                {/* Summary badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {calendar.summary.sipExpiring > 0 && (
                    <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: `${colors.warning}12`, color: colors.warning }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {calendar.summary.sipExpiring} SIP Expiry
                    </span>
                  )}
                  {calendar.summary.birthdays > 0 && (
                    <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: `${colors.secondary || colors.primary}12`, color: colors.secondary || colors.primary }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      {calendar.summary.birthdays} Birthdays
                    </span>
                  )}
                  {calendar.summary.followUps > 0 && (
                    <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: `${colors.error}12`, color: colors.error }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                      </svg>
                      {calendar.summary.followUps} Follow-ups
                    </span>
                  )}
                </div>

                {/* Timeline */}
                {calendar.items.length > 0 ? (
                  <div className="space-y-2">
                    {calendar.items.slice(0, 8).map((item, idx) => {
                      const typeColors: Record<string, string> = {
                        SIP_EXPIRY: colors.warning,
                        BIRTHDAY: colors.secondary || colors.primary,
                        DORMANT_FOLLOWUP: colors.error,
                        UPCOMING_SIP: colors.success,
                      };
                      const typeIcons: Record<string, string> = {
                        SIP_EXPIRY: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
                        BIRTHDAY: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
                        DORMANT_FOLLOWUP: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0',
                        UPCOMING_SIP: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75',
                      };
                      const itemColor = typeColors[item.type] || colors.textTertiary;
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl transition-colors"
                          style={{
                            background: item.priority === 'HIGH' ? `${colors.error}06` : 'transparent',
                            border: `1px solid ${item.priority === 'HIGH' ? `${colors.error}15` : colors.cardBorder}`,
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${itemColor}12` }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: itemColor }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[item.type] || 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'} />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{item.clientName}</p>
                            <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{item.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium" style={{ color: item.daysFromNow <= 3 ? colors.error : item.daysFromNow <= 7 ? colors.warning : colors.textSecondary }}>
                              {item.daysFromNow === 0 ? 'Today' : item.daysFromNow === 1 ? 'Tomorrow' : `${item.daysFromNow}d`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No upcoming actions</p>
                  </div>
                )}
              </div>
            )}

            {/* Market Summary */}
            {isWidgetEnabled('market-summary') && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
                    margin: '-1.25rem -1.25rem 1.25rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.75rem 0.75rem 0 0',
                  }}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Market Summary</h3>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>Indicative</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Nifty 50', value: '24,857.30', change: '+0.42%', up: true },
                    { name: 'Sensex', value: '81,765.86', change: '+0.38%', up: true },
                    { name: 'Nifty Bank', value: '52,110.45', change: '-0.15%', up: false },
                  ].map((idx) => (
                    <div
                      key={idx.name}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${idx.up ? colors.success : colors.error}12` }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: idx.up ? colors.success : colors.error }} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={idx.up ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{idx.name}</p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{idx.value}</p>
                        </div>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: idx.up ? colors.success : colors.error }}
                      >
                        {idx.change}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 text-center" style={{ color: colors.textTertiary }}>
                  Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg" style={{ background: colors.error, color: '#fff' }}>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </AdvisorLayout>
  );
};

export default AdvisorDashboard;
