/**
 * NMF Mandate Detail Page
 *
 * View NMF mandate details, status timeline, and refresh action.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatDate, formatCurrency } from '@/utils/fa'
import { nmfApi } from '@/services/api'
import { FACard, FAButton, FASpinner } from '@/components/advisor/shared'
import NmfStatusBadge from '@/components/nmf/NmfStatusBadge'

interface MandateDetail {
  id: string
  clientId: string
  clientName: string
  mandateType: string
  status: string
  amount: number
  startDate: string
  endDate: string
  umrn?: string
  nseResponseCode?: string
  nseResponseMessage?: string
  createdAt: string
  updatedAt: string
}

const MANDATE_STEPS = ['Created', 'Submitted', 'Approved'] as const

function getMandateStepStatus(
  mandateStatus: string,
  stepIndex: number
): 'completed' | 'current' | 'pending' | 'failed' {
  const upper = mandateStatus?.toUpperCase()

  if (upper === 'REJECTED' || upper === 'CANCELLED' || upper === 'EXPIRED') {
    if (stepIndex === 0) return 'completed'
    if (stepIndex === 1) return 'failed'
    return 'pending'
  }

  const statusMap: Record<string, number> = {
    CREATED: 0,
    SUBMITTED: 1,
    APPROVED: 2,
  }

  const currentIndex = statusMap[upper] ?? 0

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return upper === 'APPROVED' ? 'completed' : 'current'
  return 'pending'
}

const MandateDetailPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { colors, isDark } = useFATheme()

  const [mandate, setMandate] = useState<MandateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [refreshing, setRefreshing] = useState(false)

  const fetchMandate = useCallback(async () => {
    if (!id || typeof id !== 'string') return
    try {
      setLoading(true)
      setError(null)
      const data = await nmfApi.mandates.getOne(id)
      setMandate(data)
    } catch (err) {
      console.error('[NMF Mandate Detail] Error:', err)
      setError('Failed to load mandate details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMandate()
  }, [fetchMandate])

  const handleRefreshStatus = async () => {
    if (!id || typeof id !== 'string') return
    try {
      setRefreshing(true)
      await nmfApi.mandates.refreshStatus(id)
      await fetchMandate()
    } catch {
      // Silent fail — data will reload
    } finally {
      setRefreshing(false)
    }
  }

  const getStepColor = (status: 'completed' | 'current' | 'pending' | 'failed') => {
    switch (status) {
      case 'completed': return colors.success
      case 'current': return colors.primary
      case 'failed': return colors.error
      default: return colors.textTertiary
    }
  }

  const formatMandateType = (type: string) => {
    if (!type) return '-'
    switch (type.toUpperCase()) {
      case 'ENACH': return 'eNACH'
      case 'PHYSICAL': return 'Physical'
      default: return type
    }
  }

  if (loading) {
    return (
      <AdvisorLayout title="NMF Mandate Detail">
        <div className="flex items-center justify-center py-20">
          <FASpinner size="lg" />
        </div>
      </AdvisorLayout>
    )
  }

  if (error || !mandate) {
    return (
      <AdvisorLayout title="NMF Mandate Detail">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: colors.error }}>{error || 'Mandate not found'}</p>
            <FAButton className="mt-4" variant="secondary" onClick={() => router.push('/advisor/nmf/mandates')}>
              Back to Mandates
            </FAButton>
          </div>
        </div>
      </AdvisorLayout>
    )
  }

  return (
    <AdvisorLayout title="NMF Mandate Detail">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/advisor/nmf/mandates')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              color: colors.primary,
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                NMF Mandate
              </h1>
              <NmfStatusBadge status={mandate.status} type="mandate" size="md" />
            </div>
            <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
              {mandate.clientName} &mdash; {formatMandateType(mandate.mandateType)}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <FACard className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Status Timeline
          </p>
          <div className="flex items-center justify-center py-2">
            {MANDATE_STEPS.map((step, i) => {
              const stepStatus = getMandateStepStatus(mandate.status, i)
              const stepColor = getStepColor(stepStatus)
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: stepStatus === 'pending' ? `${stepColor}20` : stepColor,
                        border: stepStatus === 'pending' ? `2px dashed ${stepColor}` : 'none',
                      }}
                    >
                      {stepStatus === 'completed' && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {stepStatus === 'current' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                      {stepStatus === 'failed' && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-xs mt-2 whitespace-nowrap font-medium"
                      style={{
                        color: stepStatus === 'pending' ? colors.textTertiary : stepColor,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                  {i < MANDATE_STEPS.length - 1 && (
                    <div
                      className="w-16 sm:w-24 h-0.5 mx-2 mb-6"
                      style={{
                        background: stepStatus === 'completed' ? colors.success : `${colors.textTertiary}30`,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Terminal status notice */}
          {['REJECTED', 'CANCELLED', 'EXPIRED'].includes(mandate.status?.toUpperCase()) && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm"
              style={{
                background: `${colors.error}10`,
                border: `1px solid ${colors.error}30`,
                color: colors.error,
              }}
            >
              This mandate has been <span className="font-semibold">{mandate.status.toLowerCase()}</span> and is no longer active.
            </div>
          )}
        </FACard>

        {/* Mandate Details */}
        <FACard className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Mandate Details
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Mandate ID', value: mandate.id },
              { label: 'Client ID', value: mandate.clientId },
              { label: 'Client Name', value: mandate.clientName || '-' },
              { label: 'Type', value: formatMandateType(mandate.mandateType) },
              { label: 'Status', value: mandate.status, isStatus: true },
              { label: 'Amount', value: formatCurrency(mandate.amount) },
              { label: 'Start Date', value: mandate.startDate ? formatDate(mandate.startDate) : '-' },
              { label: 'End Date', value: mandate.endDate ? formatDate(mandate.endDate) : '-' },
              ...(mandate.umrn ? [{ label: 'UMRN', value: mandate.umrn }] : []),
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs uppercase font-semibold tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>
                  {item.label}
                </p>
                {item.isStatus ? (
                  <NmfStatusBadge status={item.value} type="mandate" size="sm" />
                ) : (
                  <p
                    className="text-sm font-medium mt-0.5 break-all"
                    style={{ color: colors.textPrimary }}
                  >
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </FACard>

        {/* NSE Response */}
        {(mandate.nseResponseCode || mandate.nseResponseMessage) && (
          <FACard className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
              NSE Response
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mandate.nseResponseCode && (
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>
                    Response Code
                  </p>
                  <p className="text-sm font-medium font-mono mt-0.5" style={{ color: colors.textPrimary }}>
                    {mandate.nseResponseCode}
                  </p>
                </div>
              )}
              {mandate.nseResponseMessage && (
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>
                    Response Message
                  </p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>
                    {mandate.nseResponseMessage}
                  </p>
                </div>
              )}
            </div>
          </FACard>
        )}

        {/* Timestamps */}
        <FACard className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Timestamps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>
                Created At
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>
                {mandate.createdAt ? formatDate(mandate.createdAt) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>
                Updated At
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>
                {mandate.updatedAt ? formatDate(mandate.updatedAt) : '-'}
              </p>
            </div>
          </div>
        </FACard>

        {/* Actions */}
        <FACard>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Actions
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <FAButton
              onClick={handleRefreshStatus}
              loading={refreshing}
              variant="secondary"
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Refresh Status
            </FAButton>
            <button
              onClick={() => router.push('/advisor/nmf/mandates')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                color: colors.textSecondary,
                background: isDark ? `${colors.textTertiary}10` : `${colors.textTertiary}15`,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              Back to Mandates
            </button>
          </div>
        </FACard>

      </div>
    </AdvisorLayout>
  )
}

export default MandateDetailPage
