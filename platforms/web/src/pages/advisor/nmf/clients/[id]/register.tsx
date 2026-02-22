/**
 * NMF UCC Registration Wizard — 5-step form for registering an FA client with NSE NMF (183-field UCC).
 * Steps: Personal Details -> Bank Account -> Nominee -> FATCA -> Review & Submit
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme } from '@/utils/fa'
import { Client } from '@/utils/faTypes'
import { clientsApi, nmfApi } from '@/services/api'
import { FAButton, FAInput, FASelect, FALabel, FASpinner, FAEmptyState, FARadioGroup } from '@/components/advisor/shared'

interface PersonalDetails {
  firstName: string; middleName: string; lastName: string; pan: string; dateOfBirth: string
  gender: string; occupationCode: string; taxStatus: string; holdingNature: string
  address1: string; city: string; state: string; pincode: string; country: string
  email: string; mobile: string
}
interface BankDetails { bankName: string; accountNumber: string; accountType: string; ifsc: string }
interface NomineeDetails { name: string; relation: string }
interface FatcaDetails {
  birthCountry: string; citizenshipCountry: string; nationalityCountry: string; taxCountry: string
  sourceOfWealth: string; annualIncome: string; netWorth: string; netWorthDate: string
  pep: string; occupationCode: string; occupationType: string
}
type StepErrors = Record<string, string>

const STEPS = [
  { number: 1, label: 'Personal Details', shortLabel: 'Personal' },
  { number: 2, label: 'Bank Account', shortLabel: 'Bank' },
  { number: 3, label: 'Nominee Details', shortLabel: 'Nominee' },
  { number: 4, label: 'FATCA Declaration', shortLabel: 'FATCA' },
  { number: 5, label: 'Review & Submit', shortLabel: 'Review' },
]
const TAX_STATUS_OPTIONS = [
  { value: '01', label: 'Individual' }, { value: '02', label: 'On behalf of Minor' },
  { value: '03', label: 'HUF' }, { value: '04', label: 'Company' },
  { value: '06', label: 'Partnership Firm' }, { value: '07', label: 'Body Corporate' },
  { value: '08', label: 'Trust' }, { value: '11', label: 'NRI - NRE' },
  { value: '12', label: 'NRI - NRO' }, { value: '21', label: 'Sole Proprietorship' },
]
const GENDER_OPTIONS = [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }]
const OCCUPATION_OPTIONS = [
  { value: '01', label: 'Private Sector Service' }, { value: '02', label: 'Public Sector / Government Service' },
  { value: '03', label: 'Business' }, { value: '04', label: 'Professional' },
  { value: '06', label: 'Retired' }, { value: '07', label: 'Housewife' },
  { value: '08', label: 'Student' }, { value: '41', label: 'Agriculture' },
  { value: '42', label: 'Self Employed' }, { value: '99', label: 'Others' },
]
const ACCOUNT_TYPE_OPTIONS = [
  { value: 'SB', label: 'Savings' }, { value: 'CB', label: 'Current' },
  { value: 'NE', label: 'NRE' }, { value: 'NO', label: 'NRO' },
]
const RELATIONSHIP_OPTIONS = [
  { value: 'SPOUSE', label: 'Spouse' }, { value: 'SON', label: 'Son' },
  { value: 'DAUGHTER', label: 'Daughter' }, { value: 'FATHER', label: 'Father' },
  { value: 'MOTHER', label: 'Mother' }, { value: 'BROTHER', label: 'Brother' },
  { value: 'SISTER', label: 'Sister' }, { value: 'OTHER', label: 'Other' },
]
const HOLDING_NATURE_OPTIONS = [
  { value: 'SI', label: 'Single' }, { value: 'JO', label: 'Joint' }, { value: 'AS', label: 'Anyone or Survivor' },
]
const SOURCE_OF_WEALTH_OPTIONS = [
  { value: '01', label: 'Salary' }, { value: '02', label: 'Business Income' },
  { value: '03', label: 'Gift' }, { value: '04', label: 'Ancestral Property' },
  { value: '05', label: 'Rental Income' }, { value: '06', label: 'Prize Money' },
  { value: '07', label: 'Royalty' }, { value: '08', label: 'Others' },
]
const ANNUAL_INCOME_OPTIONS = [
  { value: '31', label: 'Below 1 Lakh' }, { value: '32', label: '1-5 Lakh' },
  { value: '33', label: '5-10 Lakh' }, { value: '34', label: '10-25 Lakh' },
  { value: '35', label: '25 Lakh - 1 Crore' }, { value: '36', label: 'Above 1 Crore' },
]
const OCCUPATION_TYPE_OPTIONS = [
  { value: 'B', label: 'Business' }, { value: 'S', label: 'Service' },
  { value: 'P', label: 'Professional' }, { value: 'R', label: 'Retired' },
  { value: 'H', label: 'Housewife' }, { value: 'T', label: 'Student' }, { value: 'O', label: 'Others' },
]
const INDIAN_STATES = [
  { value: 'AN', label: 'Andaman & Nicobar' }, { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' }, { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' }, { value: 'CH', label: 'Chandigarh' },
  { value: 'CT', label: 'Chhattisgarh' }, { value: 'DD', label: 'Daman & Diu' },
  { value: 'DL', label: 'Delhi' }, { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' }, { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' }, { value: 'JK', label: 'Jammu & Kashmir' },
  { value: 'JH', label: 'Jharkhand' }, { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' }, { value: 'LA', label: 'Ladakh' },
  { value: 'MP', label: 'Madhya Pradesh' }, { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' }, { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' }, { value: 'NL', label: 'Nagaland' },
  { value: 'OR', label: 'Odisha' }, { value: 'PY', label: 'Puducherry' },
  { value: 'PB', label: 'Punjab' }, { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' }, { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TG', label: 'Telangana' }, { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' }, { value: 'UT', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' },
]

const NmfRegisterClientPage = () => {
  const router = useRouter()
  const { id: clientId } = router.query
  const { colors, isDark } = useFATheme()

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)
  const [ekycLoading, setEkycLoading] = useState(false)
  const [ekycResult, setEkycResult] = useState<{ success: boolean; message: string } | null>(null)
  const [errors, setErrors] = useState<StepErrors>({})

  const [personal, setPersonal] = useState<PersonalDetails>({
    firstName: '', middleName: '', lastName: '', pan: '', dateOfBirth: '',
    gender: 'M', occupationCode: '01', taxStatus: '01', holdingNature: 'SI',
    address1: '', city: '', state: '', pincode: '', country: 'IN', email: '', mobile: '',
  })
  const [bank, setBank] = useState<BankDetails>({ bankName: '', accountNumber: '', accountType: 'SB', ifsc: '' })
  const [nominee, setNominee] = useState<NomineeDetails>({ name: '', relation: 'SPOUSE' })
  const [fatca, setFatca] = useState<FatcaDetails>({
    birthCountry: 'IN', citizenshipCountry: 'IN', nationalityCountry: 'IN', taxCountry: 'IN',
    sourceOfWealth: '01', annualIncome: '32', netWorth: '', netWorthDate: '',
    pep: 'N', occupationCode: '01', occupationType: 'S',
  })

  const fetchClient = useCallback(async () => {
    if (!clientId || typeof clientId !== 'string') return
    try {
      setLoading(true); setLoadError(null)
      const data = await clientsApi.getById<Client>(clientId)
      setClient(data)
      const nameParts = (data.name || '').split(' ')
      setPersonal(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
        email: data.email || '', mobile: data.phone || '', pan: data.pan || '',
        dateOfBirth: data.dateOfBirth || '', address1: data.address || '',
        city: data.city || '', state: data.state || '', pincode: data.pincode || '',
      }))
      if (data.nominee) {
        setNominee(prev => ({ ...prev, name: data.nominee?.name || '', relation: data.nominee?.relationship || 'SPOUSE' }))
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load client details')
    } finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetchClient() }, [fetchClient])

  const validateStep = (step: number): boolean => {
    const errs: StepErrors = {}
    if (step === 1) {
      if (!personal.firstName.trim()) errs.firstName = 'First name is required'
      if (!personal.lastName.trim()) errs.lastName = 'Last name is required'
      if (!personal.email.trim()) errs.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) errs.email = 'Invalid email format'
      if (!personal.mobile.trim()) errs.mobile = 'Mobile number is required'
      else if (!/^[6-9]\d{9}$/.test(personal.mobile.replace(/\D/g, ''))) errs.mobile = 'Invalid Indian mobile number'
      if (!personal.pan.trim()) errs.pan = 'PAN is required'
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(personal.pan.toUpperCase())) errs.pan = 'Invalid PAN format'
      if (!personal.dateOfBirth) errs.dateOfBirth = 'Date of birth is required'
      if (!personal.address1.trim()) errs.address1 = 'Address is required'
      if (!personal.city.trim()) errs.city = 'City is required'
      if (!personal.state) errs.state = 'State is required'
      if (!personal.pincode.trim()) errs.pincode = 'Pincode is required'
      else if (!/^\d{6}$/.test(personal.pincode)) errs.pincode = 'Invalid pincode'
    }
    if (step === 2) {
      if (!bank.bankName.trim()) errs.bankName = 'Bank name is required'
      if (!bank.accountNumber.trim()) errs.accountNumber = 'Account number is required'
      else if (!/^\d{9,18}$/.test(bank.accountNumber)) errs.accountNumber = 'Invalid account number (9-18 digits)'
      if (!bank.ifsc.trim()) errs.ifsc = 'IFSC is required'
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc.toUpperCase())) errs.ifsc = 'Invalid IFSC format'
    }
    if (step === 3) {
      if (!nominee.name.trim()) errs.nomineeName = 'Nominee name is required'
      if (!nominee.relation) errs.relation = 'Relationship is required'
    }
    if (step === 4) {
      if (!fatca.annualIncome) errs.annualIncome = 'Annual income is required'
      if (!fatca.sourceOfWealth) errs.sourceOfWealth = 'Source of wealth is required'
      if (!fatca.pep) errs.pep = 'PEP status is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => { if (validateStep(currentStep)) { setCurrentStep(prev => Math.min(prev + 1, 5)); setErrors({}) } }
  const handleBack = () => { setCurrentStep(prev => Math.max(prev - 1, 1)); setErrors({}) }
  const handleGoToStep = (step: number) => { if (step <= currentStep) { setCurrentStep(step); setErrors({}) } }

  const handleSubmit = async () => {
    if (!clientId || typeof clientId !== 'string') return
    try {
      setSubmitting(true); setSubmitResult(null)
      await nmfApi.ucc.register(clientId, {
        client_code: personal.pan.toUpperCase(), first_name: personal.firstName.trim(),
        last_name: personal.lastName.trim(), dob: personal.dateOfBirth,
        pan: personal.pan.toUpperCase(), email: personal.email.trim(),
        mobile: personal.mobile.replace(/\D/g, ''), address1: personal.address1.trim(),
        city: personal.city.trim(), state: personal.state, pincode: personal.pincode.trim(),
        bank_account_no: bank.accountNumber, bank_ifsc: bank.ifsc.toUpperCase(),
        bank_name: bank.bankName.trim(), account_type: bank.accountType,
        nominee_name: nominee.name.trim(), nominee_relation: nominee.relation,
        tax_status: personal.taxStatus, holding_nature: personal.holdingNature,
        occupation_code: personal.occupationCode, gender: personal.gender, country: personal.country,
      })
      await nmfApi.ucc.uploadFatca(clientId, {
        birth_country: fatca.birthCountry, citizenship_country: fatca.citizenshipCountry,
        nationality_country: fatca.nationalityCountry, tax_country: fatca.taxCountry,
        source_of_wealth: fatca.sourceOfWealth, annual_income: fatca.annualIncome,
        net_worth: fatca.netWorth, net_worth_date: fatca.netWorthDate,
        pep: fatca.pep, occupation_code: fatca.occupationCode, occupation_type: fatca.occupationType,
      })
      setSubmitResult({ success: true, message: 'Client registered successfully with NSE NMF. UCC creation and FATCA submission completed.' })
    } catch (err: any) {
      setSubmitResult({ success: false, message: err.message || 'Registration failed. Please try again.' })
    } finally { setSubmitting(false) }
  }

  const handleInitiateEkyc = async () => {
    if (!clientId || typeof clientId !== 'string') return
    try {
      setEkycLoading(true); setEkycResult(null)
      await nmfApi.ucc.initiateEkyc(clientId)
      setEkycResult({ success: true, message: 'eKYC initiated successfully. The client will receive a verification link.' })
    } catch (err: any) {
      setEkycResult({ success: false, message: err.message || 'Failed to initiate eKYC.' })
    } finally { setEkycLoading(false) }
  }

  const updatePersonal = (field: keyof PersonalDetails, value: string) => {
    setPersonal(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }
  const updateBank = (field: keyof BankDetails, value: string) => {
    setBank(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }
  const updateNominee = (field: keyof NomineeDetails, value: string) => {
    setNominee(prev => ({ ...prev, [field]: value }))
    const ek = field === 'name' ? 'nomineeName' : field
    if (errors[ek]) setErrors(prev => { const n = { ...prev }; delete n[ek]; return n })
  }
  const updateFatca = (field: keyof FatcaDetails, value: string) => {
    setFatca(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const getLabel = (opts: { value: string; label: string }[], v: string) => opts.find(o => o.value === v)?.label || v

  // -- Render helpers --

  const renderStepIndicator = () => (
    <div className="p-4 rounded-xl mb-6" style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Step {currentStep} of {STEPS.length}</span>
        <span className="text-xs" style={{ color: colors.textTertiary }}>{STEPS[currentStep - 1].label}</span>
      </div>
      <div className="w-full h-2 rounded-full mb-4" style={{ background: isDark ? 'rgba(147,197,253,0.08)' : 'rgba(59,130,246,0.08)' }}>
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(currentStep / STEPS.length) * 100}%`, background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }} />
      </div>
      <div className="flex items-center justify-between">
        {STEPS.map((step) => {
          const active = step.number === currentStep, done = step.number < currentStep, clickable = step.number <= currentStep
          return (
            <button key={step.number} onClick={() => handleGoToStep(step.number)} disabled={!clickable}
              className="flex flex-col items-center gap-1.5 transition-all" style={{ opacity: clickable ? 1 : 0.4, cursor: clickable ? 'pointer' : 'default' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all" style={{
                background: done ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)` : active ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` : isDark ? 'rgba(147,197,253,0.08)' : 'rgba(59,130,246,0.06)',
                color: done || active ? 'white' : colors.textTertiary, border: !done && !active ? `1px solid ${colors.cardBorder}` : 'none',
              }}>
                {done ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : step.number}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: active ? colors.primary : done ? colors.success : colors.textTertiary }}>{step.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderPersonalDetails = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FAInput label="First Name" required value={personal.firstName} onChange={e => updatePersonal('firstName', e.target.value)} error={errors.firstName} placeholder="First name as per PAN" />
        <FAInput label="Middle Name" value={personal.middleName} onChange={e => updatePersonal('middleName', e.target.value)} placeholder="Middle name (optional)" />
        <FAInput label="Last Name" required value={personal.lastName} onChange={e => updatePersonal('lastName', e.target.value)} error={errors.lastName} placeholder="Last name" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput label="Email" required type="email" value={personal.email} onChange={e => updatePersonal('email', e.target.value)} error={errors.email} placeholder="email@example.com" />
        <FAInput label="Mobile Number" required value={personal.mobile} onChange={e => updatePersonal('mobile', e.target.value)} error={errors.mobile} placeholder="10-digit mobile number" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput label="PAN" required value={personal.pan} onChange={e => updatePersonal('pan', e.target.value.toUpperCase())} error={errors.pan} placeholder="ABCDE1234F" maxLength={10} />
        <FAInput label="Date of Birth" required type="date" value={personal.dateOfBirth} onChange={e => updatePersonal('dateOfBirth', e.target.value)} error={errors.dateOfBirth} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FASelect label="Gender" required options={GENDER_OPTIONS} value={personal.gender} onChange={e => updatePersonal('gender', e.target.value)} error={errors.gender} />
        <FASelect label="Tax Status" required options={TAX_STATUS_OPTIONS} value={personal.taxStatus} onChange={e => updatePersonal('taxStatus', e.target.value)} />
        <FASelect label="Holding Nature" options={HOLDING_NATURE_OPTIONS} value={personal.holdingNature} onChange={e => updatePersonal('holdingNature', e.target.value)} />
      </div>
      <FASelect label="Occupation" options={OCCUPATION_OPTIONS} value={personal.occupationCode} onChange={e => updatePersonal('occupationCode', e.target.value)} />
      <FAInput label="Address" required value={personal.address1} onChange={e => updatePersonal('address1', e.target.value)} error={errors.address1} placeholder="Street address, area, landmark" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FAInput label="City" required value={personal.city} onChange={e => updatePersonal('city', e.target.value)} error={errors.city} placeholder="City" />
        <FASelect label="State" required options={INDIAN_STATES} value={personal.state} onChange={e => updatePersonal('state', e.target.value)} error={errors.state} placeholder="Select state" />
        <FAInput label="Pincode" required value={personal.pincode} onChange={e => updatePersonal('pincode', e.target.value.replace(/\D/g, ''))} error={errors.pincode} placeholder="6-digit pincode" maxLength={6} />
      </div>
      <FAInput label="Country" value={personal.country} onChange={e => updatePersonal('country', e.target.value.toUpperCase())} placeholder="IN" maxLength={2} helperText="ISO country code (default: IN)" />
    </div>
  )

  const renderBankAccount = () => (
    <div className="space-y-5">
      <FAInput label="Bank Name" required value={bank.bankName} onChange={e => updateBank('bankName', e.target.value)} error={errors.bankName} placeholder="e.g. State Bank of India" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput label="Account Number" required value={bank.accountNumber} onChange={e => updateBank('accountNumber', e.target.value.replace(/\D/g, ''))} error={errors.accountNumber} placeholder="Account number" />
        <FASelect label="Account Type" required options={ACCOUNT_TYPE_OPTIONS} value={bank.accountType} onChange={e => updateBank('accountType', e.target.value)} error={errors.accountType} />
      </div>
      <FAInput label="IFSC Code" required value={bank.ifsc} onChange={e => updateBank('ifsc', e.target.value.toUpperCase())} error={errors.ifsc} placeholder="e.g. SBIN0001234" maxLength={11} />
    </div>
  )

  const renderNomineeDetails = () => (
    <div className="space-y-5">
      <div className="p-3 rounded-xl text-xs" style={{ background: isDark ? 'rgba(147,197,253,0.06)' : 'rgba(59,130,246,0.04)', border: `1px solid ${isDark ? 'rgba(147,197,253,0.12)' : 'rgba(59,130,246,0.08)'}`, color: colors.textSecondary }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          <span>Nominee details are mandatory for NMF registration.</span>
        </div>
      </div>
      <FAInput label="Nominee Name" required value={nominee.name} onChange={e => updateNominee('name', e.target.value)} error={errors.nomineeName} placeholder="Full name of nominee" />
      <FASelect label="Relationship" required options={RELATIONSHIP_OPTIONS} value={nominee.relation} onChange={e => updateNominee('relation', e.target.value)} error={errors.relation} />
    </div>
  )

  const renderFatcaDeclaration = () => (
    <div className="space-y-5">
      <div className="p-3 rounded-xl text-xs" style={{ background: isDark ? 'rgba(251,191,36,0.06)' : 'rgba(245,158,11,0.04)', border: `1px solid ${isDark ? 'rgba(251,191,36,0.15)' : 'rgba(245,158,11,0.12)'}`, color: colors.textSecondary }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <span>FATCA/CRS declaration is required by law. Ensure details are accurate.</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FASelect label="Occupation" required options={OCCUPATION_OPTIONS} value={fatca.occupationCode} onChange={e => updateFatca('occupationCode', e.target.value)} error={errors.occupationCode} />
        <FASelect label="Occupation Type" options={OCCUPATION_TYPE_OPTIONS} value={fatca.occupationType} onChange={e => updateFatca('occupationType', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FASelect label="Annual Income" required options={ANNUAL_INCOME_OPTIONS} value={fatca.annualIncome} onChange={e => updateFatca('annualIncome', e.target.value)} error={errors.annualIncome} />
        <FASelect label="Source of Wealth" required options={SOURCE_OF_WEALTH_OPTIONS} value={fatca.sourceOfWealth} onChange={e => updateFatca('sourceOfWealth', e.target.value)} error={errors.sourceOfWealth} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput label="Net Worth (INR)" value={fatca.netWorth} onChange={e => updateFatca('netWorth', e.target.value.replace(/\D/g, ''))} placeholder="Optional" />
        <FAInput label="Net Worth As On Date" type="date" value={fatca.netWorthDate} onChange={e => updateFatca('netWorthDate', e.target.value)} />
      </div>
      <div>
        <FALabel required>Politically Exposed Person (PEP)</FALabel>
        <FARadioGroup options={[{ value: 'N', label: 'Not Applicable' }, { value: 'Y', label: 'PEP' }, { value: 'R', label: 'Related to PEP' }]} value={fatca.pep} onChange={v => updateFatca('pep', v)} />
        {errors.pep && <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.pep}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput label="Country of Birth" value={fatca.birthCountry} onChange={e => updateFatca('birthCountry', e.target.value.toUpperCase())} placeholder="IN" maxLength={2} helperText="ISO country code" />
        <FAInput label="Country of Citizenship" value={fatca.citizenshipCountry} onChange={e => updateFatca('citizenshipCountry', e.target.value.toUpperCase())} placeholder="IN" maxLength={2} helperText="ISO country code" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FAInput label="Country of Nationality" value={fatca.nationalityCountry} onChange={e => updateFatca('nationalityCountry', e.target.value.toUpperCase())} placeholder="IN" maxLength={2} helperText="ISO country code" />
        <FAInput label="Tax Residence Country" value={fatca.taxCountry} onChange={e => updateFatca('taxCountry', e.target.value.toUpperCase())} placeholder="IN" maxLength={2} helperText="ISO country code" />
      </div>
    </div>
  )

  const renderReviewSection = (title: string, icon: React.ReactNode, items: { label: string; value: string }[], stepNumber: number) => (
    <div className="rounded-xl overflow-hidden mb-4" style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.03)', borderBottom: `1px solid ${colors.cardBorder}` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}12` }}>{icon}</div>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>{title}</span>
        </div>
        <button onClick={() => handleGoToStep(stepNumber)} className="text-xs font-medium px-2.5 py-1 rounded-full transition-all" style={{ color: colors.primary, background: `${colors.primary}08`, border: `1px solid ${colors.primary}20` }}>Edit</button>
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

  const svgIcon = (d: string) => <svg className="w-3.5 h-3.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>

  const renderReviewSubmit = () => {
    if (submitResult) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: submitResult.success ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)` : `linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%)` }}>
            {submitResult.success
              ? <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: submitResult.success ? colors.success : colors.error }}>
            {submitResult.success ? 'Registration Successful' : 'Registration Failed'}
          </h3>
          <p className="text-sm text-center max-w-md mb-6" style={{ color: colors.textSecondary }}>{submitResult.message}</p>
          {submitResult.success && (
            <div className="w-full max-w-md rounded-xl p-4 mb-6" style={{ background: isDark ? 'rgba(147,197,253,0.06)' : 'rgba(59,130,246,0.04)', border: `1px solid ${isDark ? 'rgba(147,197,253,0.12)' : 'rgba(59,130,246,0.08)'}` }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                <span className="text-sm font-semibold" style={{ color: colors.primary }}>eKYC Verification</span>
              </div>
              <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>Initiate eKYC to verify the client's identity electronically. The client will receive a verification link via email/SMS.</p>
              {ekycResult && (
                <div className="p-2 rounded-lg text-xs mb-3" style={{ background: ekycResult.success ? (isDark ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)') : (isDark ? 'rgba(248,113,113,0.08)' : 'rgba(239,68,68,0.06)'), color: ekycResult.success ? colors.success : colors.error }}>{ekycResult.message}</div>
              )}
              <FAButton variant="primary" onClick={handleInitiateEkyc} loading={ekycLoading}
                icon={!ekycLoading ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> : undefined}>
                Initiate eKYC
              </FAButton>
            </div>
          )}
          <div className="flex items-center gap-3">
            <FAButton variant="secondary" onClick={() => router.push('/advisor/nmf/clients')}>Back to NMF Clients</FAButton>
            {!submitResult.success && <FAButton variant="primary" onClick={() => { setSubmitResult(null); setCurrentStep(1) }}>Try Again</FAButton>}
          </div>
        </div>
      )
    }

    const fullName = [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(' ')
    return (
      <div>
        {renderReviewSection('Personal Details', svgIcon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'), [
          { label: 'Name', value: fullName }, { label: 'Email', value: personal.email },
          { label: 'Mobile', value: personal.mobile }, { label: 'PAN', value: personal.pan },
          { label: 'Date of Birth', value: personal.dateOfBirth },
          { label: 'Gender', value: getLabel(GENDER_OPTIONS, personal.gender) },
          { label: 'Tax Status', value: getLabel(TAX_STATUS_OPTIONS, personal.taxStatus) },
          { label: 'Holding Nature', value: getLabel(HOLDING_NATURE_OPTIONS, personal.holdingNature) },
          { label: 'Occupation', value: getLabel(OCCUPATION_OPTIONS, personal.occupationCode) },
          { label: 'Address', value: personal.address1 },
          { label: 'City', value: personal.city },
          { label: 'State', value: getLabel(INDIAN_STATES, personal.state) },
          { label: 'Pincode', value: personal.pincode }, { label: 'Country', value: personal.country },
        ], 1)}
        {renderReviewSection('Bank Account', svgIcon('M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z'), [
          { label: 'Bank Name', value: bank.bankName }, { label: 'Account Number', value: bank.accountNumber },
          { label: 'Account Type', value: getLabel(ACCOUNT_TYPE_OPTIONS, bank.accountType) },
          { label: 'IFSC', value: bank.ifsc },
        ], 2)}
        {renderReviewSection('Nominee Details', svgIcon('M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z'), [
          { label: 'Nominee Name', value: nominee.name },
          { label: 'Relationship', value: getLabel(RELATIONSHIP_OPTIONS, nominee.relation) },
        ], 3)}
        {renderReviewSection('FATCA Declaration', svgIcon('M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'), [
          { label: 'Occupation', value: getLabel(OCCUPATION_OPTIONS, fatca.occupationCode) },
          { label: 'Occupation Type', value: getLabel(OCCUPATION_TYPE_OPTIONS, fatca.occupationType) },
          { label: 'Annual Income', value: getLabel(ANNUAL_INCOME_OPTIONS, fatca.annualIncome) },
          { label: 'Source of Wealth', value: getLabel(SOURCE_OF_WEALTH_OPTIONS, fatca.sourceOfWealth) },
          { label: 'PEP Status', value: fatca.pep === 'N' ? 'Not Applicable' : fatca.pep === 'Y' ? 'PEP' : 'Related to PEP' },
          { label: 'Net Worth', value: fatca.netWorth ? `INR ${Number(fatca.netWorth).toLocaleString('en-IN')}` : '' },
          { label: 'Country of Birth', value: fatca.birthCountry },
          { label: 'Country of Citizenship', value: fatca.citizenshipCountry },
          { label: 'Country of Nationality', value: fatca.nationalityCountry },
          { label: 'Tax Residence', value: fatca.taxCountry },
        ], 4)}
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderPersonalDetails()
      case 2: return renderBankAccount()
      case 3: return renderNomineeDetails()
      case 4: return renderFatcaDeclaration()
      case 5: return renderReviewSubmit()
      default: return null
    }
  }

  const renderNavButtons = () => {
    if (submitResult) return null
    return (
      <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
        <div>
          {currentStep > 1 && (
            <FAButton variant="secondary" onClick={handleBack}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>}>
              Back
            </FAButton>
          )}
        </div>
        <div>
          {currentStep < 5 ? (
            <FAButton variant="primary" onClick={handleNext}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}>
              Next
            </FAButton>
          ) : (
            <FAButton variant="primary" onClick={handleSubmit} loading={submitting}
              icon={!submitting ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : undefined}>
              Register with NMF
            </FAButton>
          )}
        </div>
      </div>
    )
  }

  return (
    <AdvisorLayout title="NMF Client Registration">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/advisor/nmf/clients')} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
            <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>NMF Client Registration</h1>
            {client && <p className="text-xs" style={{ color: colors.textSecondary }}>{client.name} {client.pan ? `| ${client.pan}` : ''}</p>}
          </div>
        </div>
        {loading && <div className="flex items-center justify-center py-24"><FASpinner /></div>}
        {!loading && loadError && (
          <div className="py-12">
            <FAEmptyState
              icon={<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
              title="Could not load client" description={loadError}
              action={<FAButton onClick={fetchClient}>Retry</FAButton>}
            />
          </div>
        )}
        {!loading && !loadError && client && (
          <div className="max-w-3xl mx-auto">
            {renderStepIndicator()}
            <div className="rounded-xl overflow-hidden" style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}>
              <div className="px-5 py-3" style={{ background: isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.03)', borderBottom: `1px solid ${colors.cardBorder}` }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>{STEPS[currentStep - 1].label}</h2>
              </div>
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
