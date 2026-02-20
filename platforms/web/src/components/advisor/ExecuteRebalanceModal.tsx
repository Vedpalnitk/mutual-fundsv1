import { useState, useMemo, useCallback } from 'react'
import { useFATheme, formatCurrencyCompact } from '@/utils/fa'
import { rebalancingApi } from '@/services/api'

interface RebalanceAction {
  action: string
  priority: string
  schemeName: string
  schemeCode: string
  assetClass: string
  currentValue?: number
  targetValue: number
  transactionAmount: number
  taxStatus?: string
  reason: string
  folioNumber?: string
}

interface ExecuteRebalanceModalProps {
  clientId: string
  clientName: string
  actions: RebalanceAction[]
  onClose: () => void
  onComplete: () => void
}

type Exchange = 'BSE' | 'NSE'

type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed'

interface ActionResult {
  action: RebalanceAction
  status: ExecutionStatus
  error?: string
  orderId?: string
}

interface GroupedActions {
  switches: { sell: RebalanceAction; buy: RebalanceAction }[]
  sells: RebalanceAction[]
  buys: RebalanceAction[]
}

function groupActions(actions: RebalanceAction[]): GroupedActions {
  const sells = actions.filter(a => a.action === 'SELL')
  const buys = actions.filter(a => a.action === 'BUY' || a.action === 'ADD_NEW')

  const switches: { sell: RebalanceAction; buy: RebalanceAction }[] = []
  const matchedSellIndices = new Set<number>()
  const matchedBuyIndices = new Set<number>()

  sells.forEach((sell, si) => {
    const matchingBuyIndex = buys.findIndex((buy, bi) =>
      !matchedBuyIndices.has(bi) && buy.assetClass === sell.assetClass
    )
    if (matchingBuyIndex !== -1) {
      switches.push({ sell, buy: buys[matchingBuyIndex] })
      matchedSellIndices.add(si)
      matchedBuyIndices.add(matchingBuyIndex)
    }
  })

  const standaloneSells = sells.filter((_, i) => !matchedSellIndices.has(i))
  const standaloneBuys = buys.filter((_, i) => !matchedBuyIndices.has(i))

  return { switches, sells: standaloneSells, buys: standaloneBuys }
}

// SVG Icons
const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

const SwitchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SpinnerIcon = ({ color }: { color: string }) => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth={3} />
    <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
)

const OrdersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

type Phase = 'review' | 'executing' | 'done'

