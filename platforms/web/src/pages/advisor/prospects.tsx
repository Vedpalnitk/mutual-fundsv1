/**
 * Prospects Page
 *
 * Manage sales pipeline and prospect relationships.
 * Includes pipeline view, list view, and conversion flow.
 */

import { useState, useMemo } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, getStageColor } from '@/utils/fa'
import { Prospect, ProspectStage, LeadSource, ProspectFormData, ClientFormData } from '@/utils/faTypes'
import {
  FACard,
  FAChip,
  FASearchInput,
  FASelect,
  FAButton,
  FAEmptyState,
} from '@/components/advisor/shared'
import ProspectFormModal from '@/components/advisor/ProspectFormModal'
import ConvertToClientModal from '@/components/advisor/ConvertToClientModal'

// Pipeline stages
const ACTIVE_STAGES: ProspectStage[] = ['Discovery', 'Analysis', 'Proposal', 'Negotiation']
const ALL_STAGES: ProspectStage[] = ['Discovery', 'Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

// Stage icons
const STAGE_ICONS: Record<string, string> = {
  Discovery: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  Analysis: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605',
  Proposal: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  Negotiation: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

// Mock prospects data
const mockProspects: Prospect[] = [
  { id: '1', name: 'Ananya Reddy', email: 'ananya.reddy@email.com', phone: '+91 98765 11111', potentialAum: 5000000, stage: 'Negotiation', source: 'Referral', nextAction: 'Send final proposal', nextActionDate: '2024-01-22', createdAt: '2024-01-05', notes: 'Interested in aggressive growth funds' },
  { id: '2', name: 'Karthik Menon', email: 'karthik.m@email.com', phone: '+91 98765 22222', potentialAum: 2500000, stage: 'Analysis', source: 'Website', nextAction: 'Complete risk profiling', nextActionDate: '2024-01-23', createdAt: '2024-01-10', notes: 'First-time investor, needs education' },
  { id: '3', name: 'Deepa Nair', email: 'deepa.nair@email.com', phone: '+91 98765 33333', potentialAum: 7500000, stage: 'Discovery', source: 'LinkedIn', nextAction: 'Schedule intro call', nextActionDate: '2024-01-21', createdAt: '2024-01-15', notes: 'HNI, currently with competitor' },
  { id: '4', name: 'Rohit Verma', email: 'rohit.v@email.com', phone: '+91 98765 44444', potentialAum: 3200000, stage: 'Proposal', source: 'Referral', nextAction: 'Follow up on proposal', nextActionDate: '2024-01-24', createdAt: '2024-01-08', notes: 'Interested in tax saving options' },
  { id: '5', name: 'Sunita Agarwal', email: 'sunita.a@email.com', phone: '+91 98765 55555', potentialAum: 12000000, stage: 'Negotiation', source: 'Event', nextAction: 'Negotiate fees', nextActionDate: '2024-01-25', createdAt: '2024-01-02', notes: 'Family office, long-term relationship potential' },
  { id: '6', name: 'Manish Joshi', email: 'manish.j@email.com', phone: '+91 98765 66666', potentialAum: 1800000, stage: 'Discovery', source: 'Cold Call', nextAction: 'Send intro materials', nextActionDate: '2024-01-26', createdAt: '2024-01-18', notes: 'Young professional, starting investment journey' },
  { id: '7', name: 'Prerna Singh', email: 'prerna.s@email.com', phone: '+91 98765 77777', potentialAum: 4500000, stage: 'Closed Won', source: 'Referral', nextAction: 'Onboard client', nextActionDate: '2024-01-20', createdAt: '2023-12-15', notes: 'Successfully converted!' },
  { id: '8', name: 'Ashok Pillai', email: 'ashok.p@email.com', phone: '+91 98765 88888', potentialAum: 2000000, stage: 'Closed Lost', source: 'Website', nextAction: '-', nextActionDate: '', createdAt: '2023-12-20', notes: 'Went with another advisor' },
]

const ProspectsPage = () => {
  const { colors, isDark } = useFATheme()
  const [prospects, setProspects] = useState<Prospect[]>(mockProspects)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')

  // Modal states
  const [showProspectForm, setShowProspectForm] = useState(false)
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertingProspect, setConvertingProspect] = useState<Prospect | null>(null)
  const [showMoveStage, setShowMoveStage] = useState<string | null>(null)

  const filteredProspects = useMemo(() => prospects.filter(prospect => {
    const matchesSearch = prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStage = filterStage === 'all' || prospect.stage === filterStage
    return matchesSearch && matchesStage
  }), [prospects, searchTerm, filterStage])

  const stats = useMemo(() => {
    const active = prospects.filter(p => !['Closed Won', 'Closed Lost'].includes(p.stage))
    const won = prospects.filter(p => p.stage === 'Closed Won')
    const lost = prospects.filter(p => p.stage === 'Closed Lost')
    const total = won.length + lost.length
    const rate = total > 0 ? Math.round((won.length / total) * 100) : 0
    return {
      activeCount: active.length,
      pipelineValue: active.reduce((sum, p) => sum + p.potentialAum, 0),
      wonCount: won.length,
      wonValue: won.reduce((s, p) => s + p.potentialAum, 0),
      conversionRate: rate,
    }
  }, [prospects])

  const getProspectsByStage = (stage: ProspectStage) => filteredProspects.filter(p => p.stage === stage)

  const handleAddProspect = (data: ProspectFormData) => {
    const newProspect: Prospect = {
      id: `p${Date.now()}`,
      ...data,
      stage: 'Discovery',
      nextAction: 'Schedule intro call',
      nextActionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      notes: data.notes || '',
    }
    setProspects([newProspect, ...prospects])
  }

  const handleEditProspect = (prospect: Prospect) => {
    setEditingProspect(prospect)
    setShowProspectForm(true)
  }

  const handleUpdateProspect = (data: ProspectFormData) => {
    if (editingProspect) {
      setProspects(prospects.map(p =>
        p.id === editingProspect.id ? { ...p, ...data } : p
      ))
    }
    setEditingProspect(null)
  }

  const handleMoveStage = (prospectId: string, newStage: ProspectStage) => {
    setProspects(prospects.map(p =>
      p.id === prospectId ? { ...p, stage: newStage } : p
    ))
    setShowMoveStage(null)
  }

  const handleConvertClick = (prospect: Prospect) => {
    if (prospect.stage !== 'Closed Won') {
      setProspects(prospects.map(p =>
        p.id === prospect.id ? { ...p, stage: 'Closed Won' } : p
      ))
    }
    setConvertingProspect(prospect)
    setShowConvertModal(true)
  }

  const handleConvertToClient = (clientData: ClientFormData) => {
    setProspects(prospects.filter(p => p.id !== convertingProspect?.id))
    setConvertingProspect(null)
  }

  // ── Pipeline Card ─────────────────────────────────────────────

  const PipelineCard = ({ prospect }: { prospect: Prospect }) => {
    const stageColor = getStageColor(prospect.stage, colors)
    return (
      <div
        className="p-3.5 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 group"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 2px 8px ${colors.glassShadow}`,
        }}
        onClick={() => handleEditProspect(prospect)}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${stageColor} 0%, ${colors.primaryDark} 100%)` }}
          >
            {prospect.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{prospect.name}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: stageColor }} />
              <p className="text-[11px]" style={{ color: colors.textTertiary }}>{prospect.source}</p>
            </div>
          </div>
        </div>

        {/* AUM */}
        <p className="text-lg font-bold mb-3" style={{ color: colors.primary }}>{formatCurrency(prospect.potentialAum)}</p>

        {/* Footer */}
        <div
          className="pt-2.5 flex items-center justify-between"
          style={{ borderTop: `1px solid ${colors.cardBorder}` }}
        >
          <p className="text-[11px] truncate flex-1 mr-2" style={{ color: colors.textTertiary }}>
            {prospect.nextAction}
          </p>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMoveStage(showMoveStage === prospect.id ? null : prospect.id)}
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

        {/* Stage Move Dropdown */}
        {showMoveStage === prospect.id && (
          <div
            className="mt-2.5 p-2 rounded-lg space-y-0.5"
            style={{ background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1" style={{ color: colors.textTertiary }}>Move to</p>
            {ALL_STAGES.filter(s => s !== prospect.stage && s !== 'Closed Lost').map(s => (
              <button
                key={s}
                onClick={() => {
                  if (s === 'Closed Won') handleConvertClick(prospect)
                  else handleMoveStage(prospect.id, s)
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
              onClick={() => handleMoveStage(prospect.id, 'Closed Lost')}
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

  // ── List Row ──────────────────────────────────────────────────

  const ListRow = ({ prospect }: { prospect: Prospect }) => {
    const stageColor = getStageColor(prospect.stage, colors)
    return (
      <div
        className="p-4 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 2px 8px ${colors.glassShadow}`,
        }}
        onClick={() => handleEditProspect(prospect)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${stageColor} 0%, ${colors.primaryDark} 100%)` }}
            >
              {prospect.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{prospect.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{prospect.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <FAChip color={stageColor}>{prospect.stage}</FAChip>
                <span className="text-[11px]" style={{ color: colors.textTertiary }}>via {prospect.source}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Potential AUM</p>
              <p className="text-base font-bold" style={{ color: colors.primary }}>{formatCurrency(prospect.potentialAum)}</p>
            </div>
            <div className="text-right w-40 hidden lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Next Action</p>
              <p className="text-sm truncate" style={{ color: colors.textPrimary }}>{prospect.nextAction}</p>
            </div>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {prospect.stage === 'Closed Won' ? (
                <button
                  onClick={() => handleConvertClick(prospect)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)` }}
                >
                  Convert
                </button>
              ) : prospect.stage !== 'Closed Lost' ? (
                <button
                  onClick={() => setShowMoveStage(showMoveStage === prospect.id ? null : prospect.id)}
                  className="p-2 rounded-lg transition-all hover:scale-105"
                  style={{ background: colors.chipBg, color: colors.primary }}
                  title="Move Stage"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stage Move Dropdown (List View) */}
        {showMoveStage === prospect.id && (
          <div
            className="mt-3 p-2 rounded-xl flex flex-wrap gap-1.5"
            style={{ background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider w-full mb-1 px-1" style={{ color: colors.textTertiary }}>Move to</span>
            {ALL_STAGES.filter(s => s !== prospect.stage).map(s => (
              <button
                key={s}
                onClick={() => {
                  if (s === 'Closed Won') handleConvertClick(prospect)
                  else handleMoveStage(prospect.id, s)
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                style={{
                  background: s === 'Closed Won'
                    ? `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`
                    : s === 'Closed Lost'
                    ? `${colors.error}10`
                    : `${getStageColor(s as ProspectStage, colors)}10`,
                  color: s === 'Closed Won' ? 'white' : s === 'Closed Lost' ? colors.error : getStageColor(s as ProspectStage, colors),
                  border: `1px solid ${s === 'Closed Won' ? 'transparent' : s === 'Closed Lost' ? `${colors.error}25` : `${getStageColor(s as ProspectStage, colors)}25`}`,
                }}
              >
                {s === 'Closed Won' ? 'Won & Convert' : s}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AdvisorLayout title="Prospects">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>Track and manage your sales pipeline</p>
          <FAButton
            onClick={() => {
              setEditingProspect(null)
              setShowProspectForm(true)
            }}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Prospect
          </FAButton>
        </div>

        {/* Summary + Filters — single outline card */}
        <div
          className="rounded-xl mb-6 overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 2px 8px ${colors.glassShadow}`,
          }}
        >
          {/* Stats Row */}
          <div className="flex items-stretch">
            {[
              { label: 'Active', value: stats.activeCount.toString(), sub: 'In pipeline', color: colors.primary },
              { label: 'Pipeline', value: formatCurrency(stats.pipelineValue), sub: 'Potential AUM', color: colors.secondary || colors.primaryDark },
              { label: 'Won', value: stats.wonCount.toString(), sub: formatCurrency(stats.wonValue), color: colors.success },
              { label: 'Conversion', value: `${stats.conversionRate}%`, sub: 'Won / closed', color: colors.warning },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className="flex-1 p-4 flex items-center gap-3"
                style={{
                  borderRight: idx < 3 ? `1px solid ${colors.cardBorder}` : 'none',
                }}
              >
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: stat.color }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: colors.textTertiary }}>{stat.label}</p>
                  <p className="text-lg font-bold leading-tight truncate" style={{ color: colors.textPrimary }}>{stat.value}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: colors.textTertiary }}>{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${colors.cardBorder}` }} />

          {/* Search, Filter, View Toggle */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 max-w-sm">
                <FASearchInput
                  placeholder="Search prospects..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>
              <FASelect
                options={[
                  { value: 'all', label: 'All Stages' },
                  ...ALL_STAGES.map(stage => ({ value: stage, label: stage }))
                ]}
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                containerClassName="w-40"
              />
            </div>
            <div
              className="flex items-center rounded-lg p-0.5"
              style={{ background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary }}
            >
              <button
                onClick={() => setViewMode('pipeline')}
                className="p-2 rounded-md transition-all"
                style={{
                  background: viewMode === 'pipeline' ? colors.cardBackground : 'transparent',
                  color: viewMode === 'pipeline' ? colors.primary : colors.textTertiary,
                  boxShadow: viewMode === 'pipeline' ? `0 1px 3px ${colors.glassShadow}` : 'none',
                }}
                title="Pipeline View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded-md transition-all"
                style={{
                  background: viewMode === 'list' ? colors.cardBackground : 'transparent',
                  color: viewMode === 'list' ? colors.primary : colors.textTertiary,
                  boxShadow: viewMode === 'list' ? `0 1px 3px ${colors.glassShadow}` : 'none',
                }}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline View */}
        {viewMode === 'pipeline' && (
          <>
            {/* Active Pipeline */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {ACTIVE_STAGES.map(stage => {
                const stageProspects = getProspectsByStage(stage)
                const stageColor = getStageColor(stage, colors)
                const stageValue = stageProspects.reduce((s, p) => s + p.potentialAum, 0)
                return (
                  <div key={stage}>
                    {/* Column Header */}
                    <div
                      className="flex items-center justify-between mb-3 p-2.5 rounded-lg"
                      style={{ background: `${stageColor}08`, border: `1px solid ${stageColor}15` }}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" style={{ color: stageColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={STAGE_ICONS[stage] || ''} />
                        </svg>
                        <span className="text-xs font-semibold" style={{ color: stageColor }}>{stage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium" style={{ color: colors.textTertiary }}>
                          {stageValue > 0 ? formatCurrency(stageValue) : ''}
                        </span>
                        <span
                          className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ background: `${stageColor}15`, color: stageColor }}
                        >
                          {stageProspects.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      {stageProspects.map(prospect => (
                        <PipelineCard key={prospect.id} prospect={prospect} />
                      ))}
                      {stageProspects.length === 0 && (
                        <div
                          className="p-6 rounded-xl text-center"
                          style={{ border: `1px dashed ${colors.cardBorder}` }}
                        >
                          <p className="text-xs" style={{ color: colors.textTertiary }}>No prospects</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Closed Deals */}
            <div className="grid grid-cols-2 gap-4">
              {/* Won */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.success}20`,
                  borderLeft: `3px solid ${colors.success}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: colors.success }}>Won</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: colors.success }}>{getProspectsByStage('Closed Won').length}</span>
                </div>
                <div className="space-y-2">
                  {getProspectsByStage('Closed Won').map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                      style={{ background: `${colors.success}06`, border: `1px solid ${colors.success}15` }}
                      onClick={() => handleConvertClick(p)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs" style={{ background: colors.success }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{p.name}</p>
                          <p className="text-[10px]" style={{ color: colors.textTertiary }}>{p.source}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: colors.success }}>{formatCurrency(p.potentialAum)}</p>
                        <span className="text-[10px] font-semibold" style={{ color: colors.primary }}>Convert</span>
                      </div>
                    </div>
                  ))}
                  {getProspectsByStage('Closed Won').length === 0 && (
                    <p className="text-xs text-center py-3" style={{ color: colors.textTertiary }}>No won deals yet</p>
                  )}
                </div>
              </div>

              {/* Lost */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.error}15`,
                  borderLeft: `3px solid ${colors.error}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: colors.error }}>Lost</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: colors.error }}>{getProspectsByStage('Closed Lost').length}</span>
                </div>
                <div className="space-y-2">
                  {getProspectsByStage('Closed Lost').map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg flex items-center justify-between"
                      style={{ background: `${colors.error}04`, border: `1px solid ${colors.error}10` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs opacity-50" style={{ background: colors.error }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>{p.name}</p>
                          <p className="text-[10px]" style={{ color: colors.textTertiary }}>{p.notes}</p>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>{formatCurrency(p.potentialAum)}</p>
                    </div>
                  ))}
                  {getProspectsByStage('Closed Lost').length === 0 && (
                    <p className="text-xs text-center py-3" style={{ color: colors.textTertiary }}>No lost deals</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2.5">
            {filteredProspects.map(prospect => (
              <ListRow key={prospect.id} prospect={prospect} />
            ))}
            {filteredProspects.length === 0 && (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
                title="No prospects found"
                description="Try adjusting your search or add a new prospect"
              />
            )}
          </div>
        )}
      </div>

      {/* Prospect Form Modal */}
      <ProspectFormModal
        isOpen={showProspectForm}
        onClose={() => {
          setShowProspectForm(false)
          setEditingProspect(null)
        }}
        onSubmit={editingProspect ? handleUpdateProspect : handleAddProspect}
        prospect={editingProspect}
      />

      {/* Convert to Client Modal */}
      <ConvertToClientModal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false)
          setConvertingProspect(null)
        }}
        onConvert={handleConvertToClient}
        prospect={convertingProspect}
      />
    </AdvisorLayout>
  )
}

export default ProspectsPage
