import { useState } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FAInput, FAButton, FAFormSection } from '@/components/advisor/shared/FAForm'

interface Props {
  onComplete: (data?: any) => Promise<void>
  loading: boolean
}

export default function ArnStep({ onComplete, loading }: Props) {
  const { colors } = useFATheme()
  const [form, setForm] = useState({
    arnNumber: '',
    euin: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.arnNumber.trim()) {
      errs.arnNumber = 'ARN number is required'
    } else if (!/^ARN-?\d{5,6}$/i.test(form.arnNumber.trim())) {
      errs.arnNumber = 'Enter a valid ARN (e.g. ARN-12345)'
    }
    if (form.euin && !/^E\d{6}$/i.test(form.euin.trim())) {
      errs.euin = 'Enter a valid EUIN (e.g. E123456)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
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
          ARN & EUIN Details
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Your AMFI Registration Number is required for all mutual fund transactions.
        </p>
      </div>

      <FAFormSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FAInput
            label="ARN Number"
            required
            placeholder="ARN-12345"
            value={form.arnNumber}
            onChange={e => updateField('arnNumber', e.target.value.toUpperCase())}
            error={errors.arnNumber}
            helperText="Your AMFI Registration Number"
          />
          <FAInput
            label="EUIN"
            placeholder="E123456"
            value={form.euin}
            onChange={e => updateField('euin', e.target.value.toUpperCase())}
            error={errors.euin}
            helperText="Employee Unique Identification Number (optional)"
          />
        </div>
      </FAFormSection>

      {/* Info card */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: `${colors.primary}08`,
          border: `1px solid ${colors.primary}15`,
        }}
      >
        <div className="flex gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              Where to find your ARN?
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              Your ARN is printed on your AMFI certificate. You can also look it up at{' '}
              <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>
                amfiindia.com
              </a>
            </p>
          </div>
        </div>
      </div>

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