const ExecuteRebalanceModal = ({
  clientId,
  clientName,
  actions,
  onClose,
  onComplete,
}: ExecuteRebalanceModalProps) => {
  const { colors, isDark } = useFATheme()

  const [exchange, setExchange] = useState<Exchange>('BSE')
  const [phase, setPhase] = useState<Phase>('review')
  const [confirmStep, setConfirmStep] = useState(false)
  const [results, setResults] = useState<ActionResult[]>([])
  const [successCount, setSuccessCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  const grouped = useMemo(() => groupActions(actions), [actions])

  const totalSell = useMemo(
    () => actions
      .filter(a => a.action === 'SELL')
      .reduce((sum, a) => sum + Math.abs(a.transactionAmount || 0), 0),
    [actions]
  )
  const totalBuy = useMemo(
    () => actions
      .filter(a => a.action === 'BUY' || a.action === 'ADD_NEW')
      .reduce((sum, a) => sum + Math.abs(a.transactionAmount || 0), 0),
    [actions]
  )

  const flatActionList = useMemo(() => {
    const list: RebalanceAction[] = []
    grouped.switches.forEach(sw => {
      list.push(sw.sell)
      list.push(sw.buy)
    })
    grouped.sells.forEach(s => list.push(s))
    grouped.buys.forEach(b => list.push(b))
    return list
  }, [grouped])

  const handleExecute = useCallback(async () => {
    if (!confirmStep) {
      setConfirmStep(true)
      return
    }

    setPhase('executing')
    const initialResults: ActionResult[] = flatActionList.map(a => ({
      action: a,
      status: 'pending' as ExecutionStatus,
    }))
    setResults(initialResults)

    // Mark all as running
    setResults(prev => prev.map(r => ({ ...r, status: 'running' as ExecutionStatus })))

    try {
      const apiActions = actions.map(a => ({
        schemeCode: a.schemeCode,
        action: a.action,
        transactionAmount: a.transactionAmount,
        folioNumber: a.folioNumber,
        schemeName: a.schemeName,
        assetClass: a.assetClass,
      }))

      const response = await rebalancingApi.execute({
        clientId,
        actions: apiActions,
        exchange,
      })

      const updatedResults: ActionResult[] = flatActionList.map((a, i) => {
        const result = response.results?.[i]
        return {
          action: a,
          status: (result?.success ? 'success' : 'failed') as ExecutionStatus,
          error: result?.error,
          orderId: result?.orderId,
        }
      })

      setResults(updatedResults)
      setSuccessCount(response.successCount || 0)
      setFailedCount(response.failedCount || 0)
    } catch (err: any) {
      setResults(prev => prev.map(r => ({
        ...r,
        status: 'failed' as ExecutionStatus,
        error: err?.message || 'Execution failed',
      })))
      setFailedCount(flatActionList.length)
    }

    setPhase('done')
  }, [confirmStep, flatActionList, actions, clientId, exchange])

  const handleDone = useCallback(() => {
    onComplete()
    onClose()
  }, [onComplete, onClose])

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return colors.error
      case 'MEDIUM': return colors.warning
      case 'LOW': return colors.success
      default: return colors.textTertiary
    }
  }

  const getActionColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'SELL': return colors.error
      case 'BUY':
      case 'ADD_NEW': return colors.success
      default: return colors.textSecondary
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }}
        onClick={phase === 'executing' ? undefined : onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: colors.cardBorder }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
              Execute Rebalancing
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {clientName} &middot; {actions.length} action{actions.length !== 1 ? 's' : ''}
            </p>
          </div>
          {phase !== 'executing' && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ background: colors.chipBg, color: colors.textSecondary }}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {phase === 'review' && (
            <>
              {/* Exchange Toggle */}
              <div className="mb-5">
                <label
                  className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                  style={{ color: colors.primary }}
                >
                  Exchange
                </label>
                <div
                  className="inline-flex rounded-full p-1"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                >
                  {(['BSE', 'NSE'] as Exchange[]).map(ex => (
                    <button
                      key={ex}
                      onClick={() => setExchange(ex)}
                      className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        background: exchange === ex
                          ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                          : 'transparent',
                        color: exchange === ex ? '#FFFFFF' : colors.textSecondary,
                        boxShadow: exchange === ex ? `0 2px 8px ${colors.glassShadow}` : 'none',
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: `${colors.error}08`,
                    border: `1px solid ${colors.error}20`,
                  }}
                >
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Total Sell</p>
                  <p className="text-lg font-bold" style={{ color: colors.error }}>
                    {formatCurrencyCompact(totalSell)}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: `${colors.success}08`,
                    border: `1px solid ${colors.success}20`,
                  }}
                >
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Total Buy</p>
                  <p className="text-lg font-bold" style={{ color: colors.success }}>
                    {formatCurrencyCompact(totalBuy)}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: colors.chipBg,
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Net Flow</p>
                  <p className="text-lg font-bold" style={{ color: colors.primary }}>
                    {formatCurrencyCompact(totalBuy - totalSell)}
                  </p>
                </div>
              </div>

              {/* SWITCH Pairs */}
              {grouped.switches.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: `${colors.primary}15`, color: colors.primary }}
                    >
                      <SwitchIcon />
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: colors.primary }}
                    >
                      Switch Pairs ({grouped.switches.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {grouped.switches.map((sw, i) => (
                      <div
                        key={`switch-${i}`}
                        className="p-3 rounded-xl"
                        style={{
                          background: isDark
                            ? `linear-gradient(135deg, ${colors.primary}06 0%, ${colors.primary}02 100%)`
                            : `linear-gradient(135deg, ${colors.primary}04 0%, ${colors.primary}01 100%)`,
                          border: `1px solid ${colors.cardBorder}`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Sell Side */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: `${colors.error}15`, color: colors.error }}
                              >
                                SELL
                              </span>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  background: `${getPriorityColor(sw.sell.priority)}12`,
                                  color: getPriorityColor(sw.sell.priority),
                                }}
                              >
                                {sw.sell.priority}
                              </span>
                            </div>
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: colors.textPrimary }}
                              title={sw.sell.schemeName}
                            >
                              {sw.sell.schemeName}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                              {sw.sell.assetClass}
                              {sw.sell.folioNumber ? ` \u00B7 Folio: ${sw.sell.folioNumber}` : ''}
                            </p>
                            <p className="text-sm font-bold mt-1" style={{ color: colors.error }}>
                              {formatCurrencyCompact(sw.sell.transactionAmount)}
                            </p>
                          </div>

                          {/* Arrow */}
                          <div
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: colors.chipBg, color: colors.primary }}
                          >
                            <ArrowRightIcon />
                          </div>

                          {/* Buy Side */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: `${colors.success}15`, color: colors.success }}
                              >
                                BUY
                              </span>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  background: `${getPriorityColor(sw.buy.priority)}12`,
                                  color: getPriorityColor(sw.buy.priority),
                                }}
                              >
                                {sw.buy.priority}
                              </span>
                            </div>
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: colors.textPrimary }}
                              title={sw.buy.schemeName}
                            >
                              {sw.buy.schemeName}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                              {sw.buy.assetClass}
                            </p>
                            <p className="text-sm font-bold mt-1" style={{ color: colors.success }}>
                              {formatCurrencyCompact(sw.buy.transactionAmount)}
                            </p>
                          </div>
                        </div>
                        {sw.sell.reason && (
                          <p className="text-xs mt-2 pt-2" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.cardBorder}` }}>
                            {sw.sell.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standalone SELLs */}
              {grouped.sells.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: `${colors.error}15`, color: colors.error }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: colors.error }}
                    >
                      Redemptions ({grouped.sells.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {grouped.sells.map((a, i) => (
                      <ActionRow key={`sell-${i}`} action={a} colors={colors} isDark={isDark} />
                    ))}
                  </div>
                </div>
              )}

              {/* Standalone BUYs */}
              {grouped.buys.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: `${colors.success}15`, color: colors.success }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: colors.success }}
                    >
                      Purchases ({grouped.buys.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {grouped.buys.map((a, i) => (
                      <ActionRow key={`buy-${i}`} action={a} colors={colors} isDark={isDark} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Executing / Done Phase */}
          {(phase === 'executing' || phase === 'done') && (
            <div className="space-y-2">
              {phase === 'executing' && (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl mb-4"
                  style={{
                    background: `${colors.primary}08`,
                    border: `1px solid ${colors.primary}20`,
                  }}
                >
                  <SpinnerIcon color={colors.primary} />
                  <p className="text-sm font-medium" style={{ color: colors.primary }}>
                    Executing {actions.length} action{actions.length !== 1 ? 's' : ''} via {exchange}...
                  </p>
                </div>
              )}

              {phase === 'done' && (
                <div
                  className="p-4 rounded-xl mb-4"
                  style={{
                    background: failedCount === 0
                      ? `${colors.success}08`
                      : successCount === 0
                        ? `${colors.error}08`
                        : `${colors.warning}08`,
                    border: `1px solid ${
                      failedCount === 0
                        ? `${colors.success}20`
                        : successCount === 0
                          ? `${colors.error}20`
                          : `${colors.warning}20`
                    }`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: failedCount === 0
                            ? colors.success
                            : successCount === 0
                              ? colors.error
                              : colors.warning,
                        }}
                      >
                        {failedCount === 0
                          ? 'All actions executed successfully'
                          : successCount === 0
                            ? 'Execution failed'
                            : 'Partial execution completed'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {successCount} succeeded, {failedCount} failed of {actions.length} total
                      </p>
                    </div>
                    <a
                      href={exchange === 'BSE' ? '/advisor/bse/orders' : '/advisor/nmf/orders'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md"
                      style={{
                        background: colors.chipBg,
                        color: colors.primary,
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <OrdersIcon />
                      View Orders
                    </a>
                  </div>
                </div>
              )}

              {/* Action Progress List */}
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: r.status === 'success'
                      ? `${colors.success}06`
                      : r.status === 'failed'
                        ? `${colors.error}06`
                        : colors.chipBg,
                    border: `1px solid ${
                      r.status === 'success'
                        ? `${colors.success}15`
                        : r.status === 'failed'
                          ? `${colors.error}15`
                          : colors.cardBorder
                    }`,
                  }}
                >
                  {/* Status Icon */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: r.status === 'success'
                        ? `${colors.success}15`
                        : r.status === 'failed'
                          ? `${colors.error}15`
                          : `${colors.primary}10`,
                      color: r.status === 'success'
                        ? colors.success
                        : r.status === 'failed'
                          ? colors.error
                          : colors.primary,
                    }}
                  >
                    {r.status === 'running' || r.status === 'pending' ? (
                      <SpinnerIcon
                        color={r.status === 'running' ? colors.primary : colors.textTertiary}
                      />
                    ) : r.status === 'success' ? (
                      <CheckIcon />
                    ) : (
                      <XIcon />
                    )}
                  </div>

                  {/* Action Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: `${getActionColor(r.action.action)}15`,
                          color: getActionColor(r.action.action),
                        }}
                      >
                        {r.action.action}
                      </span>
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: colors.textPrimary }}
                        title={r.action.schemeName}
                      >
                        {r.action.schemeName}
                      </p>
                    </div>
                    {r.error && (
                      <p className="text-xs mt-0.5" style={{ color: colors.error }}>
                        {r.error}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <span
                    className="text-sm font-semibold flex-shrink-0"
                    style={{ color: getActionColor(r.action.action) }}
                  >
                    {formatCurrencyCompact(r.action.transactionAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: colors.cardBorder }}
        >
          {phase === 'review' && (
            <>
              <button
                onClick={() => { setConfirmStep(false); onClose() }}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: colors.chipBg,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{
                  background: confirmStep
                    ? `linear-gradient(135deg, ${colors.warning} 0%, ${colors.error} 100%)`
                    : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`,
                }}
              >
                {confirmStep ? 'Confirm Execution' : `Execute All via ${exchange}`}
              </button>
            </>
          )}

          {phase === 'executing' && (
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <SpinnerIcon color={colors.primary} />
              Processing...
            </div>
          )}

          {phase === 'done' && (
            <button
              onClick={handleDone}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-component: standalone action row
function ActionRow({
  action,
  colors,
  isDark,
}: {
  action: RebalanceAction
  colors: ReturnType<typeof useFATheme>['colors']
  isDark: boolean
}) {
  const actionColor = action.action === 'SELL' ? colors.error : colors.success
  const priorityColor = (() => {
    switch (action.priority?.toUpperCase()) {
      case 'HIGH': return colors.error
      case 'MEDIUM': return colors.warning
      case 'LOW': return colors.success
      default: return colors.textTertiary
    }
  })()

  return (
    <div
      className="p-3 rounded-xl flex items-center gap-3"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${actionColor}06 0%, ${actionColor}02 100%)`
          : `linear-gradient(135deg, ${actionColor}04 0%, ${actionColor}01 100%)`,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="text-xs px-1.5 py-0.5 rounded font-semibold"
            style={{ background: `${actionColor}15`, color: actionColor }}
          >
            {action.action}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: `${priorityColor}12`, color: priorityColor }}
          >
            {action.priority}
          </span>
        </div>
        <p
          className="text-sm font-medium truncate"
          style={{ color: colors.textPrimary }}
          title={action.schemeName}
        >
          {action.schemeName}
        </p>
        <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
          {action.assetClass}
          {action.folioNumber ? ` \u00B7 Folio: ${action.folioNumber}` : ''}
        </p>
        {action.reason && (
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            {action.reason}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: actionColor }}>
          {formatCurrencyCompact(action.transactionAmount)}
        </p>
        {action.currentValue != null && (
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            from {formatCurrencyCompact(action.currentValue)}
          </p>
        )}
      </div>
    </div>
  )
}

export default ExecuteRebalanceModal
