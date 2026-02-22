/**
 * Convert to Client Modal
 *
 * Modal for converting a prospect to a client.
 * Allows pre-filling client data from prospect information.
 */

import { useState, useEffect } from 'react'
import { useFATheme, formatCurrency, getStageColor } from '@/utils/fa'
import { Prospect, ClientFormData, RiskProfile } from '@/utils/faTypes'
import {
  FACard,
  FAChip,
  FALabel,
  FAInput,
  FASelect,
  FAButton,
} from '@/components/advisor/shared'

interface ConvertToClientModalProps {
  isOpen: boolean
  onClose: () => void
  onConvert: (clientData: ClientFormData) => void
  prospect: Prospect | null
}

const RISK_PROFILES: { value: RiskProfile; label: string }[] = [
  { value: 'Conservative', label: 'Conservative' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Aggressive', label: 'Aggressive' },
]

const ConvertToClientModal = ({
  isOpen,
  onClose,
  onConvert,
  prospect,
}: ConvertToClientModalProps) => {
  const { colors } = useFATheme()

  const [formData, setFormData] = useState<ClientFormData>({
    name: prospect?.name || '',
    email: prospect?.email || '',
    phone: prospect?.phone || '',
    pan: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    riskProfile: 'Moderate',
  })

  const [step, setStep] = useState<'review' | 'details'>('review')
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({})

  // Reset form when prospect changes
  useEffect(() => {
    if (prospect) {
      setFormData({
        name: prospect.name,
        email: prospect.email,
        phone: prospect.phone,
        pan: '',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        riskProfile: 'Moderate',
      })
      setStep('review')
    }
  }, [prospect])

  const validateDetails = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {}

    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN is required'
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      newErrors.pan = 'Invalid PAN format'
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProceed = () => {
    setStep('details')
  }

  const handleConvert = () => {
    if (validateDetails()) {
      onConvert({
        ...formData,
        pan: formData.pan.toUpperCase(),
      })
      onClose()
    }
  }

  if (!isOpen || !prospect) return null

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
          className="sticky top-0 p-5"
          style={{
            background: colors.cardBackground,
            borderBottom: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${colors.success}15`, color: colors.success }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                  Convert to Client
                </h2>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {step === 'review' ? 'Review prospect details' : 'Complete client information'}
                </p>
              </div>
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

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: step === 'review' ? `${colors.primary}15` : `${colors.success}15`,
                color: step === 'review' ? colors.primary : colors.success,
              }}
            >
              {step === 'details' && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>1. Review</span>
            </div>
            <div className="w-8 h-0.5" style={{ background: colors.cardBorder }} />
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: step === 'details' ? `${colors.primary}15` : colors.chipBg,
                color: step === 'details' ? colors.primary : colors.textTertiary,
              }}
            >
              <span>2. Complete Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Review */}
        {step === 'review' && (
          <div className="p-5">
            {/* Prospect Summary */}
            <div
              className="p-4 rounded-xl mb-4"
              style={{
                background: `linear-gradient(135deg, ${colors.success}08 0%, ${colors.primary}04 100%)`,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`,
                  }}
                >
                  {prospect.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{prospect.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FAChip color={getStageColor('Closed Won', colors)}>Closed Won</FAChip>
                    <span className="text-xs" style={{ color: colors.textTertiary }}>via {prospect.source}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Email</p>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{prospect.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Phone</p>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{prospect.phone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Potential AUM</p>
                  <p className="text-sm font-bold" style={{ color: colors.success }}>{formatCurrency(prospect.potentialAum)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Created</p>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {new Date(prospect.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {prospect.notes && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>Notes</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{prospect.notes}</p>
                </div>
              )}
            </div>

            {/* Conversion Info */}
            <div
              className="p-3 rounded-lg flex items-start gap-3"
              style={{ background: `${colors.warning}10`, border: `1px solid ${colors.warning}20` }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: colors.warning }}>Before Conversion</p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  You'll need to complete the client's KYC details including PAN, date of birth, and address.
                  The client will be created with a pending KYC status.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Complete Details */}
        {step === 'details' && (
          <div className="p-5 space-y-4">
            {/* Basic Info (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FALabel>Name</FALabel>
                <FAInput
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <FALabel>Email</FALabel>
                <FAInput
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* KYC Details */}
            <div
              className="p-4 rounded-xl space-y-4"
              style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                KYC Details
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FALabel required>PAN Number</FALabel>
                  <FAInput
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    error={errors.pan}
                    maxLength={10}
                  />
                </div>
                <div>
                  <FALabel required>Date of Birth</FALabel>
                  <FAInput
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    error={errors.dateOfBirth}
                  />
                </div>
              </div>

              <div>
                <FALabel>Risk Profile</FALabel>
                <FASelect
                  options={RISK_PROFILES}
                  value={formData.riskProfile}
                  onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value as RiskProfile })}
                />
              </div>
            </div>

            {/* Address (Optional) */}
            <div
              className="p-4 rounded-xl space-y-4"
              style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                Address (Optional)
              </p>

              <div>
                <FALabel>Address</FALabel>
                <FAInput
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FALabel>City</FALabel>
                  <FAInput
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <FALabel>State</FALabel>
                  <FAInput
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <FALabel>Pincode</FALabel>
                  <FAInput
                    placeholder="400001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    maxLength={6}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="sticky bottom-0 p-5 flex items-center justify-between"
          style={{
            background: colors.cardBackground,
            borderTop: `1px solid ${colors.cardBorder}`,
          }}
        >
          <button
            onClick={step === 'details' ? () => setStep('review') : onClose}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: colors.chipBg,
              color: colors.textPrimary,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            {step === 'details' ? 'Back' : 'Cancel'}
          </button>
          <FAButton onClick={step === 'review' ? handleProceed : handleConvert}>
            {step === 'review' ? 'Proceed to Details' : 'Convert to Client'}
          </FAButton>
        </div>
      </div>
    </div>
  )
}

export default ConvertToClientModal
