import { useFATheme, formatCurrency, getStageColor } from '@/utils/fa'
import { Prospect, ProspectStage } from '@/utils/faTypes'
import { FAChip, FAEmptyState } from '@/components/advisor/shared'

const ALL_STAGES: ProspectStage[] = ['Discovery', 'Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

interface PipelineListProps {
  prospects: Prospect[]
  listSortCol: string
  listSortDir: 'asc' | 'desc'
  showMoveStage: string | null
  onListSort: (col: string) => void
  onToggleMoveStage: (id: string | null) => void
  onEdit: (prospect: Prospect) => void
  onMoveStage: (prospectId: string, newStage: ProspectStage) => void
  onConvert: (prospect: Prospect) => void
}

export default function PipelineList({
  prospects, listSortCol, listSortDir, showMoveStage,
  onListSort, onToggleMoveStage, onEdit, onMoveStage, onConvert,
}: PipelineListProps) {
  const { colors, isDark } = useFATheme()

  const listSortIcon = (col: string) => {
    if (listSortCol === col) {
      return (
        <svg className="w-3 h-3 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={listSortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      )
    }
    return (
      <svg className="w-3 h-3 ml-0.5 inline-block opacity-0 group-hover/th:opacity-30 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 20px ${colors.glassShadow}`,
      }}
    >
      {prospects.length === 0 ? (
        <div className="py-8">
          <FAEmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
            title="No prospects found"
            description="Try adjusting your search or add a new prospect"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{
                background: isDark
                  ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                  : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                borderBottom: `1px solid ${colors.cardBorder}`,
              }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onListSort('name')}>
                  Prospect{listSortIcon('name')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onListSort('stage')}>
                  Stage{listSortIcon('stage')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onListSort('source')}>
                  Source{listSortIcon('source')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onListSort('aum')}>
                  Potential AUM{listSortIcon('aum')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th hidden lg:table-cell" style={{ color: colors.primary }} onClick={() => onListSort('action')}>
                  Next Action{listSortIcon('action')}
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((prospect, idx, arr) => {
                const stageColor = getStageColor(prospect.stage, colors)
                const isClosed = prospect.stage === 'Closed Won' || prospect.stage === 'Closed Lost'
                return (
                  <tr
                    key={prospect.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}
                    onClick={() => onEdit(prospect)}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? colors.backgroundTertiary : colors.backgroundSecondary}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${stageColor} 0%, ${colors.primaryDark} 100%)` }}
                        >
                          {prospect.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{prospect.name}</p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>{prospect.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <FAChip color={stageColor}>{prospect.stage}</FAChip>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>{prospect.source}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold" style={{ color: colors.primary }}>{formatCurrency(prospect.potentialAum)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm truncate block max-w-[180px]" style={{ color: colors.textSecondary }}>{prospect.nextAction}</span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {prospect.stage === 'Closed Won' ? (
                        <button
                          onClick={() => onConvert(prospect)}
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)` }}
                        >
                          Convert
                        </button>
                      ) : !isClosed ? (
                        <div className="relative inline-block">
                          <button
                            onClick={() => onToggleMoveStage(showMoveStage === prospect.id ? null : prospect.id)}
                            className="p-1.5 rounded-lg transition-all hover:scale-105"
                            style={{ background: colors.chipBg, color: colors.primary }}
                            title="Move Stage"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                          {showMoveStage === prospect.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-48 rounded-xl overflow-hidden z-50 shadow-xl p-1.5 space-y-0.5"
                              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
                            >
                              <p className="text-xs font-semibold uppercase tracking-wider px-2 py-1" style={{ color: colors.textTertiary }}>Move to</p>
                              {ALL_STAGES.filter(s => s !== prospect.stage && s !== 'Closed Lost').map(s => (
                                <button
                                  key={s}
                                  onClick={() => {
                                    if (s === 'Closed Won') onConvert(prospect)
                                    else onMoveStage(prospect.id, s)
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                  style={{ color: s === 'Closed Won' ? colors.success : colors.textPrimary }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = colors.chipBg}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: getStageColor(s as ProspectStage, colors) }} />
                                    {s === 'Closed Won' ? 'Won — Convert to Client' : s}
                                  </div>
                                </button>
                              ))}
                              <button
                                onClick={() => onMoveStage(prospect.id, 'Closed Lost')}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                style={{ color: colors.error }}
                                onMouseEnter={(e) => e.currentTarget.style.background = `${colors.error}08`}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.error }} />
                                  Mark as Lost
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: colors.textTertiary }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
