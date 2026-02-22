import { useState, useEffect } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FAButton, FACheckbox } from '@/components/advisor/shared/FAForm'
import { commissionDefaultsApi, DefaultCommissionRate } from '@/services/api'

interface Props {
  onComplete: (data?: any) => Promise<void>
  onSkip: () => Promise<void>
  loading: boolean
}

export default function CommissionRatesStep({ onComplete, onSkip, loading }: Props) {
  const { isDark, colors } = useFATheme()
  const [defaults, setDefaults] = useState<DefaultCommissionRate[]>([])
  const [loadingDefaults, setLoadingDefaults] = useState(true)
  const [selectedAmcs, setSelectedAmcs] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    commissionDefaultsApi.getDefaults()
      .then(data => {
        setDefaults(data)
        // Select all AMCs by default
        const amcs = new Set(data.map(d => d.amcName))
        setSelectedAmcs(amcs)
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoadingDefaults(false))
  }, [])

  // Group defaults by AMC
  const amcGroups = defaults.reduce<Record<string, DefaultCommissionRate[]>>((acc, rate) => {
    if (!acc[rate.amcName]) acc[rate.amcName] = []
    acc[rate.amcName].push(rate)
    return acc
  }, {})

  const toggleAmc = (amc: string) => {
    setSelectedAmcs(prev => {
      const next = new Set(prev)
      if (next.has(amc)) next.delete(amc)
      else next.add(amc)
      return next
    })
  }

  const toggleAll = () => {
    const allAmcs = Object.keys(amcGroups)
    if (selectedAmcs.size === allAmcs.length) {
      setSelectedAmcs(new Set())
    } else {
      setSelectedAmcs(new Set(allAmcs))
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const ratesToCreate = defaults
        .filter(d => selectedAmcs.has(d.amcName) && d.providerId)
        .map(d => ({
          providerId: d.providerId!,
          category: d.category,
          schemeType: d.schemeType,
          trailRate: d.trailRate,
          upfrontRate: d.upfrontRate,
        }))

      if (ratesToCreate.length > 0) {
        await commissionDefaultsApi.bulkCreate(ratesToCreate)
      }
      await onComplete({ ratesCreated: ratesToCreate.length })
    } catch (err) {
      setError((err as Error).message)
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

  const allAmcs = Object.keys(amcGroups)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            Set Up Commission Rates
          </h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: colors.chipBg, color: colors.textTertiary, border: `1px solid ${colors.chipBorder}` }}
          >
            Optional
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Load industry-standard commission rates for major AMCs. You can customize these later.
        </p>
      </div>

      {loadingDefaults ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: colors.cardBorder, borderTopColor: colors.primary }}
          />
        </div>
      ) : (
        <>
          {/* Select all toggle */}
          <div className="flex items-center justify-between">
            <FACheckbox
              label={`Select All (${allAmcs.length} AMCs)`}
              checked={selectedAmcs.size === allAmcs.length}
              onChange={toggleAll}
            />
            <span className="text-xs" style={{ color: colors.textTertiary }}>
              {selectedAmcs.size} of {allAmcs.length} selected
            </span>
          </div>

          {/* AMC list */}
          <div className="max-h-64 overflow-y-auto space-y-2 rounded-xl p-3" style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}>
            {allAmcs.map(amc => {
              const rates = amcGroups[amc]
              const avgTrail = rates.reduce((s, r) => s + r.trailRate, 0) / rates.length
              return (
                <div
                  key={amc}
                  className="flex items-center justify-between p-2.5 rounded-lg transition-colors"
                  style={{
                    background: selectedAmcs.has(amc) ? `${colors.primary}06` : 'transparent',
                  }}
                >
                  <FACheckbox
                    label={amc}
                    checked={selectedAmcs.has(amc)}
                    onChange={() => toggleAmc(amc)}
                  />
                  <span className="text-xs" style={{ color: colors.textTertiary }}>
                    {rates.length} rates, avg {avgTrail.toFixed(2)}% trail
                  </span>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div
            className="p-3 rounded-xl flex items-center gap-3"
            style={{ background: `${colors.primary}06`, border: `1px solid ${colors.primary}12` }}
          >
            <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <span className="text-sm" style={{ color: colors.textPrimary }}>
              {defaults.filter(d => selectedAmcs.has(d.amcName) && d.providerId).length} commission rates will be created
            </span>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm" style={{ color: colors.error }}>{error}</p>
      )}

      <div className="flex justify-between">
        <FAButton variant="ghost" onClick={handleSkip} loading={skipping}>
          Skip for Now
        </FAButton>
        <FAButton
          onClick={handleSubmit}
          loading={saving || loading}
          disabled={selectedAmcs.size === 0}
        >
          Load Commission Rates
        </FAButton>
      </div>
    </div>
  )
}
