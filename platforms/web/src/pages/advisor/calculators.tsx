/**
 * Financial Calculators Page
 *
 * Interactive calculators for mutual fund planning.
 * Features: SIP, Lumpsum, Goal, SWP, and Retirement calculators
 * with range sliders and real-time results.
 */

import { useState, useMemo } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import {
  FACard,
  FASectionHeader,
} from '@/components/advisor/shared'

type CalculatorType = 'sip' | 'lumpsum' | 'goal' | 'swp' | 'retirement'

interface CalculatorConfig {
  id: CalculatorType
  name: string
  description: string
  icon: string
}

const CALCULATORS: CalculatorConfig[] = [
  {
    id: 'sip',
    name: 'SIP Calculator',
    description: 'Future value of systematic investments',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  {
    id: 'lumpsum',
    name: 'Lumpsum',
    description: 'Returns on one-time investment',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'goal',
    name: 'Goal Planner',
    description: 'Required SIP to reach your target',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
  {
    id: 'swp',
    name: 'SWP Planner',
    description: 'Plan systematic withdrawals',
    icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  },
  {
    id: 'retirement',
    name: 'Retirement',
    description: 'Corpus needed for retirement',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
]

/** Format number with Indian locale (commas) */
const formatNum = (n: number): string => {
  return n.toLocaleString('en-IN')
}

/** Compact currency for large numbers */
const compactCurrency = (n: number): string => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)} K`
  return n.toFixed(0)
}

// ── Slider Input Component ──────────────────────────────────────────────

interface SliderInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
  colors: any
  isDark: boolean
}

const SliderInput = ({ label, value, onChange, min, max, step, prefix, suffix, colors, isDark }: SliderInputProps) => {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
          {label}
        </label>
        <div
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{
            background: colors.chipBg,
            border: `1px solid ${colors.chipBorder}`,
            color: colors.textPrimary,
          }}
        >
          {prefix && <span style={{ color: colors.textTertiary }}>{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
            }}
            className="w-20 bg-transparent text-right font-semibold text-sm focus:outline-none"
            style={{ color: colors.textPrimary }}
            min={min}
            max={max}
            step={step}
          />
          {suffix && <span style={{ color: colors.textTertiary }}>{suffix}</span>}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${percentage}%, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} ${percentage}%, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 100%)`,
            // Custom thumb via CSS-in-JS workaround
            WebkitAppearance: 'none' as any,
          }}
        />
        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${colors.primary};
            box-shadow: 0 2px 8px ${colors.glassShadow}, 0 0 0 3px ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'};
            cursor: pointer;
            transition: transform 0.15s ease;
          }
          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
          input[type='range']::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${colors.primary};
            box-shadow: 0 2px 8px ${colors.glassShadow};
            cursor: pointer;
            border: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'};
          }
        `}</style>
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: colors.textTertiary }}>
        <span>{prefix}{formatNum(min)}{suffix}</span>
        <span>{prefix}{formatNum(max)}{suffix}</span>
      </div>
    </div>
  )
}

// ── Result Card Components ──────────────────────────────────────────────

const ResultRow = ({ label, value, color, large, colors }: {
  label: string
  value: string
  color?: string
  large?: boolean
  colors: any
}) => (
  <div className="flex justify-between items-center">
    <span className={large ? 'font-medium' : ''} style={{ color: large ? colors.textPrimary : colors.textSecondary }}>
      {label}
    </span>
    <span
      className={`${large ? 'text-xl' : 'text-lg'} font-bold`}
      style={{ color: color || colors.textPrimary }}
    >
      {value}
    </span>
  </div>
)

const Divider = ({ colors }: { colors: any }) => (
  <div className="h-px" style={{ background: colors.cardBorder }} />
)

const ProgressBar = ({ invested, total, colors }: { invested: number; total: number; colors: any }) => {
  const percentage = Math.min(100, Math.max(0, (invested / total) * 100))
  return (
    <div className="mt-5">
      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: `${colors.primary}10` }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        />
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${100 - percentage}%`, background: `linear-gradient(90deg, ${colors.success}90 0%, ${colors.success} 100%)` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.primary }} />
          <span style={{ color: colors.textSecondary }}>Invested {percentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.success }} />
          <span style={{ color: colors.textSecondary }}>Returns {(100 - percentage).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

const InfoBox = ({ children, colors, isDark }: { children: React.ReactNode; colors: any; isDark: boolean }) => (
  <div
    className="mt-5 p-4 rounded-xl"
    style={{
      background: isDark ? `${colors.primary}08` : `${colors.primary}06`,
      border: `1px solid ${colors.cardBorder}`,
    }}
  >
    {children}
  </div>
)

// ── Page Component ──────────────────────────────────────────────────────

const CalculatorsPage = () => {
  const { colors, isDark } = useFATheme()
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('sip')

  // SIP Calculator State
  const [sipAmount, setSipAmount] = useState(25000)
  const [sipYears, setSipYears] = useState(10)
  const [sipReturn, setSipReturn] = useState(12)
  const [sipStepUp, setSipStepUp] = useState(0)

  // Lumpsum Calculator State
  const [lumpsumAmount, setLumpsumAmount] = useState(500000)
  const [lumpsumYears, setLumpsumYears] = useState(10)
  const [lumpsumReturn, setLumpsumReturn] = useState(12)

  // Goal Calculator State
  const [goalTarget, setGoalTarget] = useState(5000000)
  const [goalYears, setGoalYears] = useState(10)
  const [goalReturn, setGoalReturn] = useState(12)

  // SWP Calculator State
  const [swpCorpus, setSwpCorpus] = useState(5000000)
  const [swpWithdrawal, setSwpWithdrawal] = useState(50000)
  const [swpReturn, setSwpReturn] = useState(8)

  // Retirement Calculator State
  const [retCurrentAge, setRetCurrentAge] = useState(35)
  const [retRetireAge, setRetRetireAge] = useState(60)
  const [retLifeExpectancy, setRetLifeExpectancy] = useState(85)
  const [retMonthlyExpense, setRetMonthlyExpense] = useState(50000)
  const [retInflation, setRetInflation] = useState(6)
  const [retPreReturn, setRetPreReturn] = useState(12)
  const [retPostReturn, setRetPostReturn] = useState(8)

  // ── Calculation Functions ──────────────────────────────────────

  const sipResult = useMemo(() => {
    if (sipStepUp > 0) {
      // Step-up SIP: increase amount by stepUp% each year
      let totalInvested = 0
      let futureValue = 0
      const monthlyRate = sipReturn / 100 / 12
      let currentSip = sipAmount
      for (let year = 0; year < sipYears; year++) {
        for (let month = 0; month < 12; month++) {
          totalInvested += currentSip
          futureValue = (futureValue + currentSip) * (1 + monthlyRate)
        }
        currentSip = Math.round(currentSip * (1 + sipStepUp / 100))
      }
      return { futureValue, invested: totalInvested, returns: futureValue - totalInvested }
    }
    const monthlyRate = sipReturn / 100 / 12
    const months = sipYears * 12
    const futureValue = sipAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
    const invested = sipAmount * months
    return { futureValue, invested, returns: futureValue - invested }
  }, [sipAmount, sipYears, sipReturn, sipStepUp])

  const lumpsumResult = useMemo(() => {
    const rate = lumpsumReturn / 100
    const futureValue = lumpsumAmount * Math.pow(1 + rate, lumpsumYears)
    const returns = futureValue - lumpsumAmount
    const cagr = lumpsumReturn
    return { futureValue, invested: lumpsumAmount, returns, cagr }
  }, [lumpsumAmount, lumpsumYears, lumpsumReturn])

  const goalResult = useMemo(() => {
    const monthlyRate = goalReturn / 100 / 12
    const months = goalYears * 12
    const sipRequired = goalTarget / ((((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)))
    const totalInvestment = sipRequired * months
    return { sipRequired, totalInvestment, target: goalTarget }
  }, [goalTarget, goalYears, goalReturn])

  const swpResult = useMemo(() => {
    const monthlyRate = swpReturn / 100 / 12
    let balance = swpCorpus
    let months = 0
    const maxMonths = 1200

    while (balance > swpWithdrawal && months < maxMonths) {
      balance = balance * (1 + monthlyRate) - swpWithdrawal
      months++
    }

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    const totalWithdrawn = swpWithdrawal * months
    return {
      years,
      months: remainingMonths,
      totalWithdrawn,
      exhausted: balance <= swpWithdrawal,
      withdrawalRate: ((swpWithdrawal * 12) / swpCorpus) * 100,
    }
  }, [swpCorpus, swpWithdrawal, swpReturn])

  const retirementResult = useMemo(() => {
    const yearsToRetire = Math.max(1, retRetireAge - retCurrentAge)
    const yearsInRetirement = Math.max(1, retLifeExpectancy - retRetireAge)

    const inflatedExpense = retMonthlyExpense * Math.pow(1 + retInflation / 100, yearsToRetire)

    const monthlyPostRate = retPostReturn / 100 / 12
    const retirementMonths = yearsInRetirement * 12
    const corpusNeeded = inflatedExpense * ((1 - Math.pow(1 + monthlyPostRate, -retirementMonths)) / monthlyPostRate)

    const monthlyPreRate = retPreReturn / 100 / 12
    const savingMonths = yearsToRetire * 12
    const sipNeeded = corpusNeeded / ((((Math.pow(1 + monthlyPreRate, savingMonths) - 1) / monthlyPreRate) * (1 + monthlyPreRate)))

    return { corpusNeeded, sipNeeded, inflatedExpense, yearsToRetire, yearsInRetirement }
  }, [retCurrentAge, retRetireAge, retLifeExpectancy, retMonthlyExpense, retInflation, retPreReturn, retPostReturn])

  // ── Renderers ─────────────────────────────────────────────────

  const renderSIP = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <SliderInput
          label="Monthly SIP Amount"
          value={sipAmount}
          onChange={setSipAmount}
          min={500}
          max={500000}
          step={500}
          prefix="₹"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Investment Period"
          value={sipYears}
          onChange={setSipYears}
          min={1}
          max={40}
          step={1}
          suffix=" yrs"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Expected Return (p.a.)"
          value={sipReturn}
          onChange={setSipReturn}
          min={1}
          max={30}
          step={0.5}
          suffix="%"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Annual Step-Up"
          value={sipStepUp}
          onChange={setSipStepUp}
          min={0}
          max={25}
          step={1}
          suffix="%"
          colors={colors}
          isDark={isDark}
        />
      </div>
      <div
        className="p-6 rounded-2xl"
        style={{
          background: isDark ? `${colors.primary}08` : `${colors.primary}04`,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: colors.primary }}>
          Results
        </h3>
        <div className="space-y-4">
          <ResultRow label="Total Investment" value={formatCurrency(sipResult.invested)} colors={colors} />
          <ResultRow label="Expected Returns" value={formatCurrency(sipResult.returns)} color={colors.success} colors={colors} />
          <Divider colors={colors} />
          <ResultRow label="Future Value" value={formatCurrency(sipResult.futureValue)} color={colors.primary} large colors={colors} />
        </div>
        <ProgressBar invested={sipResult.invested} total={sipResult.futureValue} colors={colors} />
        {sipStepUp > 0 && (
          <InfoBox colors={colors} isDark={isDark}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              With <span className="font-bold" style={{ color: colors.primary }}>{sipStepUp}% annual step-up</span>,
              your SIP grows from {formatCurrency(sipAmount)} to{' '}
              {formatCurrency(Math.round(sipAmount * Math.pow(1 + sipStepUp / 100, sipYears - 1)))}/mo
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
              Wealth multiplier: {(sipResult.futureValue / sipResult.invested).toFixed(1)}x
            </p>
          </InfoBox>
        )}
        {sipStepUp === 0 && (
          <InfoBox colors={colors} isDark={isDark}>
            <p className="text-xs" style={{ color: colors.textTertiary }}>
              Wealth multiplier: <span className="font-bold" style={{ color: colors.primary }}>{(sipResult.futureValue / sipResult.invested).toFixed(1)}x</span>
              {' '}in {sipYears} years. Try adding a step-up to boost returns.
            </p>
          </InfoBox>
        )}
      </div>
    </div>
  )

  const renderLumpsum = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <SliderInput
          label="Investment Amount"
          value={lumpsumAmount}
          onChange={setLumpsumAmount}
          min={10000}
          max={10000000}
          step={10000}
          prefix="₹"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Investment Period"
          value={lumpsumYears}
          onChange={setLumpsumYears}
          min={1}
          max={40}
          step={1}
          suffix=" yrs"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Expected Return (p.a.)"
          value={lumpsumReturn}
          onChange={setLumpsumReturn}
          min={1}
          max={30}
          step={0.5}
          suffix="%"
          colors={colors}
          isDark={isDark}
        />
      </div>
      <div
        className="p-6 rounded-2xl"
        style={{
          background: isDark ? `${colors.primary}08` : `${colors.primary}04`,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: colors.primary }}>
          Results
        </h3>
        <div className="space-y-4">
          <ResultRow label="Total Investment" value={formatCurrency(lumpsumResult.invested)} colors={colors} />
          <ResultRow label="Expected Returns" value={formatCurrency(lumpsumResult.returns)} color={colors.success} colors={colors} />
          <Divider colors={colors} />
          <ResultRow label="Future Value" value={formatCurrency(lumpsumResult.futureValue)} color={colors.primary} large colors={colors} />
        </div>
        <ProgressBar invested={lumpsumResult.invested} total={lumpsumResult.futureValue} colors={colors} />
        <InfoBox colors={colors} isDark={isDark}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            CAGR: <span className="font-bold" style={{ color: colors.primary }}>{lumpsumResult.cagr}%</span>
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Your money will grow {(lumpsumResult.futureValue / lumpsumResult.invested).toFixed(1)}x in {lumpsumYears} years
          </p>
        </InfoBox>
      </div>
    </div>
  )

  const renderGoal = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <SliderInput
          label="Target Amount"
          value={goalTarget}
          onChange={setGoalTarget}
          min={100000}
          max={100000000}
          step={100000}
          prefix="₹"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Time Period"
          value={goalYears}
          onChange={setGoalYears}
          min={1}
          max={40}
          step={1}
          suffix=" yrs"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Expected Return (p.a.)"
          value={goalReturn}
          onChange={setGoalReturn}
          min={1}
          max={30}
          step={0.5}
          suffix="%"
          colors={colors}
          isDark={isDark}
        />
      </div>
      <div
        className="p-6 rounded-2xl"
        style={{
          background: isDark ? `${colors.primary}08` : `${colors.primary}04`,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: colors.primary }}>
          Results
        </h3>
        <div className="space-y-4">
          <ResultRow label="Required Monthly SIP" value={formatCurrency(goalResult.sipRequired)} color={colors.primary} large colors={colors} />
          <ResultRow label="Total Investment" value={formatCurrency(goalResult.totalInvestment)} colors={colors} />
          <ResultRow label="Wealth Gain" value={formatCurrency(goalResult.target - goalResult.totalInvestment)} color={colors.success} colors={colors} />
          <Divider colors={colors} />
          <ResultRow label="Target Amount" value={formatCurrency(goalResult.target)} color={colors.success} large colors={colors} />
        </div>
        <ProgressBar invested={goalResult.totalInvestment} total={goalResult.target} colors={colors} />
      </div>
    </div>
  )

  const renderSWP = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <SliderInput
          label="Total Corpus"
          value={swpCorpus}
          onChange={setSwpCorpus}
          min={100000}
          max={100000000}
          step={100000}
          prefix="₹"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Monthly Withdrawal"
          value={swpWithdrawal}
          onChange={setSwpWithdrawal}
          min={1000}
          max={1000000}
          step={1000}
          prefix="₹"
          colors={colors}
          isDark={isDark}
        />
        <SliderInput
          label="Expected Return (p.a.)"
          value={swpReturn}
          onChange={setSwpReturn}
          min={1}
          max={20}
          step={0.5}
          suffix="%"
          colors={colors}
          isDark={isDark}
        />
      </div>
      <div
        className="p-6 rounded-2xl"
        style={{
          background: isDark ? `${colors.primary}08` : `${colors.primary}04`,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: colors.primary }}>
          Results
        </h3>
        <div className="space-y-4">
          <ResultRow
            label="Corpus Lasts"
            value={swpResult.exhausted ? `${swpResult.years} yrs ${swpResult.months} mo` : '100+ years'}
            color={colors.primary}
            large
            colors={colors}
          />
          <ResultRow label="Total Withdrawals" value={formatCurrency(swpResult.totalWithdrawn)} color={colors.success} colors={colors} />
          <ResultRow label="Initial Corpus" value={formatCurrency(swpCorpus)} colors={colors} />
        </div>
        <InfoBox colors={colors} isDark={isDark}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Withdrawal Rate:{' '}
            <span className="font-bold" style={{ color: swpResult.withdrawalRate > swpReturn ? colors.warning : colors.primary }}>
              {swpResult.withdrawalRate.toFixed(1)}% annually
            </span>
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            {swpReturn > swpResult.withdrawalRate
              ? 'Returns exceed withdrawals — corpus will grow!'
              : swpReturn === swpResult.withdrawalRate
              ? 'Returns match withdrawals — corpus remains stable.'
              : 'Withdrawal rate exceeds returns — corpus will deplete.'}
          </p>
        </InfoBox>
      </div>
    </div>
  )

  const renderRetirement = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <SliderInput
            label="Current Age"
            value={retCurrentAge}
            onChange={(v) => {
              setRetCurrentAge(v)
              if (v >= retRetireAge) setRetRetireAge(v + 1)
            }}
            min={18}
            max={65}
            step={1}
            suffix=" yrs"
            colors={colors}
            isDark={isDark}
          />
          <SliderInput
            label="Retire At"
            value={retRetireAge}
            onChange={(v) => {
              setRetRetireAge(v)
              if (v <= retCurrentAge) setRetCurrentAge(v - 1)
              if (v >= retLifeExpectancy) setRetLifeExpectancy(v + 1)
            }}
            min={30}
            max={75}
            step={1}
            suffix=" yrs"
            colors={colors}
            isDark={isDark}
          />
          <SliderInput
            label="Life Expect."
            value={retLifeExpectancy}
            onChange={(v) => {
              setRetLifeExpectancy(v)
              if (v <= retRetireAge) setRetRetireAge(v - 1)
            }}
            min={50}
            max={100}
            step={1}
            suffix=" yrs"
            colors={colors}
            isDark={isDark}
          />
        </div>
        <SliderInput
          label="Monthly Expenses (Today)"
          value={retMonthlyExpense}
          onChange={setRetMonthlyExpense}
          min={10000}
          max={500000}
          step={5000}
          prefix="₹"
          colors={colors}
          isDark={isDark}
        />
        <div className="grid grid-cols-3 gap-4">
          <SliderInput
            label="Inflation"
            value={retInflation}
            onChange={setRetInflation}
            min={1}
            max={12}
            step={0.5}
            suffix="%"
            colors={colors}
            isDark={isDark}
          />
          <SliderInput
            label="Pre-Ret. Return"
            value={retPreReturn}
            onChange={setRetPreReturn}
            min={1}
            max={20}
            step={0.5}
            suffix="%"
            colors={colors}
            isDark={isDark}
          />
          <SliderInput
            label="Post-Ret. Return"
            value={retPostReturn}
            onChange={setRetPostReturn}
            min={1}
            max={15}
            step={0.5}
            suffix="%"
            colors={colors}
            isDark={isDark}
          />
        </div>
      </div>
      <div
        className="p-6 rounded-2xl"
        style={{
          background: isDark ? `${colors.primary}08` : `${colors.primary}04`,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: colors.primary }}>
          Retirement Plan
        </h3>
        <div className="space-y-4">
          <ResultRow label="Corpus Needed" value={formatCurrency(retirementResult.corpusNeeded)} color={colors.primary} large colors={colors} />
          <ResultRow label="Monthly SIP Required" value={formatCurrency(retirementResult.sipNeeded)} color={colors.success} large colors={colors} />
          <Divider colors={colors} />
          <ResultRow label="Expense at Retirement" value={`${formatCurrency(retirementResult.inflatedExpense)}/mo`} colors={colors} />
          <ResultRow label="Years to Retire" value={`${retirementResult.yearsToRetire} years`} colors={colors} />
          <ResultRow label="Years in Retirement" value={`${retirementResult.yearsInRetirement} years`} colors={colors} />
        </div>
        <InfoBox colors={colors} isDark={isDark}>
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            Start investing <span className="font-semibold" style={{ color: colors.primary }}>{formatCurrency(retirementResult.sipNeeded)}/month</span> to
            build a corpus of <span className="font-semibold" style={{ color: colors.primary }}>{formatCurrency(retirementResult.corpusNeeded)}</span>.
            Your current {formatCurrency(retMonthlyExpense)}/mo expenses will become{' '}
            <span className="font-semibold" style={{ color: colors.warning }}>{formatCurrency(retirementResult.inflatedExpense)}/mo</span> at retirement due to {retInflation}% inflation.
          </p>
        </InfoBox>
      </div>
    </div>
  )

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'sip': return renderSIP()
      case 'lumpsum': return renderLumpsum()
      case 'goal': return renderGoal()
      case 'swp': return renderSWP()
      case 'retirement': return renderRetirement()
    }
  }

  return (
    <AdvisorLayout title="Financial Calculators">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Plan investments with interactive financial calculators
          </p>
        </div>

        {/* Calculator Selector */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {CALCULATORS.map(calc => (
            <button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id)}
              className="p-4 rounded-xl transition-all hover:-translate-y-0.5 text-left"
              style={{
                background: activeCalculator === calc.id
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.cardBackground,
                border: `1px solid ${activeCalculator === calc.id ? 'transparent' : colors.cardBorder}`,
                boxShadow: activeCalculator === calc.id
                  ? `0 4px 20px ${colors.primary}30`
                  : `0 2px 10px ${colors.glassShadow}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: activeCalculator === calc.id
                    ? 'rgba(255, 255, 255, 0.2)'
                    : colors.chipBg,
                }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: activeCalculator === calc.id ? '#FFFFFF' : colors.primary }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={calc.icon} />
                </svg>
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: activeCalculator === calc.id ? '#FFFFFF' : colors.textPrimary }}
              >
                {calc.name}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: activeCalculator === calc.id ? 'rgba(255,255,255,0.8)' : colors.textTertiary }}
              >
                {calc.description}
              </p>
            </button>
          ))}
        </div>

        {/* Active Calculator */}
        <FACard>
          <FASectionHeader
            title={CALCULATORS.find(c => c.id === activeCalculator)?.name || ''}
          />
          <div className="mt-6">
            {renderCalculator()}
          </div>
        </FACard>

        {/* Tips Section */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            {
              icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
              title: 'Power of Compounding',
              text: 'Start early and stay invested. Even small amounts grow significantly over time through compound returns.',
              color: colors.primary,
            },
            {
              icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
              title: 'Inflation Impact',
              text: 'Factor in 6-7% annual inflation when planning goals. Your future expenses will be higher than today.',
              color: colors.warning,
            },
            {
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              title: 'SIP Step-Up',
              text: 'Increase your SIP by 10% annually. This simple habit can significantly boost your final corpus.',
              color: colors.success,
            },
          ].map((tip) => (
            <div
              key={tip.title}
              className="p-4 rounded-xl"
              style={{
                background: isDark ? `${tip.color}08` : `${tip.color}06`,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${tip.color}15` }}
                >
                  <svg className="w-4 h-4" style={{ color: tip.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tip.icon} />
                  </svg>
                </div>
                <span className="font-medium" style={{ color: colors.textPrimary }}>{tip.title}</span>
              </div>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdvisorLayout>
  )
}

export default CalculatorsPage
