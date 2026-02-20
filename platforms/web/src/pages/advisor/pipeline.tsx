/**
 * Pipeline Page
 *
 * Manage sales pipeline and prospect relationships.
 * Includes pipeline (kanban) view, list view, and conversion flow.
 */

import { useState, useMemo } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { Prospect, ProspectStage, ProspectFormData, ProspectMeetingNote, ClientFormData } from '@/utils/faTypes'
import {
  FAStatCard,
  FASearchInput,
  FASelect,
  FAButton,
} from '@/components/advisor/shared'
import ProspectFormModal from '@/components/advisor/ProspectFormModal'
import ConvertToClientModal from '@/components/advisor/ConvertToClientModal'
import PipelineBoard from '@/components/advisor/pipeline/PipelineBoard'
import PipelineList from '@/components/advisor/pipeline/PipelineList'

const ALL_STAGES: ProspectStage[] = ['Discovery', 'Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

// Mock prospects data
const mockProspects: Prospect[] = [
  { id: '1', name: 'Ananya Reddy', email: 'ananya.reddy@email.com', phone: '+91 98765 11111', potentialAum: 5000000, stage: 'Negotiation', source: 'Referral', nextAction: 'Send final proposal', nextActionDate: '2024-01-22', createdAt: '2024-01-05', notes: 'Interested in aggressive growth funds', meetingNotes: [
    { id: 'mn1', title: 'Initial discussion', content: 'Discussed risk appetite and investment goals. Prefers equity-heavy portfolio.', meetingType: 'CALL', meetingDate: '2024-01-06' },
    { id: 'mn2', title: 'Proposal review', content: 'Reviewed proposed fund allocation. Wants more mid-cap exposure.', meetingType: 'VIDEO', meetingDate: '2024-01-15' },
  ] },
  { id: '2', name: 'Karthik Menon', email: 'karthik.m@email.com', phone: '+91 98765 22222', potentialAum: 2500000, stage: 'Analysis', source: 'Website', nextAction: 'Complete risk profiling', nextActionDate: '2024-01-23', createdAt: '2024-01-10', notes: 'First-time investor, needs education', meetingNotes: [
    { id: 'mn3', title: 'Intro call', content: 'First-time investor. Explained SIP basics and tax benefits of ELSS.', meetingType: 'CALL', meetingDate: '2024-01-11' },
  ] },
  { id: '3', name: 'Deepa Nair', email: 'deepa.nair@email.com', phone: '+91 98765 33333', potentialAum: 7500000, stage: 'Discovery', source: 'LinkedIn', nextAction: 'Schedule intro call', nextActionDate: '2024-01-21', createdAt: '2024-01-15', notes: 'HNI, currently with competitor' },
  { id: '4', name: 'Rohit Verma', email: 'rohit.v@email.com', phone: '+91 98765 44444', potentialAum: 3200000, stage: 'Proposal', source: 'Referral', nextAction: 'Follow up on proposal', nextActionDate: '2024-01-24', createdAt: '2024-01-08', notes: 'Interested in tax saving options' },
  { id: '5', name: 'Sunita Agarwal', email: 'sunita.a@email.com', phone: '+91 98765 55555', potentialAum: 12000000, stage: 'Negotiation', source: 'Event', nextAction: 'Negotiate fees', nextActionDate: '2024-01-25', createdAt: '2024-01-02', notes: 'Family office, long-term relationship potential' },
  { id: '6', name: 'Manish Joshi', email: 'manish.j@email.com', phone: '+91 98765 66666', potentialAum: 1800000, stage: 'Discovery', source: 'Cold Call', nextAction: 'Send intro materials', nextActionDate: '2024-01-26', createdAt: '2024-01-18', notes: 'Young professional, starting investment journey' },
  { id: '7', name: 'Prerna Singh', email: 'prerna.s@email.com', phone: '+91 98765 77777', potentialAum: 4500000, stage: 'Closed Won', source: 'Referral', nextAction: 'Onboard client', nextActionDate: '2024-01-20', createdAt: '2023-12-15', notes: 'Successfully converted!' },
  { id: '8', name: 'Ashok Pillai', email: 'ashok.p@email.com', phone: '+91 98765 88888', potentialAum: 2000000, stage: 'Closed Lost', source: 'Website', nextAction: '-', nextActionDate: '', createdAt: '2023-12-20', notes: 'Went with another advisor' },
]

const PipelinePage = () => {
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

  // Sort states
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

  const handleListSort = (col: string) => {
    if (listSortCol === col) {
      setListSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setListSortCol(col)
      setListSortDir('asc')
    }
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

  const handleAddProspect = (data: ProspectFormData, meetingNotes?: ProspectMeetingNote[]) => {
    const newProspect: Prospect = {
      id: `p${Date.now()}`,
      ...data,
      stage: 'Discovery',
      nextAction: 'Schedule intro call',
      nextActionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      notes: data.notes || '',
      meetingNotes: meetingNotes || [],
    }
    setProspects([newProspect, ...prospects])
  }

  const handleEditProspect = (prospect: Prospect) => {
    setEditingProspect(prospect)
    setShowProspectForm(true)
  }

  const handleUpdateProspect = (data: ProspectFormData, meetingNotes?: ProspectMeetingNote[]) => {
    if (editingProspect) {
      setProspects(prospects.map(p =>
        p.id === editingProspect.id ? { ...p, ...data, meetingNotes: meetingNotes || p.meetingNotes || [] } : p
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

  return (
    <AdvisorLayout title="Pipeline">
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
          <PipelineBoard
            prospects={filteredProspects}
            allProspects={prospects}
            showMoveStage={showMoveStage}
            closedSortCol={closedSortCol}
            closedSortDir={closedSortDir}
            onToggleMoveStage={setShowMoveStage}
            onEdit={handleEditProspect}
            onMoveStage={handleMoveStage}
            onConvert={handleConvertClick}
            onClosedSort={handleClosedSort}
          />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <PipelineList
            prospects={sortedListProspects}
            listSortCol={listSortCol}
            listSortDir={listSortDir}
            showMoveStage={showMoveStage}
            onListSort={handleListSort}
            onToggleMoveStage={setShowMoveStage}
            onEdit={handleEditProspect}
            onMoveStage={handleMoveStage}
            onConvert={handleConvertClick}
          />
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

export default PipelinePage
