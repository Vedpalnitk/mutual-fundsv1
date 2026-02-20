/**
 * BSE Transfer In (Change of Broker) Page
 *
 * Step wizard for transferring a client's mutual fund investments
 * from another broker's ARN to the advisor's ARN via BSE StAR MF.
 */

import { useState, useEffect } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrencyCompact } from '@/utils/fa'
import { useNotification } from '@/components/advisor/shared'
import { clientsApi, bseApi } from '@/services/api'

interface ClientOption {
  id: string
  name: string
  pan?: string
  email: string
  bseClientCode?: string
}

interface COBFormData {
  clientId: string
  clientName: string
  schemeCode: string
  folioNumber: string
  allUnits: boolean
  units: string
  fromArn: string
  remarks: string
}

const STEPS = [
  { number: 1, label: 'Select Client' },
  { number: 2, label: 'Scheme & Folio' },
  { number: 3, label: 'Units' },
  { number: 4, label: 'Confirmation' },
  { number: 5, label: 'Submit' },
]

const initialFormData: COBFormData = {
  clientId: '',
  clientName: '',
  schemeCode: '',
  folioNumber: '',
  allUnits: true,
  units: '',
  fromArn: '',
  remarks: '',
}

const BSEChangeOfBrokerPage = () => {
  const { colors, isDark } = useFATheme()
  const { success, error: notifyError } = useNotification()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<COBFormData>(initialFormData)

  // Step 1 state
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')

  // Step 5 state
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; orderId?: string; message?: string } | null>(null)

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true)
        const response = await clientsApi.list<ClientOption>({ limit: 200 })
        setClients(response.data || [])
      } catch (err) {
        console.error('[COB] Failed to load clients:', err)
        notifyError('Failed to load clients')
      } finally {
        setClientsLoading(false)
      }
    }
    fetchClients()
  }, [])

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true
    const term = clientSearch.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.pan && c.pan.toLowerCase().includes(term))
    )
  })

  const selectClient = (client: ClientOption) => {
    setFormData(prev => ({ ...prev, clientId: client.id, clientName: client.name }))
    setCurrentStep(2)
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.clientId
      case 2:
        return !!formData.schemeCode.trim() && !!formData.folioNumber.trim()
      case 3:
        return formData.allUnits || (!!formData.units && parseFloat(formData.units) > 0)
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setSubmitResult(null)

      const payload: {
        clientId: string
        schemeCode: string
        folioNumber: string
        allUnits?: boolean
        units?: number
        fromArn?: string
        remarks?: string
      } = {
        clientId: formData.clientId,
        schemeCode: formData.schemeCode.trim(),
        folioNumber: formData.folioNumber.trim(),
      }

      if (formData.allUnits) {
        payload.allUnits = true
      } else {
        payload.units = parseFloat(formData.units)
      }

      if (formData.fromArn.trim()) {
        payload.fromArn = formData.fromArn.trim()
      }

      if (formData.remarks.trim()) {
        payload.remarks = formData.remarks.trim()
      }

      const result = await bseApi.orders.cob(payload)
      setSubmitResult({
        success: true,
        orderId: result?.orderId || result?.id || 'N/A',
        message: 'Transfer request submitted successfully',
      })
      success('COB order placed', `Order ID: ${result?.orderId || result?.id || 'N/A'}`)
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.message || 'Failed to submit transfer request'
      setSubmitResult({ success: false, message })
      notifyError('COB order failed', message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setCurrentStep(1)
    setSubmitResult(null)
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // ─── Step Progress Indicator ───────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, i) => {
        const isActive = currentStep === step.number
        const isCompleted = currentStep > step.number
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.number} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={{
                  background: isCompleted
                    ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`
                    : isActive
                      ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                      : isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                  color: isCompleted || isActive ? '#FFFFFF' : colors.textTertiary,
                  boxShadow: isActive ? `0 4px 14px ${colors.glassShadow}` : 'none',
                }}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className="text-xs mt-1.5 font-medium whitespace-nowrap"
                style={{ color: isActive ? colors.primary : isCompleted ? colors.success : colors.textTertiary }}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className="w-12 md:w-20 h-0.5 mx-2 mb-5 transition-all"
                style={{
                  background: isCompleted
                    ? colors.success
                    : isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  // ─── Step 1: Select Client ─────────────────────────────────────────────

  const Step1SelectClient = () => (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: colors.primary }}
      >
        Search Client
      </label>
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: colors.textTertiary }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, email, or PAN..."
          value={clientSearch}
          onChange={e => setClientSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
          }}
        />
      </div>

      {clientsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
            />
            <span className="text-sm" style={{ color: colors.textSecondary }}>Loading clients...</span>
          </div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-10 h-10 mb-3" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No clients found</p>
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Try a different search term</p>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {filteredClients.map(client => {
            const isSelected = formData.clientId === client.id
            return (
              <div
                key={client.id}
                onClick={() => selectClient(client)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: isSelected
                    ? `${colors.primary}10`
                    : 'transparent',
                  border: `1px solid ${isSelected ? `${colors.primary}30` : 'transparent'}`,
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)'
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >
                  {getInitials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: colors.textSecondary }}>{client.email}</span>
                    {client.pan && (
                      <>
                        <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>{client.pan}</span>
                      </>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ─── Step 2: Scheme + Folio ────────────────────────────────────────────

  const Step2SchemeAndFolio = () => (
    <div className="space-y-5">
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          Scheme Code
        </label>
        <input
          type="text"
          placeholder="Enter BSE scheme code (e.g. INF200K01234)"
          value={formData.schemeCode}
          onChange={e => setFormData(prev => ({ ...prev, schemeCode: e.target.value }))}
          className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
          }}
        />
        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          The BSE scheme code for the mutual fund being transferred
        </p>
      </div>

      <div>
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          Folio Number
        </label>
        <input
          type="text"
          placeholder="Enter folio number"
          value={formData.folioNumber}
          onChange={e => setFormData(prev => ({ ...prev, folioNumber: e.target.value }))}
          className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
          }}
        />
        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          The existing folio number under the current broker
        </p>
      </div>

      <div>
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          From ARN (Optional)
        </label>
        <input
          type="text"
          placeholder="Current broker's ARN (e.g. ARN-12345)"
          value={formData.fromArn}
          onChange={e => setFormData(prev => ({ ...prev, fromArn: e.target.value }))}
          className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
          }}
        />
        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          The ARN of the current broker/distributor (if known)
        </p>
      </div>
    </div>
  )

  // ─── Step 3: Units ─────────────────────────────────────────────────────

  const Step3Units = () => (
    <div className="space-y-5">
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          Transfer Units
        </label>

        {/* Toggle */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => setFormData(prev => ({ ...prev, allUnits: true, units: '' }))}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: formData.allUnits
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                : colors.inputBg,
              color: formData.allUnits ? '#FFFFFF' : colors.textSecondary,
              border: `1px solid ${formData.allUnits ? 'transparent' : colors.inputBorder}`,
              boxShadow: formData.allUnits ? `0 4px 14px ${colors.glassShadow}` : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              All Units
            </div>
          </button>

          <button
            onClick={() => setFormData(prev => ({ ...prev, allUnits: false }))}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: !formData.allUnits
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                : colors.inputBg,
              color: !formData.allUnits ? '#FFFFFF' : colors.textSecondary,
              border: `1px solid ${!formData.allUnits ? 'transparent' : colors.inputBorder}`,
              boxShadow: !formData.allUnits ? `0 4px 14px ${colors.glassShadow}` : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Specific Units
            </div>
          </button>
        </div>
      </div>

      {/* Specific units input */}
      {!formData.allUnits && (
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            Number of Units
          </label>
          <input
            type="number"
            placeholder="Enter number of units to transfer"
            value={formData.units}
            onChange={e => setFormData(prev => ({ ...prev, units: e.target.value }))}
            min="0"
            step="0.001"
            className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
            style={{
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              color: colors.textPrimary,
            }}
          />
          {formData.units && parseFloat(formData.units) > 0 && (
            <p className="text-xs mt-1.5" style={{ color: colors.success }}>
              {parseFloat(formData.units).toFixed(3)} units will be transferred
            </p>
          )}
        </div>
      )}

      {formData.allUnits && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: `${colors.primary}06`,
            border: `1px solid ${colors.primary}15`,
          }}
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                All units will be transferred
              </p>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                The entire holding under this folio and scheme will be moved to your ARN.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Optional remarks */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          Remarks (Optional)
        </label>
        <input
          type="text"
          placeholder="Any additional notes for this transfer"
          value={formData.remarks}
          onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
          className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
          }}
        />
      </div>
    </div>
  )

  // ─── Step 4: Confirmation ──────────────────────────────────────────────

  const Step4Confirmation = () => (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(125, 211, 252, 0.03) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(56, 189, 248, 0.02) 100%)',
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>
          Transfer Summary
        </p>
        <div className="space-y-3">
          {[
            { label: 'Client', value: formData.clientName },
            { label: 'Scheme Code', value: formData.schemeCode, mono: true },
            { label: 'Folio Number', value: formData.folioNumber, mono: true },
            { label: 'Units', value: formData.allUnits ? 'All Units' : `${parseFloat(formData.units).toFixed(3)} units` },
            ...(formData.fromArn.trim() ? [{ label: 'From ARN', value: formData.fromArn.trim(), mono: true }] : []),
            ...(formData.remarks.trim() ? [{ label: 'Remarks', value: formData.remarks.trim() }] : []),
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: colors.textTertiary }}>{row.label}</span>
              <span
                className={`text-sm font-medium ${row.mono ? 'font-mono' : ''}`}
                style={{ color: colors.textPrimary }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-4 rounded-xl"
        style={{
          background: `${colors.warning}08`,
          border: `1px solid ${colors.warning}20`,
        }}
      >
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              Please verify all details before submitting
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              This will initiate a Change of Broker request via BSE StAR MF. The transfer may take 5-7 business days to process.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── Step 5: Submit + Result ───────────────────────────────────────────

  const Step5Result = () => (
    <div className="flex flex-col items-center justify-center py-6">
      {submitting ? (
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin"
            style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}`, borderWidth: '3px' }}
          />
          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            Submitting transfer request to BSE...
          </p>
        </div>
      ) : submitResult?.success ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `${colors.success}15` }}
          >
            <svg className="w-8 h-8" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>Transfer Request Submitted</p>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {submitResult.message}
            </p>
          </div>
          <div
            className="px-5 py-3 rounded-xl mt-2"
            style={{
              background: `${colors.success}08`,
              border: `1px solid ${colors.success}20`,
            }}
          >
            <p className="text-xs" style={{ color: colors.textTertiary }}>Order ID</p>
            <p className="text-lg font-bold font-mono" style={{ color: colors.success }}>
              {submitResult.orderId}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="mt-4 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`,
            }}
          >
            New Transfer
          </button>
        </div>
      ) : submitResult ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `${colors.error}15` }}
          >
            <svg className="w-8 h-8" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>Submission Failed</p>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {submitResult.message}
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setSubmitResult(null)
                setCurrentStep(4)
              }}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textSecondary,
              }}
            >
              Go Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <AdvisorLayout title="Transfer In (Change of Broker)">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Transfer a client's mutual fund investments from another broker to your ARN
          </p>
        </div>

        {/* Main Card */}
        <div
          className="rounded-xl overflow-hidden max-w-2xl mx-auto"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          {/* Card Header */}
          <div
            className="px-6 py-4"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.04) 0%, rgba(125, 211, 252, 0.02) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(56, 189, 248, 0.015) 100%)',
              borderBottom: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${colors.primary}12` }}
              >
                <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                  Change of Broker
                </h2>
                <p className="text-xs" style={{ color: colors.textTertiary }}>
                  BSE StAR MF COB Request
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-6 py-6">
            {/* Step Indicator */}
            <StepIndicator />

            {/* Step Content */}
            {currentStep === 1 && <Step1SelectClient />}
            {currentStep === 2 && <Step2SchemeAndFolio />}
            {currentStep === 3 && <Step3Units />}
            {currentStep === 4 && <Step4Confirmation />}
            {currentStep === 5 && <Step5Result />}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-30"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textSecondary,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </div>
                </button>

                {currentStep === 4 ? (
                  <button
                    onClick={() => {
                      setCurrentStep(5)
                      handleSubmit()
                    }}
                    disabled={!canProceed()}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`,
                      boxShadow: `0 4px 14px ${colors.glassShadow}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Transfer
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      boxShadow: `0 4px 14px ${colors.glassShadow}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      Next
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdvisorLayout>
  )
}

export default BSEChangeOfBrokerPage
