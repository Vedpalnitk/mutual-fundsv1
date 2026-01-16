import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/utils/formatters';

// V4 Color Palette
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.08)',
  chipBorder: 'rgba(37, 99, 235, 0.15)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  progressBg: 'rgba(37, 99, 235, 0.1)',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
};

const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  secondary: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.12)',
  chipBorder: 'rgba(96, 165, 250, 0.2)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  progressBg: 'rgba(96, 165, 250, 0.15)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
};

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

const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

interface FundRow {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  risk: string;
  returns3y: number;
  returns5y: number;
  allocation: number;
  minSip: number;
}

interface HoldingsTableProps {
  rows: FundRow[];
}

const HoldingsTable = ({ rows }: HoldingsTableProps) => {
  const colors = useV4Colors();
  const isDark = useDarkMode();

  const getRiskStyle = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return { bg: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: colors.success };
      case 'moderate':
        return { bg: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)', color: colors.primary };
      case 'high':
        return { bg: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: colors.error };
      default:
        return { bg: colors.chipBg, color: colors.textSecondary };
    }
  };

  return (
    <div
      className="p-5 rounded-xl overflow-hidden"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Recommended Funds</h3>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2.5 py-1 rounded"
            style={{ background: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)', color: colors.primary }}
          >
            Direct Plans
          </span>
          <span
            className="text-xs px-2.5 py-1 rounded"
            style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
          >
            Goal Aligned
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.chipBorder}` }}>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Fund</th>
              <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Category</th>
              <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>3Y Return</th>
              <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>5Y Return</th>
              <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Allocation</th>
              <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Min SIP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const riskStyle = getRiskStyle(row.risk);
              return (
                <tr
                  key={row.id}
                  className="transition-colors"
                  style={{ borderBottom: index < rows.length - 1 ? `1px solid ${colors.chipBorder}` : undefined }}
                >
                  <td className="py-4">
                    <div>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{row.name}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                        style={{ background: riskStyle.bg, color: riskStyle.color }}
                      >
                        {row.risk} Risk
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-sm" style={{ color: colors.textPrimary }}>{row.category}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>{row.subCategory}</p>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-semibold" style={{ color: colors.success }}>{formatPercent(row.returns3y)}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-semibold" style={{ color: colors.success }}>{formatPercent(row.returns5y)}</span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(row.allocation * 3, 100)}%`,
                            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                          }}
                        />
                      </div>
                      <span className="font-bold w-10" style={{ color: colors.textPrimary }}>{row.allocation}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-right" style={{ color: colors.textSecondary }}>
                    {formatCurrency(row.minSip)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;
