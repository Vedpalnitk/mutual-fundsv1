/**
 * BSE StAR MF Credential Setup
 *
 * Configure BSE credentials for StAR MF API access.
 * Test connectivity and manage credential lifecycle.
 */

import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme } from '@/utils/fa'
import { bseApi } from '@/services/api'
import {
  FACard,
  FAButton,
  FAInput,
  FALabel,
  FAChip,
  FAEmptyState,
  FASpinner,
} from '@/components/advisor/shared'

type ConnectionStatus = 'connected' | 'disconnected' | 'failed' | 'loading'

const BSESetupPage = () => {
  const { colors, isDark } = useFATheme()

  // Credential form state
  const [memberId, setMemberId] = useState('')
  const [userIdBse, setUserIdBse] = useState('')
  const [password, setPassword] = useState('')
  const [arn, setArn] = useState('')
  const [euin, setEuin] = useState('')
  const [passKey, setPassKey] = useState('')

  // UI state
  const [status, setStatus] = useState<ConnectionStatus>('loading')
  const [statusMessage, setStatusMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // Load existing status on mount
  const loadStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const res = await bseApi.credentials.getStatus()
      if (res?.isConfigured) {
        setStatus('connected')
        setStatusMessage(res.message || 'Credentials configured')
        // Pre-fill non-secret fields if available
        if (res.memberId) setMemberId(res.memberId)
        if (res.userIdBse) setUserIdBse(res.userIdBse)
        if (res.arn) setArn(res.arn)
        if (res.euin) setEuin(res.euin || '')
      } else {
        setStatus('disconnected')
        setStatusMessage('No BSE credentials configured')
      }
    } catch {
      setStatus('disconnected')
      setStatusMessage('Unable to fetch credential status')
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // Test connection
  const handleTestConnection = async () => {
    try {
      setTesting(true)
      setError(null)
      setSuccess(null)
      const result = await bseApi.credentials.test()
      if (result.success) {
        setStatus('connected')
        setStatusMessage(result.message || 'Connection successful')
        setSuccess('BSE connection test passed successfully')
      } else {
        setStatus('failed')
        setStatusMessage(result.message || 'Connection test failed')
        setError(result.message || 'Connection test failed')
      }
    } catch (err) {
      setStatus('failed')
      const msg = err instanceof Error ? err.message : 'Connection test failed'
      setStatusMessage(msg)
      setError(msg)
    } finally {
      setTesting(false)
    }
  }

  // Save credentials
  const handleSave = async () => {
    // Validate required fields
    if (!memberId.trim() || !userIdBse.trim() || !password.trim() || !arn.trim() || !passKey.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      await bseApi.credentials.set({
        memberId: memberId.trim(),
        userIdBse: userIdBse.trim(),
        password: password.trim(),
        arn: arn.trim(),
        euin: euin.trim() || undefined,
        passKey: passKey.trim(),
      })
      setSuccess('BSE credentials saved successfully')
      setStatus('connected')
      setStatusMessage('Credentials configured')
      // Clear password field after save
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return colors.success
      case 'failed': return colors.error
      case 'loading': return colors.textTertiary
      default: return colors.warning
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'connected': return 'Connected'
      case 'failed': return 'Failed'
      case 'loading': return 'Checking...'
      default: return 'Not Connected'
    }
  }

  return (
    <AdvisorLayout title="BSE StAR MF Setup">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Configure your BSE StAR MF credentials for order execution
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FAChip color={getStatusColor()} size="sm">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: getStatusColor() }}
                />
                {getStatusLabel()}
              </span>
            </FAChip>
          </div>
        </div>

        {loadingStatus ? (
          <div className="flex items-center justify-center py-20">
            <FASpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Credential Form */}
            <div className="lg:col-span-2">
              <div
                className="p-5 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-5" style={{ color: colors.primary }}>
                  BSE Credentials
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FAInput
                    label="Member ID"
                    required
                    placeholder="Enter BSE Member ID"
                    value={memberId}
                    onChange={e => setMemberId(e.target.value)}
                  />
                  <FAInput
                    label="User ID (BSE)"
                    required
                    placeholder="Enter BSE User ID"
                    value={userIdBse}
                    onChange={e => setUserIdBse(e.target.value)}
                  />
                  <FAInput
                    label="Password"
                    required
                    type="password"
                    placeholder={status === 'connected' ? '********' : 'Enter BSE Password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    helperText={status === 'connected' ? 'Leave blank to keep existing password' : undefined}
                  />
                  <FAInput
                    label="ARN"
                    required
                    placeholder="Enter AMFI Registration Number"
                    value={arn}
                    onChange={e => setArn(e.target.value)}
                  />
                  <FAInput
                    label="EUIN"
                    placeholder="Enter EUIN (optional)"
                    value={euin}
                    onChange={e => setEuin(e.target.value)}
                    helperText="Employee Unique Identification Number"
                  />
                  <FAInput
                    label="Pass Key"
                    required
                    type="password"
                    placeholder="Enter BSE Pass Key"
                    value={passKey}
                    onChange={e => setPassKey(e.target.value)}
                  />
                </div>

                {/* Error / Success Messages */}
                {error && (
                  <div
                    className="p-3 rounded-lg mb-4 text-sm"
                    style={{
                      background: `${colors.error}10`,
                      border: `1px solid ${colors.error}30`,
                      color: colors.error,
                    }}
                  >
                    {error}
                  </div>
                )}
                {success && (
                  <div
                    className="p-3 rounded-lg mb-4 text-sm"
                    style={{
                      background: `${colors.success}10`,
                      border: `1px solid ${colors.success}30`,
                      color: colors.success,
                    }}
                  >
                    {success}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <FAButton onClick={handleSave} loading={saving}>
                    Save Credentials
                  </FAButton>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg flex items-center gap-2"
                    style={{
                      background: `${colors.primary}10`,
                      border: `1px solid ${colors.primary}30`,
                      color: colors.primary,
                      opacity: testing ? 0.6 : 1,
                    }}
                  >
                    {testing ? (
                      <>
                        <div
                          className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                        />
                        Testing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Test Connection
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Side Panel */}
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div
                className="p-5 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
                  Connection Status
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: status === 'connected'
                        ? `linear-gradient(135deg, ${colors.success} 0%, ${isDark ? '#059669' : '#047857'} 100%)`
                        : status === 'failed'
                          ? `linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%)`
                          : `${colors.textTertiary}15`,
                    }}
                  >
                    {status === 'connected' ? (
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : status === 'failed' ? (
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {getStatusLabel()}
                    </p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {statusMessage}
                    </p>
                  </div>
                </div>

                {status === 'connected' && (
                  <div className="space-y-2">
                    {memberId && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>Member ID</span>
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{memberId}</span>
                      </div>
                    )}
                    {arn && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>ARN</span>
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{arn}</span>
                      </div>
                    )}
                    {euin && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>EUIN</span>
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{euin}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Help Card */}
              <div
                className="p-5 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
                  Setup Guide
                </h3>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Get credentials from BSE StAR MF portal' },
                    { step: '2', text: 'Enter Member ID, User ID, and Password' },
                    { step: '3', text: 'Enter your AMFI Registration Number (ARN)' },
                    { step: '4', text: 'Save and test the connection' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                      >
                        {item.step}
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvisorLayout>
  )
}

export default BSESetupPage
