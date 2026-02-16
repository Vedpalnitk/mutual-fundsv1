import { useState } from 'react'
import { useFATheme } from '@/utils/fa'

interface CoverageGap {
  recommended: number
  current: number
  gap: number
  adequate: boolean
}

interface CoveragePolicy {
  id: string
  provider: string
  type: string
  sumAssured: number
  policyNumber: string
  status: string
}

interface GapAnalysisData {
  life: CoverageGap
  health: CoverageGap
  policies?: CoveragePolicy[]
}

interface GapAnalysisParams {
  annualIncome?: number
  age?: number
  familySize?: number
}

const LIFE_TYPES = ['TERM_LIFE', 'WHOLE_LIFE', 'ENDOWMENT', 'ULIP']
const HEALTH_TYPES = ['HEALTH', 'CRITICAL_ILLNESS']

const TYPE_LABELS: Record<string, string> = {
  TERM_LIFE: 'Term Life',
  WHOLE_LIFE: 'Whole Life',
  ENDOWMENT: 'Endowment',
  ULIP: 'ULIP',
  HEALTH: 'Health',
  CRITICAL_ILLNESS: 'Critical Illness',
  PERSONAL_ACCIDENT: 'Personal Accident',
  OTHER: 'Other',
}

export default function GapAnalysisCard({
  data,
  onRecalculate,
}: {
  data: GapAnalysisData | null
  onRecalculate?: (params: GapAnalysisParams) => void
}) {
  const { colors, isDark } = useFATheme()
  const [expanded, setExpanded] = useState(false)
  const [annualIncome, setAnnualIncome] = useState('')
  const [age, setAge] = useState('')
  const [familySize, setFamilySize] = useState('')

  const isEmpty = data && data.life.recommended === 0 && data.health.recommended === 500000 && data.life.current === 0 && data.health.current === 0

  const handleRecalculate = () => {
    if (!onRecalculate) return
    onRecalculate({
      annualIncome: annualIncome ? Number(annualIncome) : undefined,
      age: age ? Number(age) : undefined,
      familySize: familySize ? Number(familySize) : undefined,
    })
  }

  const lifePolicies = (data?.policies || []).filter((p) => LIFE_TYPES.includes(p.type) && p.status === 'ACTIVE')
  const healthPolicies = (data?.policies || []).filter((p) => HEALTH_TYPES.includes(p.type) && p.status === 'ACTIVE')

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${colors.primary}15` }}
          >
            <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Coverage Gap Analysis
          </span>
        </div>
        {onRecalculate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
            style={{ color: colors.primary, background: `${colors.primary}10` }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Configure
          </button>
        )}
      </div>

      {/* Config inputs */}
      {expanded && onRecalculate && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: colors.primary }}>
                Annual Income
              </label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                placeholder="e.g. 1200000"
                className="w-full h-9 px-3 rounded-lg text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: colors.primary }}>
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 35"
                className="w-full h-9 px-3 rounded-lg text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: colors.primary }}>
                Family Size
              </label>
              <input
                type="number"
                value={familySize}
                onChange={(e) => setFamilySize(e.target.value)}
                placeholder="e.g. 4"
                className="w-full h-9 px-3 rounded-lg text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
            </div>
          </div>
          <button
            onClick={handleRecalculate}
            className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:shadow-md"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
          >
            Recalculate
          </button>
        </div>
      )}

      {/* Prompt to configure if no meaningful data */}
      {isEmpty && !expanded && onRecalculate && (
        <div
          className="mb-4 p-3 rounded-lg text-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
        >
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            Enter client income, age, and family size to get personalised coverage recommendations
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <CoverageBar label="Life Insurance" icon={<ShieldIcon />} gap={data.life} policies={lifePolicies} colors={colors} isDark={isDark} />
          <CoverageBar label="Health Insurance" icon={<HeartIcon />} gap={data.health} policies={healthPolicies} colors={colors} isDark={isDark} />
        </div>
      )}
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function CoverageBar({
  label,
  icon,
  gap,
  policies,
  colors,
  isDark,
}: {
  label: string
  icon: React.ReactNode
  gap: CoverageGap
  policies: CoveragePolicy[]
  colors: any
  isDark: boolean
}) {
  const progress = gap.recommended > 0 ? Math.min(gap.current / gap.recommended, 1) : 0
  const barColor = gap.adequate ? colors.success : colors.error

  return (
    <div
      className="p-3 rounded-lg"
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span style={{ color: barColor }}>{icon}</span>
          <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
            {label}
          </span>
        </div>
        {gap.adequate ? (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" style={{ color: colors.success }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium" style={{ color: colors.success }}>Adequate</span>
          </div>
        ) : (
          <span className="text-xs font-medium" style={{ color: colors.error }}>
            Gap: {formatAmount(gap.gap)}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}99)`,
          }}
        />
      </div>

      <div className="flex justify-between mt-1 gap-2 flex-wrap">
        <span className="text-xs" style={{ color: colors.textTertiary }}>
          Current: {formatAmount(gap.current)}
        </span>
        <span className="text-xs" style={{ color: colors.textTertiary }}>
          Recommended: {formatAmount(gap.recommended)}
        </span>
      </div>

      {/* Contributing policies */}
      {policies.length > 0 && (
        <div className="mt-2 space-y-1">
          {policies.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-1 px-2 rounded"
              style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <svg className="w-3 h-3 flex-shrink-0" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
                  {p.provider}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: colors.textTertiary }}>
                  {TYPE_LABELS[p.type] || p.type}
                </span>
              </div>
              <span className="text-xs font-medium flex-shrink-0 ml-2" style={{ color: colors.textPrimary }}>
                {formatAmount(p.sumAssured)}
              </span>
            </div>
          ))}
        </div>
      )}
      {policies.length === 0 && gap.current === 0 && (
        <p className="mt-2 text-xs" style={{ color: colors.textTertiary }}>
          No active policies
        </p>
      )}
    </div>
  )
}

function formatAmount(amount: number): string {
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)} L`
  return `\u20B9${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
