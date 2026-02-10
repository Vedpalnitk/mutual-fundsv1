import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdvisorLayout from '@/components/layout/AdvisorLayout';
import { useFATheme, formatCurrency, getRiskColor } from '@/utils/fa';
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
} from '@/services/api';

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

function formatGrowth(growth: KpiGrowth | null): string {
  if (!growth) return '--';
  const val = growth.momChange;
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}% MoM`;
}

const AdvisorDashboard = () => {
  const { isDark, colors } = useFATheme();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [dashData, actionsData] = await Promise.allSettled([
          advisorDashboardApi.get(),
          actionsApi.list({ isCompleted: false, isDismissed: false, limit: 10 }),
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'TOTAL AUM',
              value: loading ? '...' : formatCurrency(dashboard?.totalAum || 0),
              change: loading ? '...' : formatGrowth(dashboard?.aumGrowth || null),
              variant: 'primary',
            },
            {
              label: 'TOTAL CLIENTS',
              value: loading ? '...' : (dashboard?.totalClients || 0).toString(),
              change: loading ? '...' : formatGrowth(dashboard?.clientsGrowth || null),
              variant: 'secondary',
            },
            {
              label: 'AVG. RETURNS',
              value: loading ? '...' : `${(dashboard?.avgReturns || 0).toFixed(1)}%`,
              change: loading ? '...' : `${(dashboard?.activeSips || 0)} active SIPs`,
              variant: 'success',
            },
            {
              label: 'MONTHLY SIP',
              value: loading ? '...' : formatCurrency(dashboard?.monthlySipValue || 0),
              change: loading ? '...' : formatGrowth(dashboard?.sipsGrowth || null),
              variant: 'accent',
            },
          ].map((kpi) => {
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
                className="p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: getGradient(),
                  boxShadow: `0 8px 32px ${isDark ? 'rgba(168, 85, 247, 0.25)' : `${colors.primary}25`}`
                }}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{kpi.label}</p>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Actions */}
            <div
              className="p-5 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.warning} 0%, #D97706 100%)` }}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Pending Actions</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${colors.error}15`, color: colors.error }}>
                  {dashboard?.pendingActions || pendingActions.filter(a => a.urgent).length} pending
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }} />
                </div>
              ) : pendingActions.length === 0 && (!dashboard?.pendingTransactions || dashboard.pendingTransactions.length === 0) ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>No pending actions</p>
                  <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>All caught up!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Show pending transactions from dashboard API */}
                  {dashboard?.pendingTransactions?.map((txn) => (
                    <Link
                      key={txn.id}
                      href={`/advisor/clients/${txn.clientId}`}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(216, 180, 254, 0.06) 0%, rgba(249, 168, 212, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(244, 114, 182, 0.01) 100%)',
                        border: `1px solid ${colors.warning}30`,
                        boxShadow: `0 4px 20px ${colors.glassShadow}`
                      }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${colors.warning}15` }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.warning }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{txn.clientName}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.warning}15`, color: colors.warning }}>
                            {txn.type}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: colors.textSecondary }}>{txn.fundName}</p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: colors.primary }}>
                        {formatCurrency(txn.amount)}
                      </span>
                    </Link>
                  ))}
                  {/* Show action-based pending items */}
                  {pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(216, 180, 254, 0.06) 0%, rgba(249, 168, 212, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(244, 114, 182, 0.01) 100%)',
                        border: `1px solid ${action.urgent ? colors.error + '30' : colors.cardBorder}`,
                        boxShadow: `0 4px 20px ${colors.glassShadow}`
                      }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: action.urgent ? `${colors.error}15` : `${colors.primary}15` }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: action.urgent ? colors.error : colors.primary }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{action.client}</p>
                          {action.urgent && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.error}15`, color: colors.error }}>Urgent</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: colors.textSecondary }}>{action.action}</p>
                      </div>
                      <Link
                        href={action.actionUrl || '/advisor/clients'}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow"
                        style={{ background: `${colors.primary}15`, color: colors.primary }}
                      >
                        Action
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performers */}
            {!loading && dashboard && dashboard.topPerformers.length > 0 && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)` }}>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Top Performers</h3>
                  </div>
                  <Link href="/advisor/clients" className="text-sm font-medium hover:underline" style={{ color: colors.primary }}>
                    View All
                  </Link>
                </div>
                <div className="space-y-2">
                  {dashboard.topPerformers.map((client, idx) => (
                    <Link
                      key={client.id}
                      href={`/advisor/clients/${client.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(216, 180, 254, 0.06) 0%, rgba(249, 168, 212, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(244, 114, 182, 0.01) 100%)',
                        border: `1px solid ${colors.cardBorder}`,
                        boxShadow: `0 4px 20px ${colors.glassShadow}`
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: idx === 0 ? `${colors.success}20` : `${colors.primary}10`, color: idx === 0 ? colors.success : colors.textSecondary }}
                      >
                        #{idx + 1}
                      </div>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-xs"
                        style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                      >
                        {client.name.split(' ').map(n => n[0]).join('')}
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
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Clients */}
            {!loading && dashboard && dashboard.recentClients.length > 0 && (
              <div
                className="p-5 rounded-xl"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Recent Clients</h3>
                  </div>
                  <Link href="/advisor/clients" className="text-sm font-medium hover:underline" style={{ color: colors.primary }}>
                    View All
                  </Link>
                </div>
                <div className="space-y-2">
                  {dashboard.recentClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/advisor/clients/${client.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(216, 180, 254, 0.06) 0%, rgba(249, 168, 212, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(244, 114, 182, 0.01) 100%)',
                        border: `1px solid ${colors.cardBorder}`,
                        boxShadow: `0 4px 20px ${colors.glassShadow}`
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
                        style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                      >
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </div>
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
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SIP Overview */}
            <div
              className="p-5 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>SIP Overview</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {dashboard?.activeSips || 0} active | {formatCurrency(dashboard?.monthlySipValue || 0)}/mo
                  </p>
                </div>
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
            </div>

            {/* AI Insights — now driven by real data */}
            <div
              className="p-5 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.secondary} 0%, #7C3AED 100%)` }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>AI Insights</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Portfolio recommendations</p>
                </div>
              </div>
              <div className="space-y-3">
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
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(216, 180, 254, 0.06) 0%, rgba(249, 168, 212, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(244, 114, 182, 0.01) 100%)',
                        border: `1px solid ${isDark ? `${accentColor}20` : `${accentColor}15`}`,
                        borderLeft: `4px solid ${accentColor}`,
                        boxShadow: `0 4px 20px ${colors.glassShadow}`
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{insight.title}</p>
                      <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{insight.detail}</p>
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
            </div>
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
