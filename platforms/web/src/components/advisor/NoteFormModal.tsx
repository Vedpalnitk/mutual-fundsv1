/**
 * Meeting Note Form Modal
 *
 * Modal component for adding meeting notes in the FA portal.
 * Follows ProspectFormModal pattern.
 */

import { useState } from 'react'
import { useFATheme } from '@/utils/fa'
import { CreateNoteRequest } from '@/services/api'
import {
  FACard,
  FALabel,
  FAInput,
  FATextarea,
  FAButton,
} from '@/components/advisor/shared'

interface NoteFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateNoteRequest) => void
  submitting?: boolean
}

const MEETING_TYPES = [
  { value: 'CALL', label: 'Call', color: '#3B82F6' },
  { value: 'IN_PERSON', label: 'In Person', color: '#10B981' },
  { value: 'VIDEO', label: 'Video', color: '#8B5CF6' },
  { value: 'EMAIL', label: 'Email', color: '#F59E0B' },
  { value: 'OTHER', label: 'Other', color: '#94A3B8' },
]

const NoteFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
}: NoteFormModalProps) => {
  const { colors, isDark } = useFATheme()

  const [formData, setFormData] = useState<CreateNoteRequest>({
    title: '',
    content: '',
    meetingType: 'CALL',
    meetingDate: new Date().toISOString().split('T')[0],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.title.trim()) errs.title = 'Title is required'
    if (!formData.content.trim()) errs.content = 'Content is required'
    if (!formData.meetingDate) errs.meetingDate = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(formData)
    // Reset form
    setFormData({
      title: '',
      content: '',
      meetingType: 'CALL',
      meetingDate: new Date().toISOString().split('T')[0],
    })
    setErrors({})
  }

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      meetingType: 'CALL',
      meetingDate: new Date().toISOString().split('T')[0],
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-lg rounded-2xl p-6 mx-4"
        style={{
          background: colors.background,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            Add Meeting Note
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: colors.textTertiary }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div>
            <FALabel required>Title</FALabel>
            <FAInput
              placeholder="Meeting subject..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
            />
          </div>

          {/* Date */}
          <div>
            <FALabel required>Meeting Date</FALabel>
            <FAInput
              type="date"
              value={formData.meetingDate}
              onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
              error={errors.meetingDate}
            />
          </div>

          {/* Meeting Type */}
          <div>
            <FALabel required>Meeting Type</FALabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {MEETING_TYPES.map((type) => {
                const isSelected = formData.meetingType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, meetingType: type.value })}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: isSelected ? type.color : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      border: `1px solid ${isSelected ? type.color : colors.cardBorder}`,
                    }}
                  >
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <FALabel required>Notes</FALabel>
            <FATextarea
              placeholder="Meeting notes, action items, follow-ups..."
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              error={errors.content}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={{ color: colors.textSecondary }}
          >
            Cancel
          </button>
          <FAButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Note'}
          </FAButton>
        </div>
      </div>
    </div>
  )
}

export default NoteFormModal
