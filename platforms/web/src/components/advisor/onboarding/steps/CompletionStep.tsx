import { useFATheme } from '@/utils/faHooks'
import { FAButton } from '@/components/advisor/shared/FAForm'
import type { OnboardingStatus } from '@/services/api'

interface Props {
  status: OnboardingStatus | null
  onFinish: () => Promise<void>
  loading: boolean
}

const STEP_INFO = [
  { key: 'profile' as const, label: 'Profile Setup', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
  { key: 'arn' as const, label: 'ARN Details', icon: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.75 5.625h3.75' },
  { key: 'exchange' as const, label: 'Exchange Setup', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
  { key: 'team' as const, label: 'Team Setup', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
  { key: 'import' as const, label: 'Client Book Import', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' },
  { key: 'commission' as const, label: 'Commission Rates', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
]

export default function CompletionStep({ status, onFinish, loading }: Props) {
  const { isDark, colors } = useFATheme()

  const completedSteps = status
    ? STEP_INFO.filter(s => status.steps[s.key]?.completed).length
    : 0
  const skippedSteps = status
    ? STEP_INFO.filter(s => status.steps[s.key]?.skipped).length
    : 0

  return (
    <div className="space-y-6 text-center">
      {/* Celebration icon */}
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${colors.success}20 0%, ${colors.primary}20 100%)`,
            border: `1px solid ${colors.success}30`,
          }}
        >
          <svg className="w-10 h-10" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          You're All Set!
        </h2>
        <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: colors.textSecondary }}>
          Your account is ready. {completedSteps} of 6 setup steps completed
          {skippedSteps > 0 && ` (${skippedSteps} skipped — you can complete them anytime)`}.
        </p>
      </div>

      {/* Steps summary */}
      <div className="max-w-md mx-auto space-y-2 text-left">
        {STEP_INFO.map(step => {
          const stepStatus = status?.steps[step.key]
          const completed = stepStatus?.completed
          const skipped = stepStatus?.skipped

          return (
            <div
              key={step.key}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: completed && !skipped
                  ? `${colors.success}06`
                  : skipped
                  ? `${colors.warning}04`
                  : colors.cardBackground,
                border: `1px solid ${
                  completed && !skipped
                    ? colors.success + '20'
                    : skipped
                    ? colors.warning + '15'
                    : colors.cardBorder
                }`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: completed && !skipped
                    ? `${colors.success}15`
                    : skipped
                    ? `${colors.warning}10`
                    : colors.chipBg,
                }}
              >
                <svg
                  className="w-4 h-4"
                  style={{
                    color: completed && !skipped
                      ? colors.success
                      : skipped
                      ? colors.warning
                      : colors.textTertiary,
                  }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                </svg>
              </div>
              <span className="text-sm flex-1" style={{ color: colors.textPrimary }}>
                {step.label}
              </span>
              {completed && !skipped && (
                <svg className="w-5 h-5" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {skipped && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${colors.warning}15`, color: colors.warning }}>
                  Skipped
                </span>
              )}
              {!completed && (
                <svg className="w-5 h-5" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-2">
        <FAButton size="lg" onClick={onFinish} loading={loading}>
          Launch Dashboard
        </FAButton>
      </div>
    </div>
  )
}
