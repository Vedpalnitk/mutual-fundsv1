import { useFATheme, getStageColor } from '@/utils/fa'
import { Prospect, ProspectStage } from '@/utils/faTypes'
import { formatCurrency } from '@/utils/fa'

const ALL_STAGES: ProspectStage[] = ['Discovery', 'Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

interface PipelineCardProps {
  prospect: Prospect
  showMoveStage: string | null
  onToggleMoveStage: (id: string | null) => void
  onEdit: (prospect: Prospect) => void
  onMoveStage: (prospectId: string, newStage: ProspectStage) => void
  onConvert: (prospect: Prospect) => void
}

export default function PipelineCard({ prospect, showMoveStage, onToggleMoveStage, onEdit, onMoveStage, onConvert }: PipelineCardProps) {
  const { colors, isDark } = useFATheme()
  const stageColor = getStageColor(prospect.stage, colors)

  return (
    <div
      className="p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 group"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 2px 8px ${colors.glassShadow}`,
      }}
      onClick={() => onEdit(prospect)}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${stageColor} 0%, ${colors.primaryDark} 100%)` }}
        >
          {prospect.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{prospect.name}</p>
          <p className="text-xs" style={{ color: colors.textTertiary }}>{prospect.source}</p>
        </div>
      </div>

      <p className="text-base font-bold mb-2.5" style={{ color: colors.primary }}>{formatCurrency(prospect.potentialAum)}</p>

      <div
        className="pt-2 flex items-center justify-between"
        style={{ borderTop: `1px solid ${colors.cardBorder}` }}
      >
        <p className="text-xs truncate flex-1 mr-2" style={{ color: colors.textTertiary }}>
          {prospect.nextAction}
        </p>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleMoveStage(showMoveStage === prospect.id ? null : prospect.id)}
            className="p-1.5 rounded-lg transition-all opacity-60 group-hover:opacity-100"
            style={{ background: colors.chipBg, color: colors.primary }}
            title="Move Stage"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {showMoveStage === prospect.id && (
        <div
          className="mt-2 p-2 rounded-lg space-y-0.5"
          style={{ background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}` }}
          onClick={(e) => e.stopPropagation()}
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
              style={{
                color: s === 'Closed Won' ? colors.success : colors.textPrimary,
                background: 'transparent',
              }}
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
  )
}
