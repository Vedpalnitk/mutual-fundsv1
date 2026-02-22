import { useState } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FAButton, FACheckbox } from '@/components/advisor/shared/FAForm'

interface Props {
  onComplete: (data?: any) => Promise<void>
  loading: boolean
}

const EXCHANGES = [
  {
    id: 'bse',
    name: 'BSE StAR MF',
    description: 'Bombay Stock Exchange mutual fund platform',
    setupUrl: '/advisor/bse/setup',
  },
  {
    id: 'nse',
    name: 'NSE NMF (MFSS)',
    description: 'National Stock Exchange mutual fund platform',
    setupUrl: '/advisor/nmf/setup',
  },
]

export default function ExchangeSetupStep({ onComplete, loading }: Props) {
  const { isDark, colors } = useFATheme()
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onComplete({ exchanges: selected })
    } catch {
      // error handled by hook
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          Exchange Platform Setup
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Select the exchange platforms you use for mutual fund transactions. You can configure credentials later.
        </p>
      </div>

      <div className="space-y-3">
        {EXCHANGES.map(ex => (
          <div
            key={ex.id}
            className="p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{
              background: selected.includes(ex.id)
                ? `${colors.primary}08`
                : colors.cardBackground,
              border: `1px solid ${selected.includes(ex.id) ? colors.primary + '30' : colors.cardBorder}`,
              boxShadow: selected.includes(ex.id)
                ? `0 4px 14px ${colors.glassShadow}`
                : 'none',
            }}
            onClick={() => toggle(ex.id)}
          >
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <FACheckbox
                  label=""
                  checked={selected.includes(ex.id)}
                  onChange={() => toggle(ex.id)}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {ex.name}
                  </h3>
                  {selected.includes(ex.id) && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${colors.success}15`, color: colors.success }}
                    >
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  {ex.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: `${colors.warning}08`,
          border: `1px solid ${colors.warning}15`,
        }}
      >
        <div className="flex gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              You can set this up later
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              Exchange credentials can be configured from the BSE/NMF Setup pages anytime. Select at least your preferred platform to proceed.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <FAButton
          onClick={handleSubmit}
          loading={saving || loading}
          disabled={selected.length === 0}
        >
          Continue
        </FAButton>
      </div>
    </div>
  )
}
