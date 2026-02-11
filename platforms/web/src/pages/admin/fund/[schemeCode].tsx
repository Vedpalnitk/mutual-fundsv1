import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import FundNavChart from '@/components/advisor/FundNavChart';
import { liveFundsApi, LiveFundWithMetrics } from '@/services/api';
import { useAdminColors, useDarkMode } from '@/utils/useAdminColors';

// Risk level info based on riskRating (1-5)
const getRiskInfo = (riskRating?: number) => {
  switch (riskRating) {
    case 1: return { label: 'Low Risk', color: '#10B981', description: 'Suitable for conservative investors' };
    case 2: return { label: 'Moderately Low', color: '#38BDF8', description: 'Lower than average risk' };
    case 3: return { label: 'Moderate', color: '#F59E0B', description: 'Balanced risk-reward profile' };
    case 4: return { label: 'Moderately High', color: '#F97316', description: 'Higher than average risk' };
    case 5: return { label: 'Very High Risk', color: '#EF4444', description: 'Suitable for aggressive investors' };
    default: return { label: 'Unknown', color: '#94A3B8', description: 'Risk level not available' };
  }
};

// Display labels for asset classes
const assetClassLabels: Record<string, string> = {
  'equity': 'Equity',
  'debt': 'Debt',
  'hybrid': 'Hybrid',
  'liquid': 'Liquid',
  'gold': 'Gold',
  'international': 'International',
};

const getAssetClassColor = (assetClass: string, colors: ReturnType<typeof useAdminColors>) => {
  switch (assetClass.toLowerCase()) {
    case 'equity': return colors.primary;
    case 'debt': return colors.success;
    case 'hybrid': return colors.secondary;
    case 'liquid': return '#06B6D4'; // cyan
    case 'gold': return colors.warning;
    case 'international': return '#8B5CF6'; // violet
    default: return colors.textTertiary;
  }
};

