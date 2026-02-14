import { useState, useEffect, useRef } from 'react'
import {
  advisorInsightsApi,
  StrategicInsights,
  FundOverlapItem,
  ConcentrationAlert,
} from '@/services/api'
import {
  useFATheme,
  formatCurrencyCompact,
} from '@/utils/fa'
import { FACard, FAEmptyState } from '@/components/advisor/shared'

export default function StrategicInsightsSection() {
  const { colors, isDark } = useFATheme()
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [data, setData] = useState<StrategicInsights | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  const loadData = async () => {
    if (loaded) return
    setLoading(true)
    setError(null)
    try {
      const result = await advisorInsightsApi.getStrategicInsights()
      setData(result)
      setLoaded(true)
    } catch (err: any) {
      setError(err.message || 'Failed to load strategic insights')
    } finally {
      setLoading(false)
    }
  }

  // Intersection observer for lazy loading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded && !loading) {
          loadData()
        }
      },
      { threshold: 0.1 },
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [loaded, loading])

  const hasData = data && (
    data.fundOverlap.length > 0 ||
    data.concentrationAlerts.length > 0 ||
    data.aumDistribution.some(b => b.count > 0) ||
    data.riskDistribution.length > 0
  )

  return (
    <div ref={sectionRef} className="mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.chipBg }}>
            <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Strategic Intelligence</h3>
            <p className="text-xs" style={{ color: colors.textTertiary }}>Cross-portfolio patterns and concentration analysis</p>
          </div>
        </div>
        {!loaded && !loading && (
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-full text-xs font-semibold text-white transition-all hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
          >
            Load Strategic Insights
          </button>
        )}
        {loading && (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
            />
            <span className="text-xs" style={{ color: colors.textSecondary }}>Analyzing portfolio...</span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl mb-4" style={{ background: `${colors.error}08`, border: `1px solid ${colors.error}20` }}>
          <p className="text-sm" style={{ color: colors.error }}>{error}</p>
          <button onClick={() => { setLoaded(false); loadData() }} className="text-xs font-medium mt-1" style={{ color: colors.primary }}>
            Retry
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <FACard key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 rounded w-1/3" style={{ background: colors.chipBg }} />
                <div className="h-20 rounded" style={{ background: colors.chipBg }} />
                <div className="h-3 rounded w-2/3" style={{ background: colors.chipBg }} />
              </div>
            </FACard>
          ))}
        </div>
      )}

      {/* Data */}
      {loaded && hasData && (
        <div className="grid grid-cols-2 gap-4">
          {/* Fund Overlap */}
          <FACard>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
                <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund Overlap</span>
            </div>
            {data!.fundOverlap.length === 0 ? (
              <p className="text-xs" style={{ color: colors.textTertiary }}>No funds shared across clients</p>
            ) : (
              <div className="space-y-2">
                {data!.fundOverlap.slice(0, 6).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{item.fundName}</p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        {item.clients.join(', ')}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ background: `${colors.primary}12`, color: colors.primary }}
                      >
                        {item.clientCount} clients
                      </span>
                      <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{formatCurrencyCompact(item.totalValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FACard>

          {/* Concentration Alerts */}
          <FACard>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${colors.warning}12` }}>
                <svg className="w-4 h-4" style={{ color: colors.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.warning }}>Concentration Risk</span>
            </div>
            {data!.concentrationAlerts.length === 0 ? (
              <p className="text-xs" style={{ color: colors.textTertiary }}>No concentration risks detected</p>
            ) : (
              <div className="space-y-2">
                {data!.concentrationAlerts.slice(0, 6).map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: `${colors.warning}06` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>{alert.clientName}</p>
                      <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                        {alert.name}
                        <span className="ml-1 px-1 py-0 rounded text-xs" style={{ background: colors.chipBg, color: colors.textSecondary }}>
                          {alert.type}
                        </span>
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <span className="text-sm font-semibold" style={{ color: alert.percentage > 60 ? colors.error : colors.warning }}>
                        {alert.percentage.toFixed(1)}%
                      </span>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>{formatCurrencyCompact(alert.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FACard>

          {/* AUM Distribution */}
          <FACard>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${colors.success}12` }}>
                <svg className="w-4 h-4" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.success }}>AUM Distribution</span>
            </div>
            <div className="space-y-2">
              {data!.aumDistribution
                .filter(b => b.count > 0)
                .map((bucket, i) => {
                  const maxCount = Math.max(...data!.aumDistribution.map(b => b.count), 1)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-16 flex-shrink-0" style={{ color: colors.textTertiary }}>{bucket.range}</span>
                      <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                        <div
                          className="h-full rounded flex items-center px-1.5"
                          style={{
                            width: `${Math.max((bucket.count / maxCount) * 100, 8)}%`,
                            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                          }}
                        >
                          <span className="text-xs font-medium text-white">{bucket.count}</span>
                        </div>
                      </div>
                      <span className="text-xs w-14 text-right flex-shrink-0" style={{ color: colors.textSecondary }}>
                        {formatCurrencyCompact(bucket.totalAum)}
                      </span>
                    </div>
                  )
                })}
              {data!.aumDistribution.every(b => b.count === 0) && (
                <p className="text-xs" style={{ color: colors.textTertiary }}>No client data available</p>
              )}
            </div>
          </FACard>

          {/* Risk Distribution */}
          <FACard>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${colors.secondary}12` }}>
                <svg className="w-4 h-4" style={{ color: colors.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.secondary }}>Risk Profile Distribution</span>
            </div>
            {data!.riskDistribution.length === 0 ? (
              <p className="text-xs" style={{ color: colors.textTertiary }}>No risk profile data</p>
            ) : (
              <div className="space-y-3">
                {data!.riskDistribution.map((item, i) => {
                  const profileColor = item.profile === 'Aggressive' ? colors.error
                    : item.profile === 'Moderate' ? colors.warning
                    : colors.success
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>{item.profile}</span>
                        <span className="text-xs" style={{ color: colors.textTertiary }}>
                          {item.count} client{item.count !== 1 ? 's' : ''} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.percentage}%`, background: profileColor }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </FACard>
        </div>
      )}

      {/* Empty after load */}
      {loaded && !hasData && !error && (
        <FACard>
          <FAEmptyState
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
            }
            title="No Strategic Data"
            description="Add more clients with holdings to see cross-portfolio intelligence"
          />
        </FACard>
      )}
    </div>
  )
}
