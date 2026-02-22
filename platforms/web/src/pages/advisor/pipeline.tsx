/**
 * Pipeline Page
 *
 * Manage sales pipeline and prospect relationships.
 * Includes pipeline (kanban) view, list view, and conversion flow.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { Prospect, ProspectStage, ProspectFormData, ProspectMeetingNote, ClientFormData } from '@/utils/faTypes'
import {
  FAStatCard,
  FASearchInput,
  FASelect,
  FAButton,
  useNotification,
} from '@/components/advisor/shared'
import { prospectApi, ProspectStats } from '@/services/api'
import ProspectFormModal from '@/components/advisor/ProspectFormModal'
import ConvertToClientModal from '@/components/advisor/ConvertToClientModal'
import PipelineBoard from '@/components/advisor/pipeline/PipelineBoard'
import PipelineList from '@/components/advisor/pipeline/PipelineList'

const ALL_STAGES: ProspectStage[] = ['Discovery', 'Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

// Map API stage enum to display stage names
const STAGE_MAP: Record<string, ProspectStage> = {
  DISCOVERY: 'Discovery', ANALYSIS: 'Analysis', PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation', CLOSED_WON: 'Closed Won', CLOSED_LOST: 'Closed Lost',
}
const STAGE_REVERSE: Record<string, string> = {
  Discovery: 'DISCOVERY', Analysis: 'ANALYSIS', Proposal: 'PROPOSAL',
  Negotiation: 'NEGOTIATION', 'Closed Won': 'CLOSED_WON', 'Closed Lost': 'CLOSED_LOST',
}
const SOURCE_MAP: Record<string, string> = {
  REFERRAL: 'Referral', WEBSITE: 'Website', LINKEDIN: 'LinkedIn', EVENT: 'Event',
  COLD_CALL: 'Cold Call', SOCIAL_MEDIA: 'Social Media', OTHER: 'Other',
}
const SOURCE_REVERSE: Record<string, string> = {
  Referral: 'REFERRAL', Website: 'WEBSITE', LinkedIn: 'LINKEDIN', Event: 'EVENT',
  'Cold Call': 'COLD_CALL', 'Social Media': 'SOCIAL_MEDIA', Other: 'OTHER',
}

const PipelinePage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const { showNotification } = useNotification()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
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

  // Stats from API
  const [apiStats, setApiStats] = useState<ProspectStats | null>(null)

  // Map API response to frontend Prospect type
  const mapApiProspect = (p: any): Prospect => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    potentialAum: p.potentialAum,
    stage: STAGE_MAP[p.stage] || p.stage,
    source: SOURCE_MAP[p.source] || p.source,
    nextAction: p.nextAction || '',
    nextActionDate: p.nextActionDate || '',
    createdAt: p.createdAt?.split('T')[0] || '',
    notes: p.notes || '',
    referredBy: p.referredBy,
    meetingNotes: (p.meetingNotes || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      meetingType: n.meetingType,
      meetingDate: n.meetingDate,
    })),
  })

  const fetchProspects = useCallback(async () => {
    try {
      setLoading(true)
      const [data, stats] = await Promise.allSettled([
        prospectApi.list(),
        prospectApi.getStats(),
      ])
      if (data.status === 'fulfilled') setProspects(data.value.map(mapApiProspect))
      if (stats.status === 'fulfilled') setApiStats(stats.value)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProspects() }, [fetchProspects])

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
    if (apiStats) {
      return {
        activeCount: apiStats.activeCount,
        pipelineValue: apiStats.pipelineValue,
        wonCount: apiStats.wonCount,
        wonValue: apiStats.wonValue,
        conversionRate: apiStats.conversionRate,
      }
    }
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
  }, [prospects, apiStats])

  const sortedListProspects = useMemo(() => {
    if (!listSortCol) return filteredProspects
    const getters: Record<string, (p: Prospect) => string | number> = {
      name: p => p.name.toLowerCase(),
      stage: p => p.stage,
      source: p => p.source.toLowerCase(),
      aum: p => p.potentialAum,
      action: p => (p.nextAction || '').toLowerCase(),
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

  const handleAddProspect = async (data: ProspectFormData, meetingNotes?: ProspectMeetingNote[]) => {
    try {
      const created = await prospectApi.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        potentialAum: data.potentialAum,
        source: SOURCE_REVERSE[data.source] || 'OTHER',
        notes: data.notes,
        referredBy: data.referredBy,
        nextAction: data.nextAction,
        nextActionDate: data.nextActionDate,
      })
      // Add meeting notes if any
      if (meetingNotes?.length) {
        for (const note of meetingNotes) {
          await prospectApi.addMeetingNote(created.id, {
            title: note.title,
            content: note.content,
            meetingType: note.meetingType,
            meetingDate: note.meetingDate,
          })
        }
      }
      showNotification('success', `Prospect "${data.name}" added`)
      fetchProspects()
    } catch {
      showNotification('error', 'Failed to add prospect')
    }
  }

  const handleEditProspect = (prospect: Prospect) => {
    setEditingProspect(prospect)
    setShowProspectForm(true)
  }

  const handleUpdateProspect = async (data: ProspectFormData, meetingNotes?: ProspectMeetingNote[]) => {
    if (!editingProspect) return
    try {
      await prospectApi.update(editingProspect.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        potentialAum: data.potentialAum,
        source: SOURCE_REVERSE[data.source] || 'OTHER',
        notes: data.notes,
        referredBy: data.referredBy,
        nextAction: data.nextAction,
        nextActionDate: data.nextActionDate,
      })
      // Add new meeting notes
      if (meetingNotes) {
        const existingIds = new Set((editingProspect.meetingNotes || []).map(n => n.id))
        for (const note of meetingNotes) {
          if (!existingIds.has(note.id)) {
            await prospectApi.addMeetingNote(editingProspect.id, {
              title: note.title,
              content: note.content,
              meetingType: note.meetingType,
              meetingDate: note.meetingDate,
            })
          }
        }
      }
      showNotification('success', 'Prospect updated')
      fetchProspects()
    } catch {
      showNotification('error', 'Failed to update prospect')
    }
    setEditingProspect(null)
  }

  const handleMoveStage = async (prospectId: string, newStage: ProspectStage) => {
    try {
      await prospectApi.update(prospectId, { stage: STAGE_REVERSE[newStage] || newStage })
      fetchProspects()
    } catch {
      showNotification('error', 'Failed to move stage')
    }
    setShowMoveStage(null)
  }

  const handleConvertClick = (prospect: Prospect) => {
    setConvertingProspect(prospect)
    setShowConvertModal(true)
  }

  const handleConvertToClient = async (clientData: ClientFormData) => {
    if (!convertingProspect) return
    try {
      const result = await prospectApi.convert(convertingProspect.id, {
        pan: clientData.pan,
        dateOfBirth: clientData.dateOfBirth,
        riskProfile: clientData.riskProfile?.toUpperCase(),
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        pincode: clientData.pincode,
      })
      showNotification('success', `${convertingProspect.name} converted to client!`)
      fetchProspects()
      router.push(`/advisor/clients/${result.clientId}`)
    } catch {
      showNotification('error', 'Failed to convert prospect')
    }
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
