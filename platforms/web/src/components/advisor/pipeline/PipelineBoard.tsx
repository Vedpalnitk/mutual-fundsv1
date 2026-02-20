import { useMemo } from 'react'
import { useFATheme, formatCurrency, getStageColor } from '@/utils/fa'
import { Prospect, ProspectStage } from '@/utils/faTypes'
import PipelineCard from './PipelineCard'

const ACTIVE_STAGES: ProspectStage[] = ['Discovery', 'Analysis', 'Proposal', 'Negotiation']

interface PipelineBoardProps {
  prospects: Prospect[]
  allProspects: Prospect[]
  showMoveStage: string | null
  closedSortCol: string
  closedSortDir: 'asc' | 'desc'
  onToggleMoveStage: (id: string | null) => void
  onEdit: (prospect: Prospect) => void
  onMoveStage: (prospectId: string, newStage: ProspectStage) => void
  onConvert: (prospect: Prospect) => void
  onClosedSort: (col: string) => void
}

export default function PipelineBoard({
  prospects, allProspects, showMoveStage, closedSortCol, closedSortDir,
  onToggleMoveStage, onEdit, onMoveStage, onConvert, onClosedSort,
}: PipelineBoardProps) {
  const { colors, isDark } = useFATheme()

  const getProspectsByStage = (stage: ProspectStage) => prospects.filter(p => p.stage === stage)

  const closedSortIcon = (col: string) => {
    if (closedSortCol === col) {
      return (
        <svg className="w-3 h-3 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={closedSortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      )
    }
    return (
      <svg className="w-3 h-3 ml-0.5 inline-block opacity-0 group-hover/th:opacity-30 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }

  const sortedClosedDeals = useMemo(() => {
    const deals = [...allProspects.filter(p => p.stage === 'Closed Won'), ...allProspects.filter(p => p.stage === 'Closed Lost')]
    if (!closedSortCol) return deals
    const getters: Record<string, (p: Prospect) => string | number> = {
      name: p => p.name.toLowerCase(),
      source: p => p.source.toLowerCase(),
      status: p => p.stage,
      aum: p => p.potentialAum,
    }
    const getter = getters[closedSortCol]
    if (!getter) return deals
    return deals.sort((a, b) => {
      const aVal = getter(a), bVal = getter(b)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return closedSortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return closedSortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
  }, [allProspects, closedSortCol, closedSortDir])

  return (
    <>
      {/* Pipeline Board */}
      <div
        className="rounded-2xl overflow-x-auto mb-6"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 4px 20px ${colors.glassShadow}`,
        }}
      >
        {/* Stage Header Row */}
        <div className="grid grid-cols-4 min-w-[640px]" style={{
          background: isDark
            ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
            : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
          borderBottom: `1px solid ${colors.cardBorder}`,
        }}>
          {ACTIVE_STAGES.map((stage, idx) => {
            const stageProspects = getProspectsByStage(stage)
            const stageColor = getStageColor(stage, colors)
            const stageValue = stageProspects.reduce((s, p) => s + p.potentialAum, 0)
            return (
              <div
                key={stage}
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderRight: idx < 3 ? `1px solid ${colors.cardBorder}` : 'none' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: stageColor }} />
                  <span className="text-xs font-semibold" style={{ color: stageColor }}>{stage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: colors.textTertiary }}>
                    {stageValue > 0 ? formatCurrency(stageValue) : ''}
                  </span>
                  <span
                    className="text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: `${stageColor}12`, color: stageColor }}
                  >
                    {stageProspects.length}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-4 min-w-[640px]">
          {ACTIVE_STAGES.map((stage, idx) => {
            const stageProspects = getProspectsByStage(stage)
            return (
              <div
                key={stage}
                className="p-3 space-y-3 min-h-[200px]"
                style={{ borderRight: idx < 3 ? `1px solid ${colors.cardBorder}` : 'none' }}
              >
                {stageProspects.map(prospect => (
                  <PipelineCard
                    key={prospect.id}
                    prospect={prospect}
                    showMoveStage={showMoveStage}
                    onToggleMoveStage={onToggleMoveStage}
                    onEdit={onEdit}
                    onMoveStage={onMoveStage}
                    onConvert={onConvert}
                  />
                ))}
                {stageProspects.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs" style={{ color: colors.textTertiary }}>No prospects</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Closed Deals Table */}
      {(getProspectsByStage('Closed Won').length > 0 || getProspectsByStage('Closed Lost').length > 0) && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 20px ${colors.glassShadow}`,
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Closed Deals</span>
            <span className="text-xs" style={{ color: colors.textTertiary }}>
              {getProspectsByStage('Closed Won').length + getProspectsByStage('Closed Lost').length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{
                  background: isDark
                    ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                    : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                  borderBottom: `1px solid ${colors.cardBorder}`,
                }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onClosedSort('name')}>
                    Name{closedSortIcon('name')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onClosedSort('source')}>
                    Source{closedSortIcon('source')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onClosedSort('status')}>
                    Status{closedSortIcon('status')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => onClosedSort('aum')}>
                    AUM{closedSortIcon('aum')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedClosedDeals.map((p, idx, arr) => {
                  const isWon = p.stage === 'Closed Won'
                  const statusColor = isWon ? colors.success : colors.error
                  return (
                    <tr
                      key={p.id}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}
                      onClick={() => isWon ? onConvert(p) : onEdit(p)}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? colors.backgroundTertiary : colors.backgroundSecondary}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{p.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>{p.source}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ background: `${statusColor}12`, color: statusColor }}
                        >
                          {isWon ? 'Won' : 'Lost'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold" style={{ color: isWon ? colors.success : colors.textTertiary }}>
                          {formatCurrency(p.potentialAum)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isWon ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onConvert(p) }}
                            className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                            style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)` }}
                          >
                            Convert
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: colors.textTertiary }}>{p.notes || '—'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
