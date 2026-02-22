import { useCallback } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { useOnboarding } from './hooks/useOnboarding'
import OnboardingProgress from './OnboardingProgress'
import ProfileStep from './steps/ProfileStep'
import ArnStep from './steps/ArnStep'
import ExchangeSetupStep from './steps/ExchangeSetupStep'
import TeamSetupStep from './steps/TeamSetupStep'
import ImportBookStep from './steps/ImportBookStep'
import CommissionRatesStep from './steps/CommissionRatesStep'
import CompletionStep from './steps/CompletionStep'

interface Props {
  onComplete: () => void
}

export default function OnboardingWizard({ onComplete }: Props) {
  const { isDark, colors } = useFATheme()
  const {
    status,
    loading,
    actionLoading,
    currentStep,
    stepLabels,
    completeStep,
    skipStep,
    completeWizard,
  } = useOnboarding()

  const handleCompleteStep = useCallback(async (step: number, data?: any) => {
    await completeStep(step, data)
  }, [completeStep])

  const handleSkipStep = useCallback(async (step: number) => {
    await skipStep(step)
  }, [skipStep])

  const handleFinish = useCallback(async () => {
    await completeWizard()
    onComplete()
  }, [completeWizard, onComplete])

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{
          background: colors.background,
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 rounded-full animate-spin"
            style={{ borderColor: colors.cardBorder, borderTopColor: colors.primary }}
          />
          <p className="text-sm" style={{ color: colors.textSecondary }}>Loading onboarding...</p>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProfileStep
            onComplete={data => handleCompleteStep(1, data)}
            loading={actionLoading}
          />
        )
      case 2:
        return (
          <ArnStep
            onComplete={data => handleCompleteStep(2, data)}
            loading={actionLoading}
          />
        )
      case 3:
        return (
          <ExchangeSetupStep
            onComplete={data => handleCompleteStep(3, data)}
            loading={actionLoading}
          />
        )
      case 4:
        return (
          <TeamSetupStep
            onComplete={data => handleCompleteStep(4, data)}
            onSkip={() => handleSkipStep(4)}
            loading={actionLoading}
          />
        )
      case 5:
        return (
          <ImportBookStep
            onComplete={data => handleCompleteStep(5, data)}
            onSkip={() => handleSkipStep(5)}
            loading={actionLoading}
            importStatus={status?.importStatus}
          />
        )
      case 6:
        return (
          <CommissionRatesStep
            onComplete={data => handleCompleteStep(6, data)}
            onSkip={() => handleSkipStep(6)}
            loading={actionLoading}
          />
        )
      case 7:
        return (
          <CompletionStep
            status={status}
            onFinish={handleFinish}
            loading={actionLoading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background: colors.background,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        className="h-16 flex items-center justify-between px-6"
        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/icon-192.png"
            alt="Sparrow"
            className="w-9 h-9 rounded-xl"
            style={{
              boxShadow: `0 4px 14px ${colors.glassShadow}`,
              filter: isDark ? 'brightness(1.25) saturate(1.1)' : undefined,
            }}
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Welcome to Sparrow Invest
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Let's get your account set up
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-6 pb-10">
        <OnboardingProgress
          currentStep={currentStep}
          status={status}
          stepLabels={stepLabels}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pb-12">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