export default function AdminFundDetailsPage() {
  const router = useRouter();
  const { schemeCode } = router.query;
  const colors = useAdminColors();
  const isDark = useDarkMode();

  const [fund, setFund] = useState<LiveFundWithMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schemeCode) return;

    const loadFund = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await liveFundsApi.getDetails(Number(schemeCode));
        setFund(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fund details');
      } finally {
        setLoading(false);
      }
    };
    loadFund();
  }, [schemeCode]);

  if (loading) {
    return (
      <AdminLayout title="Fund Details">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <div className="flex flex-col items-center justify-center py-24">
            <svg className="w-8 h-8 animate-spin mb-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p style={{ color: colors.textSecondary }}>Loading fund details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !fund) {
    return (
      <AdminLayout title="Fund Details">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <div className="text-center py-24">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium text-lg mb-2" style={{ color: colors.error }}>{error || 'Fund not found'}</p>
            <button
              onClick={() => router.push('/admin/funds')}
              className="mt-4 px-6 py-2 rounded-full text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: 'white'
              }}
            >
              Back to Funds
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const riskInfo = getRiskInfo(fund.riskRating);
  const assetClassColor = getAssetClassColor(fund.assetClass, colors);

  return (
    <AdminLayout title={fund.schemeName}>
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Back Button & Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/funds')}
            className="flex items-center gap-2 text-sm mb-4 transition-colors hover:opacity-80"
            style={{ color: colors.textSecondary }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Funds
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background: `${assetClassColor}15`,
                    color: assetClassColor,
                    border: `1px solid ${assetClassColor}30`
                  }}
                >
                  {assetClassLabels[fund.assetClass] || fund.assetClass}
                </span>
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background: `${riskInfo.color}15`,
                    color: riskInfo.color,
                  }}
                >
                  {riskInfo.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                {fund.schemeName}
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {fund.fundHouse} &bull; {fund.category}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  color: 'white'
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Fund
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2/3) */}
          <div className="col-span-2 space-y-6">
            {/* NAV Performance Chart */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                  : '#FFFFFF',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? `0 4px 20px ${colors.glassShadow}` : '0 4px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                NAV Performance
              </h2>
              <FundNavChart schemeCode={Number(schemeCode)} isDark={isDark} />
            </div>

            {/* Returns Comparison */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                  : '#FFFFFF',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? `0 4px 20px ${colors.glassShadow}` : '0 4px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Returns
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: '1 Day', value: fund.dayChangePercent, suffix: '%' },
                  { label: '1 Year', value: fund.return1Y, suffix: '%' },
                  { label: '3 Year', value: fund.return3Y, suffix: '%' },
                  { label: '5 Year', value: fund.return5Y, suffix: '%' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="p-4 rounded-xl text-center"
                    style={{ background: colors.chipBg }}
                  >
                    <p className="text-xs mb-1" style={{ color: colors.textTertiary }}>{item.label}</p>
                    <p
                      className="text-xl font-bold"
                      style={{
                        color: item.value !== undefined
                          ? item.value >= 0 ? colors.success : colors.error
                          : colors.textTertiary
                      }}
                    >
                      {item.value !== undefined
                        ? `${item.value >= 0 ? '+' : ''}${item.value.toFixed(2)}${item.suffix}`
                        : '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fund Information */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                  : '#FFFFFF',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? `0 4px 20px ${colors.glassShadow}` : '0 4px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Fund Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Scheme Type', value: fund.schemeType },
                  { label: 'Asset Class', value: assetClassLabels[fund.assetClass] || fund.assetClass },
                  { label: 'Category', value: fund.category },
                  { label: 'Fund House', value: fund.fundHouse },
                  { label: 'ISIN', value: fund.isin || '-' },
                  { label: 'Scheme Code', value: fund.schemeCode.toString() },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <span className="text-sm" style={{ color: colors.textTertiary }}>{item.label}</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Fund Facts */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                  : '#FFFFFF',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? `0 4px 20px ${colors.glassShadow}` : '0 4px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Fund Facts
              </h3>

              {/* Current NAV */}
              <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <p className="text-xs mb-1" style={{ color: colors.textTertiary }}>Current NAV</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {fund.currentNav.toFixed(4)}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: fund.dayChangePercent >= 0 ? colors.success : colors.error }}
                  >
                    {fund.dayChangePercent >= 0 ? '+' : ''}{fund.dayChangePercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                  {fund.dayChange >= 0 ? '+' : ''}{fund.dayChange.toFixed(4)} today
                </p>
              </div>

              {/* Returns */}
              <div className="space-y-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                {[
                  { label: '1Y Return', value: fund.return1Y },
                  { label: '3Y Return', value: fund.return3Y },
                  { label: '5Y Return', value: fund.return5Y },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: colors.textTertiary }}>{item.label}</span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: item.value !== undefined
                          ? item.value >= 0 ? colors.success : colors.error
                          : colors.textTertiary
                      }}
                    >
                      {item.value !== undefined ? `${item.value >= 0 ? '+' : ''}${item.value.toFixed(2)}%` : '-'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Risk Level */}
              <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>Risk Level</p>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-2 flex-1 rounded-full overflow-hidden"
                    style={{ background: colors.progressBg }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(fund.riskRating || 3) * 20}%`,
                        background: `linear-gradient(90deg, ${colors.success} 0%, ${colors.warning} 50%, ${colors.error} 100%)`
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium" style={{ color: riskInfo.color }}>
                    {riskInfo.label}
                  </span>
                  {fund.crisilRating && (
                    <span className="text-xs" style={{ color: colors.textTertiary }}>
                      CRISIL: {fund.crisilRating}
                    </span>
                  )}
                </div>
              </div>

              {/* Fund Rating & Metrics */}
              <div className="space-y-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                {/* Star Rating */}
                {fund.fundRating && fund.fundRating > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: colors.textTertiary }}>Rating</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4"
                          fill={i < fund.fundRating! ? colors.warning : 'none'}
                          stroke={colors.warning}
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expense Ratio */}
                {fund.expenseRatio !== undefined && fund.expenseRatio > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: colors.textTertiary }}>Expense Ratio</span>
                    <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {fund.expenseRatio.toFixed(2)}%
                    </span>
                  </div>
                )}

                {/* AUM */}
                {fund.aum !== undefined && fund.aum > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: colors.textTertiary }}>AUM</span>
                    <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {fund.aum >= 1000
                        ? `₹${(fund.aum / 1000).toFixed(2)}K Cr`
                        : `₹${fund.aum.toFixed(0)} Cr`}
                    </span>
                  </div>
                )}

                {/* Volatility */}
                {fund.volatility !== undefined && fund.volatility > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: colors.textTertiary }}>Volatility</span>
                    <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {fund.volatility.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Fund Manager */}
              {fund.fundManager && (
                <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>Fund Manager</p>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {fund.fundManager}
                  </p>
                </div>
              )}

              {/* Category */}
              <div>
                <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>Category</p>
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium inline-block"
                  style={{
                    background: `${assetClassColor}15`,
                    color: assetClassColor,
                  }}
                >
                  {fund.category}
                </span>
              </div>
            </div>

            {/* Admin Actions */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                  : '#FFFFFF',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? `0 4px 20px ${colors.glassShadow}` : '0 4px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Admin Actions
              </h3>
              <div className="space-y-3">
                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    color: 'white'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync NAV Data
                </button>
                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: colors.chipBg,
                    border: `1px solid ${colors.chipBorder}`,
                    color: colors.primary
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Metadata
                </button>
                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: colors.chipBg,
                    border: `1px solid ${colors.chipBorder}`,
                    color: colors.primary
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
