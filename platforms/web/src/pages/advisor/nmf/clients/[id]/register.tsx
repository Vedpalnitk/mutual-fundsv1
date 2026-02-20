/**
 * NMF UCC Registration Wizard
 *
 * Multi-step wizard for registering an FA client with NSE NMF (UCC).
 * Steps: Personal Details -> Contact Details -> Bank Details -> Nominee Details -> Review & Submit
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme } from '@/utils/fa'
import { Client } from '@/utils/faTypes'
import { clientsApi, nmfApi } from '@/services/api'
import {
  FAButton,
  FAInput,
  FASelect,
  FALabel,
  FASpinner,
  FAChip,
  FAEmptyState,
} from '@/components/advisor/shared'

// ============================================================
// Types
// ============================================================

interface PersonalDetails {
  firstName: string
  middleName: string
  lastName: string
  pan: string
  dateOfBirth: string
  gender: string
  occupationCode: string
  taxStatus: string
}

interface ContactDetails {
  email: string
  mobile: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  city: string
  state: string
  pincode: string
  country: string
}

interface BankDetails {
  bankName: string
  accountNumber: string
  accountType: string
  ifscCode: string
  micrCode: string
}

interface NomineeDetails {
  nomineeName: string
  nomineeRelation: string
  nomineePercentage: string
}

type StepErrors = Record<string, string>

const STEPS = [
  { number: 1, label: 'Personal Details', shortLabel: 'Personal' },
  { number: 2, label: 'Contact Details', shortLabel: 'Contact' },
  { number: 3, label: 'Bank Details', shortLabel: 'Bank' },
  { number: 4, label: 'Nominee Details', shortLabel: 'Nominee' },
  { number: 5, label: 'Review & Submit', shortLabel: 'Review' },
]

const TAX_STATUS_OPTIONS = [
  { value: '01', label: 'Individual' },
  { value: '02', label: 'On behalf of Minor' },
  { value: '03', label: 'HUF' },
  { value: '04', label: 'Company' },
  { value: '06', label: 'Partnership Firm' },
  { value: '07', label: 'Body Corporate' },
  { value: '08', label: 'Trust' },
  { value: '11', label: 'NRI - NRE' },
  { value: '12', label: 'NRI - NRO' },
  { value: '21', label: 'Sole Proprietorship' },
]

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
]

const OCCUPATION_OPTIONS = [
  { value: '01', label: 'Private Sector Service' },
  { value: '02', label: 'Public Sector / Government Service' },
  { value: '03', label: 'Business' },
  { value: '04', label: 'Professional' },
  { value: '06', label: 'Retired' },
  { value: '07', label: 'Housewife' },
  { value: '08', label: 'Student' },
  { value: '41', label: 'Agriculture' },
  { value: '42', label: 'Self Employed' },
  { value: '99', label: 'Others' },
]

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'SB', label: 'Savings' },
  { value: 'CB', label: 'Current' },
  { value: 'NE', label: 'NRE' },
  { value: 'NO', label: 'NRO' },
]

const RELATIONSHIP_OPTIONS = [
  { value: 'SPOUSE', label: 'Spouse' },
  { value: 'SON', label: 'Son' },
  { value: 'DAUGHTER', label: 'Daughter' },
  { value: 'FATHER', label: 'Father' },
  { value: 'MOTHER', label: 'Mother' },
  { value: 'BROTHER', label: 'Brother' },
  { value: 'SISTER', label: 'Sister' },
  { value: 'OTHER', label: 'Other' },
]

const INDIAN_STATES = [
  { value: 'AN', label: 'Andaman & Nicobar' },
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' },
  { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' },
  { value: 'CH', label: 'Chandigarh' },
  { value: 'CT', label: 'Chhattisgarh' },
  { value: 'DD', label: 'Daman & Diu' },
  { value: 'DL', label: 'Delhi' },
  { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JK', label: 'Jammu & Kashmir' },
  { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' },
  { value: 'LA', label: 'Ladakh' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' },
  { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' },
  { value: 'NL', label: 'Nagaland' },
  { value: 'OR', label: 'Odisha' },
  { value: 'PY', label: 'Puducherry' },
  { value: 'PB', label: 'Punjab' },
  { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TG', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UT', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' },
]

// ============================================================
// Component
// ============================================================

const NmfRegisterClientPage = () => {
  const router = useRouter()
  const { id } = router.query
  const clientId = typeof id === 'string' ? id : ''
  const { colors, isDark } = useFATheme()

  // Client data
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // UCC status
  const [uccStatus, setUccStatus] = useState<any>(null)

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  // Step 1 - Personal Details
  const [personal, setPersonal] = useState<PersonalDetails>({
    firstName: '',
    middleName: '',
    lastName: '',
    pan: '',
    dateOfBirth: '',
    gender: 'M',
    occupationCode: '01',
    taxStatus: '01',
  })

  // Step 2 - Contact Details
  const [contact, setContact] = useState<ContactDetails>({
    email: '',
    mobile: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN',
  })

  // Step 3 - Bank Details
  const [bank, setBank] = useState<BankDetails>({
    bankName: '',
    accountNumber: '',
    accountType: 'SB',
    ifscCode: '',
    micrCode: '',
  })

  // Step 4 - Nominee Details
  const [nominee, setNominee] = useState<NomineeDetails>({
    nomineeName: '',
    nomineeRelation: 'SPOUSE',
    nomineePercentage: '100',
  })

  // Validation
  const [errors, setErrors] = useState<StepErrors>({})

  // ============================================================
  // Load client data + UCC status
  // ============================================================

  const fetchData = useCallback(async () => {
    if (!clientId) return
    try {
      setLoading(true)
      setLoadError(null)

      const [clientData, statusData] = await Promise.allSettled([
        clientsApi.getById<Client>(clientId),
        nmfApi.ucc.getStatus(clientId),
      ])

      if (clientData.status === 'fulfilled') {
        const data = clientData.value
        setClient(data)

        // Pre-fill personal details
        const nameParts = (data.name || '').split(' ')
        setPersonal(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
          lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
          pan: data.pan || '',
          dateOfBirth: data.dateOfBirth || '',
        }))

        // Pre-fill contact details
        setContact(prev => ({
          ...prev,
          email: data.email || '',
          mobile: data.phone || '',
        }))
      } else {
        setLoadError(clientData.reason?.message || 'Failed to load client details')
      }

      if (statusData.status === 'fulfilled') {
        setUccStatus(statusData.value)
      }
    } catch (err: any) {
      console.error('[NMF Register] Error loading data:', err)
      setLoadError(err.message || 'Failed to load client details')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ============================================================
  // Validation
  // ============================================================

  const validateStep = (step: number): boolean => {
    const errs: StepErrors = {}

    if (step === 1) {
      if (!personal.firstName.trim()) errs.firstName = 'First name is required'
      if (!personal.lastName.trim()) errs.lastName = 'Last name is required'
      if (!personal.pan.trim()) errs.pan = 'PAN is required'
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(personal.pan.toUpperCase())) errs.pan = 'Invalid PAN format (e.g., ABCDE1234F)'
      if (!personal.dateOfBirth) errs.dateOfBirth = 'Date of birth is required'
      if (!personal.gender) errs.gender = 'Gender is required'
      if (!personal.taxStatus) errs.taxStatus = 'Tax status is required'
    }

    if (step === 2) {
      if (!contact.email.trim()) errs.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errs.email = 'Invalid email format'
      if (!contact.mobile.trim()) errs.mobile = 'Mobile number is required'
      else if (!/^[6-9]\d{9}$/.test(contact.mobile.replace(/\D/g, ''))) errs.mobile = 'Invalid Indian mobile number'
      if (!contact.addressLine1.trim()) errs.addressLine1 = 'Address line 1 is required'
      if (!contact.city.trim()) errs.city = 'City is required'
      if (!contact.state) errs.state = 'State is required'
      if (!contact.pincode.trim()) errs.pincode = 'Pincode is required'
      else if (!/^\d{6}$/.test(contact.pincode)) errs.pincode = 'Invalid pincode (6 digits)'
    }

    if (step === 3) {
      if (!bank.bankName.trim()) errs.bankName = 'Bank name is required'
      if (!bank.accountNumber.trim()) errs.accountNumber = 'Account number is required'
      else if (!/^\d{9,18}$/.test(bank.accountNumber)) errs.accountNumber = 'Invalid account number (9-18 digits)'
      if (!bank.accountType) errs.accountType = 'Account type is required'
      if (!bank.ifscCode.trim()) errs.ifscCode = 'IFSC code is required'
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode.toUpperCase())) errs.ifscCode = 'Invalid IFSC format'
    }

    // Step 4 - Nominee is optional, but if name is provided validate relation/percentage
    if (step === 4) {
      if (nominee.nomineeName.trim()) {
        if (!nominee.nomineeRelation) errs.nomineeRelation = 'Nominee relation is required'
        if (!nominee.nomineePercentage) errs.nomineePercentage = 'Percentage is required'
        else {
          const pct = Number(nominee.nomineePercentage)
          if (isNaN(pct) || pct < 1 || pct > 100) errs.nomineePercentage = 'Percentage must be 1-100'
        }
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ============================================================
  // Navigation
  // ============================================================

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
      setErrors({})
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setErrors({})
  }

  const handleGoToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step)
      setErrors({})
    }
  }

  // ============================================================
  // Submit
  // ============================================================

  const handleSubmit = async () => {
    if (!clientId) return

    try {
      setSubmitting(true)
      setSubmitResult(null)

      const formData = {
        // Personal
        firstName: personal.firstName.trim(),
        middleName: personal.middleName.trim(),
        lastName: personal.lastName.trim(),
        pan: personal.pan.toUpperCase(),
        dateOfBirth: personal.dateOfBirth,
        gender: personal.gender,
        occupationCode: personal.occupationCode,
        taxStatus: personal.taxStatus,
        // Contact
        email: contact.email.trim(),
        mobile: contact.mobile.replace(/\D/g, ''),
        addressLine1: contact.addressLine1.trim(),
        addressLine2: contact.addressLine2.trim(),
        addressLine3: contact.addressLine3.trim(),
        city: contact.city.trim(),
        state: contact.state,
        pincode: contact.pincode.trim(),
        country: contact.country,
        // Bank
        bankName: bank.bankName.trim(),
        accountNumber: bank.accountNumber,
        accountType: bank.accountType,
        ifscCode: bank.ifscCode.toUpperCase(),
        micrCode: bank.micrCode,
        // Nominee
        nomineeName: nominee.nomineeName.trim(),
        nomineeRelation: nominee.nomineeRelation,
        nomineePercentage: nominee.nomineeName.trim() ? Number(nominee.nomineePercentage) : undefined,
      }

      await nmfApi.ucc.register(clientId, formData)

      setSubmitResult({
        success: true,
        message: 'Client registered successfully with NSE NMF. UCC creation has been submitted for processing.',
      })
    } catch (err: any) {
      console.error('[NMF Register] Submit error:', err)
      setSubmitResult({
        success: false,
        message: err.message || 'Registration failed. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // Helper: update nested state
  // ============================================================

  const updatePersonal = (field: keyof PersonalDetails, value: string) => {
    setPersonal(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const updateContact = (field: keyof ContactDetails, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const updateBank = (field: keyof BankDetails, value: string) => {
    setBank(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const updateNominee = (field: keyof NomineeDetails, value: string) => {
    setNominee(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  // ============================================================
  // Helper: get label from options
  // ============================================================

  const getLabelFromOptions = (options: { value: string; label: string }[], value: string): string => {
    return options.find(o => o.value === value)?.label || value
  }

  // ============================================================
  // Render: Already Registered Status Card
  // ============================================================

  const renderAlreadyRegistered = () => {
    if (!uccStatus || uccStatus.status !== 'Approved') return null

    return (
      <div className="max-w-3xl mx-auto">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          <div
            className="px-5 py-3"
            style={{
              background: isDark ? 'rgba(52,211,153,0.06)' : 'rgba(16,185,129,0.04)',
              borderBottom: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.success }}>
                Already Registered
              </h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              This client is already registered with NSE NMF. UCC registration has been approved.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {uccStatus.uccCode && (
                <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>UCC Code</span>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>{uccStatus.uccCode}</span>
                </div>
              )}
              {uccStatus.pan && (
                <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>PAN</span>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>{uccStatus.pan}</span>
                </div>
              )}
              {uccStatus.clientName && (
                <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>Client Name</span>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>{uccStatus.clientName}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <span className="text-xs" style={{ color: colors.textTertiary }}>Status</span>
                <FAChip color={colors.success} size="xs">Approved</FAChip>
              </div>
              {uccStatus.registeredAt && (
                <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>Registered On</span>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                    {new Date(uccStatus.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <FAButton
                variant="secondary"
                onClick={() => router.push('/advisor/nmf/clients')}
              >
                Back to NMF Clients
              </FAButton>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // Render: Step Indicator
  // ============================================================

  const renderStepIndicator = () => (
    <div
      className="p-4 rounded-xl mb-6"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`,
      }}
    >
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
          Step {currentStep} of {STEPS.length}
        </span>
        <span className="text-xs" style={{ color: colors.textTertiary }}>
          {STEPS[currentStep - 1].label}
        </span>
      </div>
      <div className="w-full h-2 rounded-full mb-4" style={{ background: isDark ? 'rgba(147,197,253,0.08)' : 'rgba(59,130,246,0.08)' }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${(currentStep / STEPS.length) * 100}%`,
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          }}
        />
      </div>

      {/* Step circles connected by lines */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isActive = step.number === currentStep
          const isCompleted = step.number < currentStep
          const isClickable = step.number <= currentStep

          return (
            <div key={step.number} className="flex items-center" style={{ flex: idx < STEPS.length - 1 ? 1 : 'none' }}>
              <button
                onClick={() => handleGoToStep(step.number)}
                disabled={!isClickable}
                className="flex flex-col items-center gap-1.5 transition-all flex-shrink-0"
                style={{ opacity: isClickable ? 1 : 0.4, cursor: isClickable ? 'pointer' : 'default' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                  style={{
                    background: isCompleted
                      ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`
                      : isActive
                        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                        : isDark ? 'rgba(147,197,253,0.08)' : 'rgba(59,130,246,0.06)',
                    color: isCompleted || isActive ? 'white' : colors.textTertiary,
                    border: !isCompleted && !isActive ? `1px solid ${colors.cardBorder}` : 'none',
                  }}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: isActive ? colors.primary : isCompleted ? colors.success : colors.textTertiary }}
                >
                  {step.shortLabel}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 rounded-full hidden sm:block"
                  style={{
                    background: step.number < currentStep
                      ? `linear-gradient(90deg, ${colors.success}, ${colors.success})`
                      : isDark ? 'rgba(147,197,253,0.08)' : 'rgba(59,130,246,0.08)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // ============================================================
  // Render: Step 1 - Personal Details
  // ============================================================

  const renderPersonalDetails = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FAInput
          label="First Name"
          required
          value={personal.firstName}
          onChange={e => updatePersonal('firstName', e.target.value)}
          error={errors.firstName}
          placeholder="First name"
        />
        <FAInput
          label="Middle Name"
          value={personal.middleName}
          onChange={e => updatePersonal('middleName', e.target.value)}
          placeholder="Middle name (optional)"
        />
        <FAInput
          label="Last Name"
          required
          value={personal.lastName}
          onChange={e => updatePersonal('lastName', e.target.value)}
          error={errors.lastName}
          placeholder="Last name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput
          label="PAN"
          required
          value={personal.pan}
          onChange={e => updatePersonal('pan', e.target.value.toUpperCase())}
          error={errors.pan}
          placeholder="ABCDE1234F"
          maxLength={10}
        />
        <FAInput
          label="Date of Birth"
          required
          type="date"
          value={personal.dateOfBirth}
          onChange={e => updatePersonal('dateOfBirth', e.target.value)}
          error={errors.dateOfBirth}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FASelect
          label="Gender"
          required
          options={GENDER_OPTIONS}
          value={personal.gender}
          onChange={e => updatePersonal('gender', e.target.value)}
          error={errors.gender}
        />
        <FASelect
          label="Occupation"
          options={OCCUPATION_OPTIONS}
          value={personal.occupationCode}
          onChange={e => updatePersonal('occupationCode', e.target.value)}
        />
        <FASelect
          label="Tax Status"
          required
          options={TAX_STATUS_OPTIONS}
          value={personal.taxStatus}
          onChange={e => updatePersonal('taxStatus', e.target.value)}
          error={errors.taxStatus}
        />
      </div>
    </div>
  )

  // ============================================================
  // Render: Step 2 - Contact Details
  // ============================================================

  const renderContactDetails = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput
          label="Email"
          required
          type="email"
          value={contact.email}
          onChange={e => updateContact('email', e.target.value)}
          error={errors.email}
          placeholder="email@example.com"
        />
        <FAInput
          label="Mobile Number"
          required
          value={contact.mobile}
          onChange={e => updateContact('mobile', e.target.value)}
          error={errors.mobile}
          placeholder="10-digit mobile number"
        />
      </div>

      <FAInput
        label="Address Line 1"
        required
        value={contact.addressLine1}
        onChange={e => updateContact('addressLine1', e.target.value)}
        error={errors.addressLine1}
        placeholder="Street address, area"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput
          label="Address Line 2"
          value={contact.addressLine2}
          onChange={e => updateContact('addressLine2', e.target.value)}
          placeholder="Locality, landmark (optional)"
        />
        <FAInput
          label="Address Line 3"
          value={contact.addressLine3}
          onChange={e => updateContact('addressLine3', e.target.value)}
          placeholder="Additional info (optional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FAInput
          label="City"
          required
          value={contact.city}
          onChange={e => updateContact('city', e.target.value)}
          error={errors.city}
          placeholder="City"
        />
        <FASelect
          label="State"
          required
          options={INDIAN_STATES}
          value={contact.state}
          onChange={e => updateContact('state', e.target.value)}
          error={errors.state}
          placeholder="Select state"
        />
        <FAInput
          label="Pincode"
          required
          value={contact.pincode}
          onChange={e => updateContact('pincode', e.target.value.replace(/\D/g, ''))}
          error={errors.pincode}
          placeholder="6-digit pincode"
          maxLength={6}
        />
      </div>

      <FAInput
        label="Country"
        value={contact.country}
        onChange={e => updateContact('country', e.target.value.toUpperCase())}
        placeholder="IN"
        maxLength={2}
        helperText="ISO country code (default: IN for India)"
      />
    </div>
  )

  // ============================================================
  // Render: Step 3 - Bank Details
  // ============================================================

  const renderBankDetails = () => (
    <div className="space-y-5">
      <FAInput
        label="Bank Name"
        required
        value={bank.bankName}
        onChange={e => updateBank('bankName', e.target.value)}
        error={errors.bankName}
        placeholder="e.g. State Bank of India"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput
          label="Account Number"
          required
          value={bank.accountNumber}
          onChange={e => updateBank('accountNumber', e.target.value.replace(/\D/g, ''))}
          error={errors.accountNumber}
          placeholder="Account number"
        />
        <FASelect
          label="Account Type"
          required
          options={ACCOUNT_TYPE_OPTIONS}
          value={bank.accountType}
          onChange={e => updateBank('accountType', e.target.value)}
          error={errors.accountType}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput
          label="IFSC Code"
          required
          value={bank.ifscCode}
          onChange={e => updateBank('ifscCode', e.target.value.toUpperCase())}
          error={errors.ifscCode}
          placeholder="e.g. SBIN0001234"
          maxLength={11}
        />
        <FAInput
          label="MICR Code"
          value={bank.micrCode}
          onChange={e => updateBank('micrCode', e.target.value.replace(/\D/g, ''))}
          helperText="9-digit MICR (optional)"
          placeholder="e.g. 400002001"
          maxLength={9}
        />
      </div>
    </div>
  )

  // ============================================================
  // Render: Step 4 - Nominee Details
  // ============================================================

  const renderNomineeDetails = () => (
    <div className="space-y-5">
      <div
        className="p-3 rounded-xl text-xs"
        style={{
          background: isDark ? 'rgba(147,197,253,0.06)' : 'rgba(59,130,246,0.04)',
          border: `1px solid ${isDark ? 'rgba(147,197,253,0.12)' : 'rgba(59,130,246,0.08)'}`,
          color: colors.textSecondary,
        }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span>Nominee details are optional. If a nominee name is provided, relationship and percentage are required.</span>
        </div>
      </div>

      <FAInput
        label="Nominee Name"
        value={nominee.nomineeName}
        onChange={e => updateNominee('nomineeName', e.target.value)}
        error={errors.nomineeName}
        placeholder="Full name of nominee (optional)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FASelect
          label="Nominee Relation"
          options={RELATIONSHIP_OPTIONS}
          value={nominee.nomineeRelation}
          onChange={e => updateNominee('nomineeRelation', e.target.value)}
          error={errors.nomineeRelation}
        />
        <FAInput
          label="Nominee Percentage"
          type="number"
          value={nominee.nomineePercentage}
          onChange={e => updateNominee('nomineePercentage', e.target.value)}
          error={errors.nomineePercentage}
          min={1}
          max={100}
          helperText="Percentage of holdings (default: 100)"
        />
      </div>
    </div>
  )

  // ============================================================
  // Render: Step 5 - Review & Submit
  // ============================================================

  const renderReviewSection = (
    title: string,
    icon: React.ReactNode,
    items: { label: string; value: string }[],
    stepNumber: number,
  ) => (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.03)',
          borderBottom: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${colors.primary}12` }}
          >
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
            {title}
          </span>
        </div>
        <button
          onClick={() => handleGoToStep(stepNumber)}
          className="text-xs font-medium px-2.5 py-1 rounded-full transition-all"
          style={{
            color: colors.primary,
            background: `${colors.primary}08`,
            border: `1px solid ${colors.primary}20`,
          }}
        >
          Edit
        </button>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {items.map(item => (
            <div key={item.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
              <span className="text-xs" style={{ color: colors.textTertiary }}>{item.label}</span>
              <span className="text-xs font-medium text-right" style={{ color: colors.textPrimary }}>{item.value || '\u2014'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderReviewSubmit = () => {
    // If already submitted, show result
    if (submitResult) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: submitResult.success
                ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`
                : `linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%)`,
            }}
          >
            {submitResult.success ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: submitResult.success ? colors.success : colors.error }}
          >
            {submitResult.success ? 'Registration Successful' : 'Registration Failed'}
          </h3>
          <p className="text-sm text-center max-w-md mb-6" style={{ color: colors.textSecondary }}>
            {submitResult.message}
          </p>
          <div className="flex items-center gap-3">
            <FAButton
              variant="secondary"
              onClick={() => router.push('/advisor/nmf/clients')}
            >
              Back to NMF Clients
            </FAButton>
            {!submitResult.success && (
              <FAButton
                variant="primary"
                onClick={() => {
                  setSubmitResult(null)
                  setCurrentStep(1)
                }}
              >
                Try Again
              </FAButton>
            )}
          </div>
        </div>
      )
    }

    const personIcon = (
      <svg className="w-3.5 h-3.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )

    const contactIcon = (
      <svg className="w-3.5 h-3.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    )

    const bankIcon = (
      <svg className="w-3.5 h-3.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    )

    const nomineeIcon = (
      <svg className="w-3.5 h-3.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    )

    const fullAddress = [contact.addressLine1, contact.addressLine2, contact.addressLine3]
      .filter(Boolean)
      .join(', ')

    return (
      <div>
        {renderReviewSection('Personal Details', personIcon, [
          { label: 'First Name', value: personal.firstName },
          { label: 'Middle Name', value: personal.middleName },
          { label: 'Last Name', value: personal.lastName },
          { label: 'PAN', value: personal.pan },
          { label: 'Date of Birth', value: personal.dateOfBirth },
          { label: 'Gender', value: getLabelFromOptions(GENDER_OPTIONS, personal.gender) },
          { label: 'Occupation', value: getLabelFromOptions(OCCUPATION_OPTIONS, personal.occupationCode) },
          { label: 'Tax Status', value: getLabelFromOptions(TAX_STATUS_OPTIONS, personal.taxStatus) },
        ], 1)}

        {renderReviewSection('Contact Details', contactIcon, [
          { label: 'Email', value: contact.email },
          { label: 'Mobile', value: contact.mobile },
          { label: 'Address', value: fullAddress },
          { label: 'City', value: contact.city },
          { label: 'State', value: getLabelFromOptions(INDIAN_STATES, contact.state) },
          { label: 'Pincode', value: contact.pincode },
          { label: 'Country', value: contact.country },
        ], 2)}

        {renderReviewSection('Bank Details', bankIcon, [
          { label: 'Bank Name', value: bank.bankName },
          { label: 'Account Number', value: bank.accountNumber },
          { label: 'Account Type', value: getLabelFromOptions(ACCOUNT_TYPE_OPTIONS, bank.accountType) },
          { label: 'IFSC Code', value: bank.ifscCode },
          { label: 'MICR Code', value: bank.micrCode },
        ], 3)}

        {renderReviewSection('Nominee Details', nomineeIcon, [
          { label: 'Nominee Name', value: nominee.nomineeName },
          { label: 'Relation', value: nominee.nomineeName ? getLabelFromOptions(RELATIONSHIP_OPTIONS, nominee.nomineeRelation) : '' },
          { label: 'Percentage', value: nominee.nomineeName ? `${nominee.nomineePercentage}%` : '' },
        ], 4)}
      </div>
    )
  }

  // ============================================================
  // Render: Step Content
  // ============================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderPersonalDetails()
      case 2: return renderContactDetails()
      case 3: return renderBankDetails()
      case 4: return renderNomineeDetails()
      case 5: return renderReviewSubmit()
      default: return null
    }
  }

  // ============================================================
  // Render: Navigation Buttons
  // ============================================================

  const renderNavButtons = () => {
    if (submitResult) return null

    return (
      <div
        className="flex items-center justify-between mt-6 pt-4"
        style={{ borderTop: `1px solid ${colors.cardBorder}` }}
      >
        <div>
          {currentStep > 1 && (
            <FAButton
              variant="secondary"
              onClick={handleBack}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Previous
            </FAButton>
          )}
        </div>

        <div>
          {currentStep < 5 ? (
            <FAButton
              variant="primary"
              onClick={handleNext}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              }
            >
              Next
            </FAButton>
          ) : (
            <FAButton
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              icon={
                !submitting ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : undefined
              }
            >
              Register with NMF
            </FAButton>
          )}
        </div>
      </div>
    )
  }

  // ============================================================
  // Main Render
  // ============================================================

  return (
    <AdvisorLayout title="NMF Client Registration">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/advisor/nmf/clients')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              NMF UCC Registration
            </h1>
            {client && (
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {client.name} {client.pan ? `| ${client.pan}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <FASpinner />
          </div>
        )}

        {/* Error */}
        {!loading && loadError && (
          <div className="py-12">
            <FAEmptyState
              icon={
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              }
              title="Could not load client"
              description={loadError}
              action={<FAButton onClick={fetchData}>Retry</FAButton>}
            />
          </div>
        )}

        {/* Already Registered */}
        {!loading && !loadError && client && uccStatus?.status === 'Approved' && (
          renderAlreadyRegistered()
        )}

        {/* Wizard */}
        {!loading && !loadError && client && uccStatus?.status !== 'Approved' && (
          <div className="max-w-3xl mx-auto">
            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Step Content Card */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              {/* Step Header */}
              <div
                className="px-5 py-3"
                style={{
                  background: isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.03)',
                  borderBottom: `1px solid ${colors.cardBorder}`,
                }}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                  {STEPS[currentStep - 1].label}
                </h2>
              </div>

              {/* Step Body */}
              <div className="p-5">
                {renderStepContent()}
                {renderNavButtons()}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvisorLayout>
  )
}

export default NmfRegisterClientPage
