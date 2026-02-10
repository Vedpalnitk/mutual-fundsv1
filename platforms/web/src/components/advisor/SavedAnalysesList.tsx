import { useState, useEffect } from 'react'
import { useFATheme, formatDate } from '@/utils/fa'
import { savedAnalysisApi } from '@/services/api'
import { SavedAnalysisSummary } from '@/utils/faTypes'
import {
  FACard,
  FAChip,
  FAEmptyState,
  FASpinner,
  FASectionHeader,
} from '@/components/advisor/shared'

interface SavedAnalysesListProps {
  clientId?: string
  onLoad: (id: string) => void
  onDelete?: (id: string) => void
  refreshKey?: number
}

const SavedAnalysesList = ({ clientId, onLoad, onDelete, refreshKey }: SavedAnalysesListProps) => {
  const { colors, isDark } = useFATheme()
  const [analyses, setAnalyses] = useState<SavedAnalysisSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setAnalyses([])
      return
    }
    const fetch = async () => {
      try {
        setLoading(true)
        const data = await savedAnalysisApi.list(clientId)
        setAnalyses(data)
      } catch {
        setAnalyses([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [clientId, refreshKey])

  if (!clientId) return null

  const statusColor = (status: string) => {
    switch (status) {
      case 'FINAL': return colors.success
      case 'SHARED': return colors.primary
      default: return colors.warning
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this analysis and all versions?')) return
    try {
      await savedAnalysisApi.delete(id)
      setAnalyses(prev => prev.filter(a => a.id !== id))
      onDelete?.(id)
    } catch {
      // ignore
    }
  }

  return (
    <FACard className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <FASectionHeader title={`Saved Analyses (${analyses.length})`} />
        <svg
          className="w-4 h-4 transition-transform"
          style={{ color: colors.textTertiary, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <FASpinner />
            </div>
          ) : analyses.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: colors.textTertiary }}>
              No saved analyses for this client
            </p>
          ) : (
            <div className="space-y-2">
              {analyses.map(a => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(216, 180, 254, 0.06) 0%, rgba(249, 168, 212, 0.03) 100%)'
                      : 'linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(244, 114, 182, 0.01) 100%)',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                        {a.title}
                      </span>
                      <FAChip color={statusColor(a.status)}>{a.status}</FAChip>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: colors.textTertiary }}>
                        v{a.latestVersion} | {new Date(a.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => onLoad(a.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                        color: '#fff',
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 rounded-lg transition-all hover:scale-105"
                      style={{ background: colors.chipBg, color: colors.error }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </FACard>
  )
}

export default SavedAnalysesList
