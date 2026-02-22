/**
 * NMF Systematic Plans
 *
 * Register and manage NSE NMF SIP, XSIP, STP, and SWP plans.
 * Provides registration forms per plan type and a management section
 * to pause, resume, or cancel existing plans by registration ID.
 */

import { useState } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme } from '@/utils/fa'
import { nmfApi } from '@/services/api'
import {
  FACard,
  FAButton,
  FAInput,
  FASelect,
  FALabel,
  FAInfoTile,
  FASectionHeader,
} from '@/components/advisor/shared'
import NmfSchemePicker from '@/components/nmf/NmfSchemePicker'

// ─── Types ────────────────────────────────────────────────────────────────────

type SystematicType = 'SIP' | 'XSIP' | 'STP' | 'SWP'

interface SelectedScheme {
  schemeCode: string
  schemeName: string
}

interface SipFormData {
  clientId: string
  schemeCode: string
  schemeName: string
  amount: string
  frequency: string
  startDate: string
  endDate: string
  installments: string
  folioNumber: string
}

interface XsipFormData extends SipFormData {
  mandateId: string
}

interface StpFormData {
  clientId: string
  fromSchemeCode: string
  fromSchemeName: string
  toSchemeCode: string
  toSchemeName: string
  amount: string
  frequency: string
  startDate: string
  endDate: string
  installments: string
  folioNumber: string
}

interface SwpFormData {
  clientId: string
  fromSchemeCode: string
  fromSchemeName: string
  toSchemeCode: string
  toSchemeName: string
  amount: string
  frequency: string
  startDate: string
  endDate: string
  installments: string
  folioNumber: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<SystematicType, string> = {
  SIP: '#10B981',
  XSIP: '#3B82F6',
  STP: '#8B5CF6',
  SWP: '#F59E0B',
}

const TYPE_DESCRIPTIONS: Record<SystematicType, string> = {
  SIP: 'Systematic Investment Plan — regular periodic investments into a mutual fund scheme',
  XSIP: 'Extended SIP with mandate-based debit — supports step-up and direct mandate debit',
  STP: 'Systematic Transfer Plan — periodically transfer funds from one scheme to another',
  SWP: 'Systematic Withdrawal Plan — periodically redeem units from a scheme',
}

const FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly' },
  { value: 'DAILY', label: 'Daily' },
]

const INITIAL_SIP: SipFormData = {
  clientId: '',
  schemeCode: '',
  schemeName: '',
  amount: '',
  frequency: 'MONTHLY',
  startDate: '',
  endDate: '',
  installments: '',
  folioNumber: '',
}

const INITIAL_XSIP: XsipFormData = {
  ...INITIAL_SIP,
  mandateId: '',
}

const INITIAL_STP: StpFormData = {
  clientId: '',
  fromSchemeCode: '',
  fromSchemeName: '',
  toSchemeCode: '',
  toSchemeName: '',
  amount: '',
  frequency: 'MONTHLY',
  startDate: '',
  endDate: '',
  installments: '',
  folioNumber: '',
}

const INITIAL_SWP: SwpFormData = { ...INITIAL_STP }

// ─── Helper ───────────────────────────────────────────────────────────────────

