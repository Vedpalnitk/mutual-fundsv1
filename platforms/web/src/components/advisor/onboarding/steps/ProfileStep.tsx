import { useState } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FAInput, FASelect, FAButton, FAFormSection } from '@/components/advisor/shared/FAForm'
import { authProfileApi } from '@/services/api'

interface Props {
  onComplete: (data?: any) => Promise<void>
  loading: boolean
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh',
].map(s => ({ value: s, label: s }))

export default function ProfileStep({ onComplete, loading }: Props) {
  const { colors } = useFATheme()
  const [form, setForm] = useState({
    displayName: '',
    companyName: '',
    phone: '',
    city: '',
    state: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.displayName.trim()) errs.displayName = 'Display name is required'
    if (!form.companyName.trim()) errs.companyName = 'Company name is required'
    if (form.phone && !/^\d{10}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await authProfileApi.update({
        displayName: form.displayName,
        companyName: form.companyName,
        phone: form.phone || undefined,
      })
      await onComplete(form)
    } catch (err) {
      setErrors({ _form: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          Set Up Your Profile
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          This information will be visible to your clients and on reports.
        </p>
      </div>

      <FAFormSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FAInput
            label="Display Name"
            required
            placeholder="e.g. Priya Sharma"
            value={form.displayName}
            onChange={e => updateField('displayName', e.target.value)}
            error={errors.displayName}
          />
          <FAInput
            label="Company / Firm Name"
            required
            placeholder="e.g. Sharma Financial Services"
            value={form.companyName}
            onChange={e => updateField('companyName', e.target.value)}
            error={errors.companyName}
          />
          <FAInput
            label="Phone Number"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={e => updateField('phone', e.target.value)}
            error={errors.phone}
          />
          <FAInput
            label="City"
            placeholder="e.g. Mumbai"
            value={form.city}
            onChange={e => updateField('city', e.target.value)}
          />
          <FASelect
            label="State"
            options={INDIAN_STATES}
            value={form.state}
            onChange={e => updateField('state', e.target.value)}
            placeholder="Select state"
          />
        </div>
      </FAFormSection>

      {errors._form && (
        <p className="text-sm" style={{ color: colors.error }}>{errors._form}</p>
      )}

      <div className="flex justify-end">
        <FAButton onClick={handleSubmit} loading={saving || loading}>
          Save & Continue
        </FAButton>
      </div>
    </div>
  )
}
