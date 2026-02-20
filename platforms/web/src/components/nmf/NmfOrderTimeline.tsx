import { useFATheme } from '@/utils/fa'

interface NmfOrderTimelineProps {
  currentStatus: string
}

interface TimelineStep {
  key: string
  label: string
}

const LIFECYCLE_STEPS: TimelineStep[] = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'TWO_FA_PENDING', label: '2FA' },
  { key: 'AUTH_PENDING', label: 'Auth' },
  { key: 'PAYMENT_PENDING', label: 'Payment' },
  { key: 'PAYMENT_CONFIRMATION_PENDING', label: 'Confirm' },
  { key: 'PENDING_RTA', label: 'RTA' },
  { key: 'VALIDATED_RTA', label: 'Validated' },
  { key: 'ALLOTMENT_DONE', label: 'Allotted' },
  { key: 'UNITS_TRANSFERRED', label: 'Complete' },
]

const TERMINAL_FAILURE_STATUSES = ['REJECTED', 'CANCELLED', 'FAILED']

const getStepIndex = (status: string): number => {
  return LIFECYCLE_STEPS.findIndex((s) => s.key === status)
}

export default function NmfOrderTimeline({ currentStatus }: NmfOrderTimelineProps) {
  const { colors } = useFATheme()

  const normalized = currentStatus?.toUpperCase() || ''
  const isTerminal = TERMINAL_FAILURE_STATUSES.includes(normalized)
  const currentIdx = getStepIndex(normalized)

  // For terminal statuses, figure out which step was last reached
  // If the status is not in our lifecycle (like REJECTED), we show up to the first step
  // and mark it as failed. In practice, the order usually fails at a certain stage.
  // We'll show the timeline up to the 2nd step (Placed is always done) with a red X.
  const terminalStopIdx = isTerminal ? 0 : -1

  const getStepState = (idx: number): 'completed' | 'current' | 'pending' | 'failed' => {
    if (isTerminal) {
      // For terminal failures: show first step as completed, next as failed
      if (idx < 1) return 'completed'
      if (idx === 1) return 'failed'
      return 'pending'
    }

    if (currentIdx < 0) {
      // Status not in lifecycle (e.g., SUBMITTED) -- treat as first step
      if (idx === 0) return 'current'
      return 'pending'
    }

    if (idx < currentIdx) return 'completed'
    if (idx === currentIdx) return 'current'
    return 'pending'
  }

  const getStepColor = (state: string) => {
    switch (state) {
      case 'completed': return colors.success
      case 'current': return colors.primary
      case 'failed': return colors.error
      default: return colors.textTertiary
    }
  }

  // For terminal statuses, build a shorter timeline
  const stepsToRender = isTerminal
    ? [
        { key: 'PLACED', label: 'Placed' },
        { key: normalized, label: normalized.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
      ]
    : LIFECYCLE_STEPS

  const states = isTerminal
    ? ['completed' as const, 'failed' as const]
    : LIFECYCLE_STEPS.map((_, i) => getStepState(i))

  return (
    <div className="flex items-center gap-1">
      {stepsToRender.map((step, i) => {
        const state = states[i]
        const stepColor = getStepColor(state)

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  state === 'current' ? 'ring-2 ring-offset-1' : ''
                }`}
                style={{
                  background: state === 'pending' ? 'transparent' : stepColor,
                  border: state === 'pending' ? `2px solid ${colors.textTertiary}` : 'none',
                  opacity: state === 'pending' ? 0.4 : 1,
                  boxShadow: state === 'current' ? `0 0 0 2px ${colors.primary}40` : undefined,
                }}
              >
                {state === 'completed' && (
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {state === 'failed' && (
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {state === 'current' && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'white' }}
                  />
                )}
              </div>
              <span
                className="text-[10px] mt-1 whitespace-nowrap max-w-[48px] truncate text-center"
                style={{
                  color: state === 'pending' ? colors.textTertiary : stepColor,
                  fontWeight: state === 'current' ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < stepsToRender.length - 1 && (
              <div
                className="w-5 h-0.5 mb-4 mx-0.5"
                style={{
                  background: state === 'completed' ? colors.success : colors.textTertiary,
                  opacity: state === 'completed' ? 1 : 0.2,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