function FeedbackTile({
  message,
  variant,
  onDismiss,
}: {
  message: string
  variant: 'success' | 'error'
  onDismiss: () => void
}) {
  const { colors } = useFATheme()
  const accentColor = variant === 'success' ? colors.success : colors.error

  return (
    <FAInfoTile variant={variant} className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {variant === 'success' ? (
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: accentColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: accentColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
          <p className="text-sm" style={{ color: accentColor }}>{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: accentColor }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </FAInfoTile>
  )
}

// ─── SIP Registration Form ────────────────────────────────────────────────────

function SipForm() {
  const { colors, isDark } = useFATheme()
  const [form, setForm] = useState<SipFormData>(INITIAL_SIP)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const set = (field: keyof SipFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSchemeSelect = (scheme: SelectedScheme) => {
    setForm(prev => ({ ...prev, schemeCode: scheme.schemeCode, schemeName: scheme.schemeName }))
  }

  const handleSubmit = async () => {
    if (!form.clientId || !form.schemeCode || !form.amount || !form.startDate) {
      setFeedback({ message: 'Please fill in all required fields: Client ID, Scheme, Amount, and Start Date.', variant: 'error' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.registerSip({
        clientId: form.clientId,
        schemeCode: form.schemeCode,
        amount: Number(form.amount),
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        installments: form.installments ? Number(form.installments) : undefined,
        folioNumber: form.folioNumber || undefined,
      })
      setFeedback({ message: 'SIP registered successfully. NSE will process the registration shortly.', variant: 'success' })
      setForm(INITIAL_SIP)
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to register SIP. Please check the details and try again.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {feedback && (
        <FeedbackTile
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FAInput
          label="Client ID"
          placeholder="e.g. FAC12345"
          value={form.clientId}
          onChange={e => set('clientId', e.target.value)}
          required
        />
        <FAInput
          label="Folio Number"
          placeholder="Leave blank for new folio"
          value={form.folioNumber}
          onChange={e => set('folioNumber', e.target.value)}
        />
      </div>

      <div className="mb-4">
        <FALabel required>Scheme</FALabel>
        <NmfSchemePicker filterType="sip" onSelect={handleSchemeSelect} placeholder="Search SIP-eligible schemes..." />
        {form.schemeName && (
          <p className="text-xs mt-1.5 font-medium" style={{ color: colors.primary }}>{form.schemeName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FAInput
          label="Amount (INR)"
          type="number"
          placeholder="e.g. 5000"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          required
        />
        <FASelect
          label="Frequency"
          value={form.frequency}
          onChange={e => set('frequency', e.target.value)}
          options={FREQUENCY_OPTIONS}
        />
        <FAInput
          label="Installments"
          type="number"
          placeholder="e.g. 12 (blank = perpetual)"
          value={form.installments}
          onChange={e => set('installments', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <FAInput
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={e => set('startDate', e.target.value)}
          required
        />
        <FAInput
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={e => set('endDate', e.target.value)}
        />
      </div>

      <FAButton onClick={handleSubmit} loading={submitting} size="md">
        Register SIP
      </FAButton>
    </div>
  )
}

// ─── XSIP Registration Form ───────────────────────────────────────────────────

function XsipForm() {
  const { colors } = useFATheme()
  const [form, setForm] = useState<XsipFormData>(INITIAL_XSIP)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const set = (field: keyof XsipFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSchemeSelect = (scheme: SelectedScheme) => {
    setForm(prev => ({ ...prev, schemeCode: scheme.schemeCode, schemeName: scheme.schemeName }))
  }

  const handleSubmit = async () => {
    if (!form.clientId || !form.schemeCode || !form.amount || !form.startDate || !form.mandateId) {
      setFeedback({ message: 'Please fill in all required fields: Client ID, Scheme, Amount, Start Date, and Mandate ID.', variant: 'error' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.registerXsip({
        clientId: form.clientId,
        schemeCode: form.schemeCode,
        amount: Number(form.amount),
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        installments: form.installments ? Number(form.installments) : undefined,
        folioNumber: form.folioNumber || undefined,
        mandateId: form.mandateId,
      })
      setFeedback({ message: 'XSIP registered successfully. NSE will process the registration shortly.', variant: 'success' })
      setForm(INITIAL_XSIP)
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to register XSIP. Please verify the mandate ID and details.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {feedback && (
        <FeedbackTile
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FAInput
          label="Client ID"
          placeholder="e.g. FAC12345"
          value={form.clientId}
          onChange={e => set('clientId', e.target.value)}
          required
        />
        <FAInput
          label="Mandate ID"
          placeholder="NSE mandate registration ID"
          value={form.mandateId}
          onChange={e => set('mandateId', e.target.value)}
          required
          helperText="eNACH or physical mandate must be approved before XSIP registration"
        />
      </div>

      <div className="mb-4">
        <FALabel required>Scheme</FALabel>
        <NmfSchemePicker filterType="sip" onSelect={handleSchemeSelect} placeholder="Search SIP-eligible schemes..." />
        {form.schemeName && (
          <p className="text-xs mt-1.5 font-medium" style={{ color: colors.primary }}>{form.schemeName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FAInput
          label="Amount (INR)"
          type="number"
          placeholder="e.g. 5000"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          required
        />
        <FASelect
          label="Frequency"
          value={form.frequency}
          onChange={e => set('frequency', e.target.value)}
          options={FREQUENCY_OPTIONS}
        />
        <FAInput
          label="Installments"
          type="number"
          placeholder="e.g. 12 (blank = perpetual)"
          value={form.installments}
          onChange={e => set('installments', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FAInput
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={e => set('startDate', e.target.value)}
          required
        />
        <FAInput
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={e => set('endDate', e.target.value)}
        />
        <FAInput
          label="Folio Number"
          placeholder="Leave blank for new folio"
          value={form.folioNumber}
          onChange={e => set('folioNumber', e.target.value)}
        />
      </div>

      <FAButton onClick={handleSubmit} loading={submitting} size="md">
        Register XSIP
      </FAButton>
    </div>
  )
}

// ─── STP Registration Form ────────────────────────────────────────────────────

function StpForm() {
  const { colors } = useFATheme()
  const [form, setForm] = useState<StpFormData>(INITIAL_STP)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const set = (field: keyof StpFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleFromSchemeSelect = (scheme: SelectedScheme) => {
    setForm(prev => ({ ...prev, fromSchemeCode: scheme.schemeCode, fromSchemeName: scheme.schemeName }))
  }

  const handleToSchemeSelect = (scheme: SelectedScheme) => {
    setForm(prev => ({ ...prev, toSchemeCode: scheme.schemeCode, toSchemeName: scheme.schemeName }))
  }

  const handleSubmit = async () => {
    if (!form.clientId || !form.fromSchemeCode || !form.toSchemeCode || !form.amount || !form.startDate) {
      setFeedback({ message: 'Please fill in all required fields: Client ID, both schemes, Amount, and Start Date.', variant: 'error' })
      return
    }
    if (form.fromSchemeCode === form.toSchemeCode) {
      setFeedback({ message: 'Source and target schemes must be different.', variant: 'error' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.registerStp({
        clientId: form.clientId,
        fromSchemeCode: form.fromSchemeCode,
        toSchemeCode: form.toSchemeCode,
        amount: Number(form.amount),
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        installments: form.installments ? Number(form.installments) : undefined,
        folioNumber: form.folioNumber || undefined,
      })
      setFeedback({ message: 'STP registered successfully. NSE will process the registration shortly.', variant: 'success' })
      setForm(INITIAL_STP)
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to register STP. Please check the scheme details and try again.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {feedback && (
        <FeedbackTile
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FAInput
          label="Client ID"
          placeholder="e.g. FAC12345"
          value={form.clientId}
          onChange={e => set('clientId', e.target.value)}
          required
        />
        <FAInput
          label="Folio Number"
          placeholder="Source scheme folio"
          value={form.folioNumber}
          onChange={e => set('folioNumber', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <FALabel required>From Scheme (Source)</FALabel>
          <NmfSchemePicker filterType="switch" onSelect={handleFromSchemeSelect} placeholder="Search source scheme..." />
          {form.fromSchemeName && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: colors.primary }}>{form.fromSchemeName}</p>
          )}
        </div>
        <div>
          <FALabel required>To Scheme (Target)</FALabel>
          <NmfSchemePicker filterType="purchase" onSelect={handleToSchemeSelect} placeholder="Search target scheme..." />
          {form.toSchemeName && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: '#8B5CF6' }}>{form.toSchemeName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FAInput
          label="Transfer Amount (INR)"
          type="number"
          placeholder="e.g. 5000"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          required
        />
        <FASelect
          label="Frequency"
          value={form.frequency}
          onChange={e => set('frequency', e.target.value)}
          options={FREQUENCY_OPTIONS}
        />
        <FAInput
          label="Installments"
          type="number"
          placeholder="e.g. 12 (blank = perpetual)"
          value={form.installments}
          onChange={e => set('installments', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <FAInput
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={e => set('startDate', e.target.value)}
          required
        />
        <FAInput
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={e => set('endDate', e.target.value)}
        />
      </div>

      <FAButton onClick={handleSubmit} loading={submitting} size="md">
        Register STP
      </FAButton>
    </div>
  )
}

// ─── SWP Registration Form ────────────────────────────────────────────────────

function SwpForm() {
  const { colors } = useFATheme()
  const [form, setForm] = useState<SwpFormData>(INITIAL_SWP)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const set = (field: keyof SwpFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleFromSchemeSelect = (scheme: SelectedScheme) => {
    setForm(prev => ({ ...prev, fromSchemeCode: scheme.schemeCode, fromSchemeName: scheme.schemeName }))
  }

  const handleToSchemeSelect = (scheme: SelectedScheme) => {
    setForm(prev => ({ ...prev, toSchemeCode: scheme.schemeCode, toSchemeName: scheme.schemeName }))
  }

  const handleSubmit = async () => {
    if (!form.clientId || !form.fromSchemeCode || !form.amount || !form.startDate) {
      setFeedback({ message: 'Please fill in all required fields: Client ID, Source Scheme, Amount, and Start Date.', variant: 'error' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.registerSwp({
        clientId: form.clientId,
        fromSchemeCode: form.fromSchemeCode,
        toSchemeCode: form.toSchemeCode || undefined,
        amount: Number(form.amount),
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        installments: form.installments ? Number(form.installments) : undefined,
        folioNumber: form.folioNumber || undefined,
      })
      setFeedback({ message: 'SWP registered successfully. NSE will process the registration shortly.', variant: 'success' })
      setForm(INITIAL_SWP)
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to register SWP. Please check the scheme details and try again.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {feedback && (
        <FeedbackTile
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FAInput
          label="Client ID"
          placeholder="e.g. FAC12345"
          value={form.clientId}
          onChange={e => set('clientId', e.target.value)}
          required
        />
        <FAInput
          label="Folio Number"
          placeholder="Source scheme folio"
          value={form.folioNumber}
          onChange={e => set('folioNumber', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <FALabel required>From Scheme (Withdrawal Source)</FALabel>
          <NmfSchemePicker filterType="redemption" onSelect={handleFromSchemeSelect} placeholder="Search scheme to withdraw from..." />
          {form.fromSchemeName && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: colors.primary }}>{form.fromSchemeName}</p>
          )}
        </div>
        <div>
          <FALabel>To Scheme (Optional Sweep Target)</FALabel>
          <NmfSchemePicker filterType="purchase" onSelect={handleToSchemeSelect} placeholder="Search target scheme (optional)..." />
          {form.toSchemeName && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: '#F59E0B' }}>{form.toSchemeName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FAInput
          label="Withdrawal Amount (INR)"
          type="number"
          placeholder="e.g. 10000"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          required
        />
        <FASelect
          label="Frequency"
          value={form.frequency}
          onChange={e => set('frequency', e.target.value)}
          options={FREQUENCY_OPTIONS}
        />
        <FAInput
          label="Installments"
          type="number"
          placeholder="e.g. 24 (blank = perpetual)"
          value={form.installments}
          onChange={e => set('installments', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <FAInput
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={e => set('startDate', e.target.value)}
          required
        />
        <FAInput
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={e => set('endDate', e.target.value)}
        />
      </div>

      <FAButton onClick={handleSubmit} loading={submitting} size="md">
        Register SWP
      </FAButton>
    </div>
  )
}

// ─── Management Section ───────────────────────────────────────────────────────

function ManagementSection() {
  const { colors, isDark } = useFATheme()
  const [registrationId, setRegistrationId] = useState('')
  const [pauseLoading, setPauseLoading] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const canAct = registrationId.trim().length > 0

  const handlePause = async () => {
    if (!canAct) return
    setPauseLoading(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.pause(registrationId.trim())
      setFeedback({ message: `Plan ${registrationId.trim()} has been paused successfully.`, variant: 'success' })
      setRegistrationId('')
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to pause the plan. Verify the registration ID and try again.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setPauseLoading(false)
    }
  }

  const handleResume = async () => {
    if (!canAct) return
    setResumeLoading(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.resume(registrationId.trim())
      setFeedback({ message: `Plan ${registrationId.trim()} has been resumed successfully.`, variant: 'success' })
      setRegistrationId('')
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to resume the plan. Verify the registration ID and try again.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setResumeLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!canAct) return
    if (!confirm(`Are you sure you want to cancel plan ${registrationId.trim()}? This action cannot be undone.`)) return
    setCancelLoading(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.cancel(registrationId.trim())
      setFeedback({ message: `Plan ${registrationId.trim()} has been cancelled successfully.`, variant: 'success' })
      setRegistrationId('')
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to cancel the plan. Verify the registration ID and try again.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <FACard className="mt-6">
      <FASectionHeader
        title="Manage Existing Plan"
        action={
          <span className="text-xs" style={{ color: colors.textTertiary }}>
            Enter the NSE registration ID to pause, resume, or cancel
          </span>
        }
      />

      {feedback && (
        <FeedbackTile
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <FAInput
            label="Registration ID"
            placeholder="e.g. NMF123456789"
            value={registrationId}
            onChange={e => setRegistrationId(e.target.value)}
            helperText="The NSE systematic registration reference ID returned at registration time"
          />
        </div>

        <div className="flex items-center gap-2 pb-0 sm:pb-0">
          {/* Pause */}
          <button
            onClick={handlePause}
            disabled={!canAct || pauseLoading || resumeLoading || cancelLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canAct ? `${colors.warning}15` : colors.chipBg,
              border: `1px solid ${canAct ? `${colors.warning}40` : colors.cardBorder}`,
              color: canAct ? colors.warning : colors.textTertiary,
            }}
          >
            {pauseLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.warning} transparent ${colors.warning} ${colors.warning}` }} />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Pause
          </button>

          {/* Resume */}
          <button
            onClick={handleResume}
            disabled={!canAct || pauseLoading || resumeLoading || cancelLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canAct ? `${colors.success}15` : colors.chipBg,
              border: `1px solid ${canAct ? `${colors.success}40` : colors.cardBorder}`,
              color: canAct ? colors.success : colors.textTertiary,
            }}
          >
            {resumeLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.success} transparent ${colors.success} ${colors.success}` }} />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Resume
          </button>

          {/* Cancel */}
          <button
            onClick={handleCancel}
            disabled={!canAct || pauseLoading || resumeLoading || cancelLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canAct ? `${colors.error}15` : colors.chipBg,
              border: `1px solid ${canAct ? `${colors.error}40` : colors.cardBorder}`,
              color: canAct ? colors.error : colors.textTertiary,
            }}
          >
            {cancelLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.error} transparent ${colors.error} ${colors.error}` }} />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Cancel
          </button>
        </div>
      </div>

      {/* Info strip */}
      <div
        className="mt-4 p-3 rounded-lg flex items-start gap-2"
        style={{
          background: isDark ? `${colors.primary}08` : `${colors.primary}05`,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: colors.primary }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.primary }}>Pause / Resume</span> — supported for SIP and XSIP plans only. The registration ID is the NSE reference returned at plan creation.
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.error }}>Cancel</span> — permanently terminates the plan. This action is irreversible. Installments already processed are not affected.
          </p>
        </div>
      </div>
    </FACard>
  )
}

// ─── SIP Top-Up Section ───────────────────────────────────────────────────────

function SipTopupSection() {
  const { colors } = useFATheme()
  const [sipRegId, setSipRegId] = useState('')
  const [topupAmount, setTopupAmount] = useState('')
  const [topupFrequency, setTopupFrequency] = useState('MONTHLY')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const handleSubmit = async () => {
    if (!sipRegId.trim() || !topupAmount) {
      setFeedback({ message: 'Please provide the SIP Registration ID and top-up amount.', variant: 'error' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    try {
      await nmfApi.systematic.sipTopup({
        sipRegistrationId: sipRegId.trim(),
        topupAmount: Number(topupAmount),
        frequency: topupFrequency,
      })
      setFeedback({ message: 'SIP top-up registered successfully.', variant: 'success' })
      setSipRegId('')
      setTopupAmount('')
      setTopupFrequency('MONTHLY')
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to register SIP top-up.'
      setFeedback({ message: msg, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FACard className="mt-4">
      <FASectionHeader
        title="SIP Top-Up"
        action={
          <span className="text-xs" style={{ color: colors.textTertiary }}>
            Increase instalment amount for an existing SIP
          </span>
        }
      />

      {feedback && (
        <FeedbackTile
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FAInput
          label="SIP Registration ID"
          placeholder="e.g. NMF123456789"
          value={sipRegId}
          onChange={e => setSipRegId(e.target.value)}
          required
        />
        <FAInput
          label="Top-Up Amount (INR)"
          type="number"
          placeholder="Additional amount per instalment"
          value={topupAmount}
          onChange={e => setTopupAmount(e.target.value)}
          required
        />
        <FASelect
          label="Top-Up Frequency"
          value={topupFrequency}
          onChange={e => setTopupFrequency(e.target.value)}
          options={FREQUENCY_OPTIONS}
        />
      </div>

      <FAButton onClick={handleSubmit} loading={submitting} size="md">
        Register Top-Up
      </FAButton>
    </FACard>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NMFSystematicPage = () => {
  const { colors, isDark } = useFATheme()
  const [activeType, setActiveType] = useState<SystematicType>('SIP')

  const kpiData: Array<{ label: string; type: SystematicType; desc: string }> = [
    { label: 'SIP', type: 'SIP', desc: 'Systematic Investment Plan' },
    { label: 'XSIP', type: 'XSIP', desc: 'Mandate-Based SIP' },
    { label: 'STP', type: 'STP', desc: 'Systematic Transfer Plan' },
    { label: 'SWP', type: 'SWP', desc: 'Systematic Withdrawal Plan' },
  ]

  return (
    <AdvisorLayout title="NMF Systematic Plans">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
            NMF Systematic Plans
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Register and manage NSE NMF systematic plans — SIP, XSIP, STP, and SWP — for your clients.
          </p>
        </div>

        {/* ── KPI / Type Selector Tiles ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpiData.map(({ label, type, desc }) => {
            const color = TYPE_COLORS[type]
            const isActive = activeType === type
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className="text-left p-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${color}18 0%, ${color}0a 100%)`
                    : (isDark ? 'rgba(147,197,253,0.03)' : 'rgba(59,130,246,0.02)'),
                  border: `1px solid ${isActive ? `${color}40` : colors.cardBorder}`,
                  boxShadow: isActive ? `0 4px 14px ${color}20` : 'none',
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: isActive ? color : colors.textTertiary }}
                >
                  {label}
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: isActive ? color : colors.textSecondary }}
                >
                  {label}
                </p>
                <p className="text-xs mt-1" style={{ color: isActive ? `${color}CC` : colors.textTertiary }}>
                  {desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* ── Type Description Banner ── */}
        <div
          className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{
            background: `${TYPE_COLORS[activeType]}08`,
            border: `1px solid ${TYPE_COLORS[activeType]}20`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold"
            style={{
              background: `${TYPE_COLORS[activeType]}20`,
              color: TYPE_COLORS[activeType],
            }}
          >
            {activeType[0]}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: TYPE_COLORS[activeType] }}>
              {activeType} Registration
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {TYPE_DESCRIPTIONS[activeType]}
            </p>
          </div>
        </div>

        {/* ── Registration Form Card ── */}
        <FACard>
          <FASectionHeader
            title={`Register New ${activeType}`}
            action={
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: `${TYPE_COLORS[activeType]}15`,
                  color: TYPE_COLORS[activeType],
                  border: `1px solid ${TYPE_COLORS[activeType]}30`,
                }}
              >
                {activeType}
              </span>
            }
          />

          {activeType === 'SIP' && <SipForm key="sip" />}
          {activeType === 'XSIP' && <XsipForm key="xsip" />}
          {activeType === 'STP' && <StpForm key="stp" />}
          {activeType === 'SWP' && <SwpForm key="swp" />}
        </FACard>

        {/* ── SIP Top-Up (only shown when SIP is active) ── */}
        {activeType === 'SIP' && <SipTopupSection />}

        {/* ── Management Section ── */}
        <ManagementSection />

        {/* ── Bottom Spacer ── */}
        <div className="h-8" />
      </div>
    </AdvisorLayout>
  )
}

export default NMFSystematicPage
