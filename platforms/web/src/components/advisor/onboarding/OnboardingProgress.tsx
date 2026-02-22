import { useFATheme } from '@/utils/faHooks'
import type { OnboardingStatus } from '@/services/api'

const STEP_KEYS: Array<keyof OnboardingStatus['steps']> = [
  'profile', 'arn', 'exchange', 'team', 'import', 'commission',
]

interface Props {
  currentStep: number
  status: OnboardingStatus | null
  stepLabels: string[]
}

export default function OnboardingProgress({ currentStep, status, stepLabels }: Props) {
  const { isDark, colors } = useFATheme()

  // Steps 1-6 have status in steps object, step 7 is "Complete"
  const getStepState = (index: number): 'completed' | 'current' | 'upcoming' | 'skipped' => {
    const stepNum = index + 1
    if (stepNum === 7) {
      return status?.isComplete ? 'completed' : stepNum === currentStep ? 'current' : 'upcoming'
    }
    const key = STEP_KEYS[index]
    const stepStatus = status?.steps?.[key]
    if (stepStatus?.skipped) return 'skipped'
    if (stepStatus?.completed) return 'completed'
    if (stepNum === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
      {stepLabels.map((label, i) => {
        const state = getStepState(i)
        const isLast = i === stepLabels.length - 1
        const stepNum = i + 1

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: state === 'completed'
                    ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`
                    : state === 'skipped'
                    ? colors.chipBg
                    : state === 'current'
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : isDark ? colors.backgroundTertiary : colors.backgroundTertiary,
                  color: state === 'completed' || state === 'current'
                    ? '#FFFFFF'
                    : state === 'skipped'
                    ? colors.textTertiary
                    : colors.textTertiary,
                  border: state === 'current'
                    ? 'none'
                    : `1px solid ${state === 'completed' ? 'transparent' : colors.cardBorder}`,
                  boxShadow: state === 'current'
                    ? `0 4px 14px ${colors.glassShadow}`
                    : 'none',
                }}
              >
                {state === 'completed' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : state === 'skipped' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className="text-[10px] font-medium mt-1.5 whitespace-nowrap absolute -bottom-5"
                style={{
                  color: state === 'current'
                    ? colors.primary
                    : state === 'completed'
                    ? colors.success
                    : colors.textTertiary,
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="flex-1 h-0.5 mx-1.5"
                style={{
                  background: state === 'completed' || state === 'skipped'
                    ? colors.success
                    : isDark
                    ? colors.backgroundTertiary
                    : colors.backgroundTertiary,
                  opacity: state === 'completed' || state === 'skipped' ? 0.5 : 0.3,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
