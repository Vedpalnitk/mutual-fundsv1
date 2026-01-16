import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/utils/formatters';

// V4 Color Palette - Refined Blue
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.08)',
  chipBorder: 'rgba(37, 99, 235, 0.15)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
};

const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  secondary: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  background: '#0F172A',
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.12)',
  chipBorder: 'rgba(96, 165, 250, 0.2)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
};

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

// Hook to get current V4 colors
const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

interface PortfolioCardProps {
  title: string;
  value: number;
  changePct: number;
  series: number[];
  confidence: string;
  ctaLabel: string;
}

const PortfolioCard = ({ title, value, changePct, series, confidence, ctaLabel }: PortfolioCardProps) => {
  const colors = useV4Colors();
  const isDark = useDarkMode();

  const max = Math.max(...series);
  const min = Math.min(...series);
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min || 1)) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  // Dynamic gradient IDs to avoid conflicts
  const gradientId = `portfolioGradient-${Math.random().toString(36).substr(2, 9)}`;
  const lineGradientId = `lineGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{title}</p>
          <h2 className="text-3xl font-bold mt-1 tracking-tight" style={{ color: colors.textPrimary }}>
            {formatCurrency(value)}
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <span
              className="text-xs px-2.5 py-1 rounded font-semibold"
              style={{
                background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                color: colors.success
              }}
            >
              {formatPercent(changePct)}
            </span>
            <p className="text-xs" style={{ color: colors.textSecondary }}>Projected CAGR</p>
            <span
              className="text-xs px-2.5 py-1 rounded"
              style={{
                background: colors.chipBg,
                color: colors.primary,
                border: `1px solid ${colors.chipBorder}`
              }}
            >
              Confidence: {confidence}
            </span>
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            boxShadow: `0 4px 14px ${colors.glassShadow}`
          }}
        >
          {ctaLabel}
        </button>
      </div>

      {/* Chart */}
      <div
        className="relative p-4 rounded-xl"
        style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
      >
        <svg viewBox="0 0 100 60" className="w-full h-32" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
              <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.15" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={lineGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="50%" stopColor={colors.secondary} />
              <stop offset="100%" stopColor="#AF52DE" />
            </linearGradient>
          </defs>
          {/* Fill area */}
          <polyline
            fill={`url(#${gradientId})`}
            stroke="none"
            points={`0,60 ${points} 100,60`}
          />
          {/* Line */}
          <polyline
            fill="none"
            stroke={`url(#${lineGradientId})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {/* End dot */}
          <circle
            cx={100}
            cy={series.length > 0 ? 60 - ((series[series.length - 1] - min) / (max - min || 1)) * 60 : 30}
            r="4"
            fill={colors.primary}
            className="drop-shadow-md"
          />
        </svg>

        {/* Chart Labels */}
        <div className="mt-4 flex items-center justify-between text-xs" style={{ color: colors.textSecondary }}>
          <span>Goal year projection</span>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            />
            <span>Auto-refreshes monthly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
