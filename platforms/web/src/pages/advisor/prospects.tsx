/**
 * Prospects Page
 *
 * Manage sales pipeline and prospect relationships.
 * Includes pipeline view, list view, and conversion flow.
 */

import { useState, useMemo } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, getStageColor } from '@/utils/fa'
import { Prospect, ProspectStage, ProspectFormData, ClientFormData } from '@/utils/faTypes'
import {
  FAStatCard,
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
  const [closedSortCol, setClosedSortCol] = useState('')
  const [closedSortDir, setClosedSortDir] = useState<'asc' | 'desc'>('asc')
  const [listSortCol, setListSortCol] = useState('')
  const [listSortDir, setListSortDir] = useState<'asc' | 'desc'>('asc')

  const handleClosedSort = (col: string) => {
    if (closedSortCol === col) {
      setClosedSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setClosedSortCol(col)
      setClosedSortDir('asc')
    }
  }

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

  const handleListSort = (col: string) => {
    if (listSortCol === col) {
      setListSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setListSortCol(col)
      setListSortDir('asc')
    }
  }

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

  const sortedClosedDeals = useMemo(() => {
    const deals = [...prospects.filter(p => p.stage === 'Closed Won'), ...prospects.filter(p => p.stage === 'Closed Lost')]
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
  }, [prospects, closedSortCol, closedSortDir])

  const sortedListProspects = useMemo(() => {
    if (!listSortCol) return filteredProspects
    const getters: Record<string, (p: Prospect) => string | number> = {
      name: p => p.name.toLowerCase(),
      stage: p => p.stage,
      source: p => p.source.toLowerCase(),
      aum: p => p.potentialAum,
      action: p => p.nextAction.toLowerCase(),
    }
    const getter = getters[listSortCol]
    if (!getter) return filteredProspects
    return [...filteredProspects].sort((a, b) => {
      const aVal = getter(a), bVal = getter(b)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return listSortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return listSortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
  }, [filteredProspects, listSortCol, listSortDir])

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
        className="p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 group"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 2px 8px ${colors.glassShadow}`,
        }}
        onClick={() => handleEditProspect(prospect)}
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FAStatCard label="Active Prospects" value={stats.activeCount} change="In pipeline" accentColor={colors.primary} />
          <FAStatCard label="Pipeline Value" value={formatCurrency(stats.pipelineValue)} change="Potential AUM" accentColor={colors.secondary || colors.primaryDark} />
          <FAStatCard label="Won" value={stats.wonCount} change={formatCurrency(stats.wonValue)} accentColor={colors.success} />
          <FAStatCard label="Conversion Rate" value={`${stats.conversionRate}%`} change="Won vs total closed" accentColor={colors.warning} />
        </div>

        {/* Filters & View Toggle */}
        <div
          className="flex items-center justify-between p-3 rounded-xl mb-6"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
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

        {/* Pipeline View */}
        {viewMode === 'pipeline' && (
          <>
            {/* Pipeline Board — single outline card */}
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
              <div
                className="grid grid-cols-4 min-w-[640px]"
              >
                {ACTIVE_STAGES.map((stage, idx) => {
                  const stageProspects = getProspectsByStage(stage)
                  return (
                    <div
                      key={stage}
                      className="p-3 space-y-3 min-h-[200px]"
                      style={{ borderRight: idx < 3 ? `1px solid ${colors.cardBorder}` : 'none' }}
                    >
                      {stageProspects.map(prospect => (
                        <PipelineCard key={prospect.id} prospect={prospect} />
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

            {/* Closed Deals — table */}
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
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleClosedSort('name')}>
                        Name{closedSortIcon('name')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleClosedSort('source')}>
                        Source{closedSortIcon('source')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleClosedSort('status')}>
                        Status{closedSortIcon('status')}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleClosedSort('aum')}>
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
                          onClick={() => isWon ? handleConvertClick(p) : handleEditProspect(p)}
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
                                onClick={(e) => { e.stopPropagation(); handleConvertClick(p) }}
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
        )}

        {/* List View — table in single outline card (matches transactions page pattern) */}
        {viewMode === 'list' && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 4px 20px ${colors.glassShadow}`,
            }}
          >
            {sortedListProspects.length === 0 ? (
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
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleListSort('name')}>
                      Prospect{listSortIcon('name')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleListSort('stage')}>
                      Stage{listSortIcon('stage')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleListSort('source')}>
                      Source{listSortIcon('source')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleListSort('aum')}>
                      Potential AUM{listSortIcon('aum')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th hidden lg:table-cell" style={{ color: colors.primary }} onClick={() => handleListSort('action')}>
                      Next Action{listSortIcon('action')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListProspects.map((prospect, idx, arr) => {
                    const stageColor = getStageColor(prospect.stage, colors)
                    const isClosed = prospect.stage === 'Closed Won' || prospect.stage === 'Closed Lost'
                    return (
                      <tr
                        key={prospect.id}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}
                        onClick={() => handleEditProspect(prospect)}
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
                              onClick={() => handleConvertClick(prospect)}
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:scale-105"
                              style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)` }}
                            >
                              Convert
                            </button>
                          ) : !isClosed ? (
                            <div className="relative inline-block">
                              <button
                                onClick={() => setShowMoveStage(showMoveStage === prospect.id ? null : prospect.id)}
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
                                        if (s === 'Closed Won') handleConvertClick(prospect)
                                        else handleMoveStage(prospect.id, s)
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
