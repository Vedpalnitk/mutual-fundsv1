import { useState, useEffect, useCallback } from 'react'
import { onboardingApi, OnboardingStatus } from '@/services/api'

const STEP_LABELS = [
  'Profile',
  'ARN Details',
  'Exchange Setup',
  'Team Setup',
  'Import Book',
  'Commission Rates',
  'Complete',
]

const SKIPPABLE_STEPS = new Set([4, 5, 6])

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await onboardingApi.getStatus()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const completeStep = useCallback(async (step: number, data?: any) => {
    setActionLoading(true)
    try {
      const updated = await onboardingApi.completeStep(step, data)
      setStatus(updated)
      return updated
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [])

  const skipStep = useCallback(async (step: number) => {
    setActionLoading(true)
    try {
      const updated = await onboardingApi.skipStep(step)
      setStatus(updated)
      return updated
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [])

  const completeWizard = useCallback(async () => {
    setActionLoading(true)
    try {
      const updated = await onboardingApi.completeWizard()
      setStatus(updated)
      return updated
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }, [])

  const currentStep = status?.currentStep ?? 1
  const isSkippable = SKIPPABLE_STEPS.has(currentStep)
  const completedCount = status
    ? Object.values(status.steps).filter(s => s.completed).length
    : 0

  return {
    status,
    loading,
    error,
    actionLoading,
    currentStep,
    isSkippable,
    completedCount,
    totalSteps: 7,
    stepLabels: STEP_LABELS,
    completeStep,
    skipStep,
    completeWizard,
    refetch: fetchStatus,
  }
}
