/**
 * Prospect Form Modal
 *
 * Modal component for adding/editing prospects in the FA portal.
 * Includes form for prospect details and activities.
 */

import { useState, useEffect } from 'react'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { Prospect, ProspectFormData, ProspectMeetingNote, LeadSource, ProspectStage } from '@/utils/faTypes'
import {
  FACard,
  FALabel,
  FAInput,
  FATextarea,
  FASelect,
  FAButton,
} from '@/components/advisor/shared'

interface ProspectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProspectFormData, meetingNotes?: ProspectMeetingNote[]) => void
  prospect?: Prospect | null // If provided, edit mode
}

const MEETING_TYPES = [
  { value: 'CALL', label: 'Call', color: '#3B82F6' },
  { value: 'IN_PERSON', label: 'In Person', color: '#10B981' },
  { value: 'VIDEO', label: 'Video', color: '#8B5CF6' },
  { value: 'EMAIL', label: 'Email', color: '#F59E0B' },
  { value: 'OTHER', label: 'Other', color: '#94A3B8' },
] as const

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'Referral', label: 'Referral' },
  { value: 'Website', label: 'Website' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Event', label: 'Event / Seminar' },
  { value: 'Cold Call', label: 'Cold Call' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Other', label: 'Other' },
]

const ProspectFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  prospect,
}: ProspectFormModalProps) => {
  const { colors, isDark } = useFATheme()
  const isEditMode = !!prospect

  const [formData, setFormData] = useState<ProspectFormData>({
    name: '',
    email: '',
    phone: '',
    potentialAum: 0,
    source: 'Website',
    notes: '',
    referredBy: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProspectFormData, string>>>({})

  // Meeting notes (local-only, managed on prospect)
  const [meetingNotes, setMeetingNotes] = useState<ProspectMeetingNote[]>([])
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '', meetingType: 'CALL' as ProspectMeetingNote['meetingType'], meetingDate: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    if (prospect) {
      setFormData({
        name: prospect.name,
        email: prospect.email,
        phone: prospect.phone,
        potentialAum: prospect.potentialAum,
        source: prospect.source,
        notes: prospect.notes,
        referredBy: prospect.referredBy || '',
        nextAction: prospect.nextAction || '',
        nextActionDate: prospect.nextActionDate || '',
      })
      setMeetingNotes(prospect.meetingNotes || [])
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        potentialAum: 0,
        source: 'Website',
        notes: '',
        referredBy: '',
        nextAction: '',
        nextActionDate: '',
      })
      setMeetingNotes([])
    }
    setErrors({})
    setShowAddNote(false)
    setNewNote({ title: '', content: '', meetingType: 'CALL', meetingDate: new Date().toISOString().split('T')[0] })
  }, [prospect, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProspectFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }

    if (formData.potentialAum <= 0) {
      newErrors.potentialAum = 'Potential AUM must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData, meetingNotes)
      onClose()
    }
  }

  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return
    const note: ProspectMeetingNote = {
      id: `mn${Date.now()}`,
      ...newNote,
    }
    setMeetingNotes(prev => [note, ...prev])
    setNewNote({ title: '', content: '', meetingType: 'CALL', meetingDate: new Date().toISOString().split('T')[0] })
    setShowAddNote(false)
  }

  const handleDeleteNote = (noteId: string) => {
    setMeetingNotes(prev => prev.filter(n => n.id !== noteId))
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 25px 50px ${colors.glassShadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 p-5 flex items-center justify-between"
          style={{
            background: colors.cardBackground,
            borderBottom: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {isEditMode ? 'Edit Prospect' : 'Add New Prospect'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
              {isEditMode ? 'Update prospect details' : 'Enter prospect information'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{ background: colors.chipBg, color: colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <FALabel required>Full Name</FALabel>
            <FAInput
              placeholder="Enter prospect's name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FALabel required>Email</FALabel>
              <FAInput
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
            </div>
            <div>
              <FALabel required>Phone</FALabel>
              <FAInput
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
              />
            </div>
          </div>

          {/* Potential AUM & Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FALabel required>Potential AUM</FALabel>
              <FAInput
                type="number"
                placeholder="5000000"
                value={formData.potentialAum || ''}
                onChange={(e) => setFormData({ ...formData, potentialAum: parseFloat(e.target.value) || 0 })}
                error={errors.potentialAum}
              />
              {formData.potentialAum > 0 && (
                <p className="text-xs mt-1" style={{ color: colors.primary }}>
                  {formatCurrency(formData.potentialAum)}
                </p>
              )}
            </div>
            <div>
              <FALabel required>Lead Source</FALabel>
              <FASelect
                options={LEAD_SOURCES}
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
              />
            </div>
          </div>

          {/* Referred By (conditional) */}
          {formData.source === 'Referral' && (
            <div>
              <FALabel>Referred By</FALabel>
              <FAInput
                placeholder="Name of the referrer"
                value={formData.referredBy || ''}
                onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
              />
            </div>
          )}

          {/* Next Action */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FALabel>Next Action</FALabel>
              <FAInput
                placeholder="e.g. Follow-up call"
                value={formData.nextAction || ''}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              />
            </div>
            <div>
              <FALabel>Action Date</FALabel>
              <FAInput
                type="date"
                value={formData.nextActionDate || ''}
                onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <FALabel>Notes</FALabel>
            <FATextarea
              placeholder="Additional notes about the prospect..."
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Meeting Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FALabel>Meeting Notes</FALabel>
              <button
                type="button"
                onClick={() => setShowAddNote(!showAddNote)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
                style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={showAddNote ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
                </svg>
                {showAddNote ? 'Cancel' : 'Add Note'}
              </button>
            </div>

            {/* Inline Add Note Form */}
            {showAddNote && (
              <div
                className="p-3 rounded-xl mb-3 space-y-2.5"
                style={{ background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}` }}
              >
                <FAInput
                  placeholder="Meeting subject..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FAInput
                    type="date"
                    value={newNote.meetingDate}
                    onChange={(e) => setNewNote({ ...newNote, meetingDate: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-1">
                    {MEETING_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewNote({ ...newNote, meetingType: type.value })}
                        className="px-2 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: newNote.meetingType === type.value ? type.color : 'transparent',
                          color: newNote.meetingType === type.value ? '#FFFFFF' : colors.textSecondary,
                          border: `1px solid ${newNote.meetingType === type.value ? type.color : colors.cardBorder}`,
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <FATextarea
                  placeholder="Meeting notes..."
                  rows={2}
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                />
                <div className="flex justify-end">
                  <FAButton size="sm" onClick={handleAddNote} disabled={!newNote.title.trim() || !newNote.content.trim()}>
                    Add Note
                  </FAButton>
                </div>
              </div>
            )}

            {/* Existing Notes List */}
            {meetingNotes.length > 0 ? (
              <div className="space-y-2">
                {meetingNotes.map((note) => {
                  const typeInfo = MEETING_TYPES.find(t => t.value === note.meetingType) || MEETING_TYPES[4]
                  return (
                    <div
                      key={note.id}
                      className="p-2.5 rounded-xl flex items-start gap-2.5 group"
                      style={{
                        background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
                        borderLeft: `3px solid ${typeInfo.color}`,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{note.title}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}
                          >
                            {typeInfo.label}
                          </span>
                        </div>
                        <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{note.content}</p>
                        <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{note.meetingDate}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        style={{ color: colors.error }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-center py-3" style={{ color: colors.textTertiary }}>No meeting notes yet</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 p-5 flex items-center justify-end gap-3"
          style={{
            background: colors.cardBackground,
            borderTop: `1px solid ${colors.cardBorder}`,
          }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: colors.chipBg,
              color: colors.textPrimary,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            Cancel
          </button>
          <FAButton onClick={handleSubmit}>
            {isEditMode ? 'Update Prospect' : 'Add Prospect'}
          </FAButton>
        </div>
      </div>
    </div>
  )
}

export default ProspectFormModal
