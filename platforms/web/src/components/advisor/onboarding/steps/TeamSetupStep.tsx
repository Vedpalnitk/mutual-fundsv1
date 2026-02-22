import { useState } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FAInput, FAButton, FAFormSection } from '@/components/advisor/shared/FAForm'
import { staffApi } from '@/services/api'

interface Props {
  onComplete: (data?: any) => Promise<void>
  onSkip: () => Promise<void>
  loading: boolean
}

interface StaffEntry {
  displayName: string
  email: string
  password: string
}

export default function TeamSetupStep({ onComplete, onSkip, loading }: Props) {
  const { isDark, colors } = useFATheme()
  const [members, setMembers] = useState<StaffEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<StaffEntry>({ displayName: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const validateMember = () => {
    const errs: Record<string, string> = {}
    if (!form.displayName.trim()) errs.displayName = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.password.trim()) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Min 8 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const addMember = () => {
    if (!validateMember()) return
    setMembers(prev => [...prev, { ...form }])
    setForm({ displayName: '', email: '', password: '' })
    setShowForm(false)
    setErrors({})
  }

  const removeMember = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Create staff members via API
      for (const m of members) {
        await staffApi.create({
          displayName: m.displayName,
          email: m.email,
          password: m.password,
          allowedPages: ['/advisor/dashboard', '/advisor/clients'],
        })
      }
      await onComplete({ teamSize: members.length })
    } catch (err) {
      setErrors({ _form: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSkipping(true)
    try {
      await onSkip()
    } finally {
      setSkipping(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            Add Team Members
          </h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: colors.chipBg, color: colors.textTertiary, border: `1px solid ${colors.chipBorder}` }}
          >
            Optional
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Invite staff members who will help manage clients and transactions.
        </p>
      </div>

      {/* Added members list */}
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{m.displayName}</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{m.email}</p>
              </div>
              <button
                onClick={() => removeMember(i)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: colors.error }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add member form */}
      {showForm ? (
        <FAFormSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FAInput
              label="Name"
              required
              placeholder="Staff member name"
              value={form.displayName}
              onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
              error={errors.displayName}
            />
            <FAInput
              label="Email"
              required
              type="email"
              placeholder="staff@example.com"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              error={errors.email}
            />
            <FAInput
              label="Password"
              required
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              error={errors.password}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <FAButton size="sm" onClick={addMember}>Add</FAButton>
            <FAButton size="sm" variant="ghost" onClick={() => { setShowForm(false); setErrors({}) }}>Cancel</FAButton>
          </div>
        </FAFormSection>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:opacity-80"
          style={{ borderColor: colors.cardBorder, color: colors.primary }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm font-medium">Add Team Member</span>
        </button>
      )}

      {errors._form && (
        <p className="text-sm" style={{ color: colors.error }}>{errors._form}</p>
      )}

      <div className="flex justify-between">
        <FAButton variant="ghost" onClick={handleSkip} loading={skipping}>
          Skip for Now
        </FAButton>
        <FAButton
          onClick={handleSubmit}
          loading={saving || loading}
          disabled={members.length === 0}
        >
          {members.length > 0 ? `Add ${members.length} Member${members.length > 1 ? 's' : ''} & Continue` : 'Continue'}
        </FAButton>
      </div>
    </div>
  )
}
