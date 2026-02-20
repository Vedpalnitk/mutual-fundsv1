/**
 * NSE NMF Credential Setup
 *
 * Configure NSE NMF credentials for MF API access.
 * Test connectivity and manage credential lifecycle.
 */

import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme } from '@/utils/fa'
import { nmfApi } from '@/services/api'
import {
  FAButton,
  FAInput,
  FAChip,
  FASpinner,
} from '@/components/advisor/shared'

type ConnectionStatus = 'connected' | 'disconnected' | 'failed' | 'loading'

const NMFSetupPage = () => {
  const { colors, isDark } = useFATheme()

  // Credential form state
  const [memberId, setMemberId] = useState('')
  const [loginUserId, setLoginUserId] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [memberLicenseKey, setMemberLicenseKey] = useState('')
  const [ipWhitelist, setIpWhitelist] = useState('')

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
      const res = await nmfApi.credentials.getStatus()
      if (res?.configured) {
        setStatus('connected')
        setStatusMessage(res.message || 'Credentials configured')
        // Pre-fill non-secret fields if available
        if (res.memberId) setMemberId(res.memberId)
        if (res.loginUserId) setLoginUserId(res.loginUserId)
        if (res.ipWhitelist) setIpWhitelist(res.ipWhitelist || '')
      } else {
        setStatus('disconnected')
        setStatusMessage('No NSE NMF credentials configured')
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
      const result = await nmfApi.credentials.test()
      if (result.success) {
        setStatus('connected')
        setStatusMessage(result.message || 'Connection successful')
        setSuccess('NSE NMF connection test passed successfully')
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
    if (!memberId.trim() || !loginUserId.trim() || !apiSecret.trim() || !memberLicenseKey.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      await nmfApi.credentials.set({
        memberId: memberId.trim(),
        loginUserId: loginUserId.trim(),
        apiSecret: apiSecret.trim(),
        memberLicenseKey: memberLicenseKey.trim(),
        ipWhitelist: ipWhitelist.trim() || undefined,
      })
      setSuccess('NSE NMF credentials saved successfully')
      setStatus('connected')
      setStatusMessage('Credentials configured')
      // Clear secret fields after save
      setApiSecret('')
      setMemberLicenseKey('')
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
    <AdvisorLayout title="NSE NMF Setup">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Configure your NSE NMF credentials for order execution
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
                  NSE NMF Credentials
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FAInput
                    label="Member ID"
                    required
                    placeholder="Enter NSE Member ID"
                    value={memberId}
                    onChange={e => setMemberId(e.target.value)}
                  />
                  <FAInput
                    label="Login User ID"
                    required
                    placeholder="Enter NSE Login User ID"
                    value={loginUserId}
                    onChange={e => setLoginUserId(e.target.value)}
                  />
                  <FAInput
                    label="API Secret"
                    required
                    type="password"
                    placeholder={status === 'connected' ? '********' : 'Enter API Secret'}
                    value={apiSecret}
                    onChange={e => setApiSecret(e.target.value)}
                    helperText={status === 'connected' ? 'Leave blank to keep existing secret' : undefined}
                  />
                  <FAInput
                    label="Member License Key"
                    required
                    type="password"
                    placeholder={status === 'connected' ? '********' : 'Enter Member License Key'}
                    value={memberLicenseKey}
                    onChange={e => setMemberLicenseKey(e.target.value)}
                    helperText={status === 'connected' ? 'Leave blank to keep existing key' : undefined}
                  />
                  <div className="md:col-span-2">
                    <FAInput
                      label="IP Whitelist"
                      placeholder="Enter whitelisted IPs (comma-separated, optional)"
                      value={ipWhitelist}
                      onChange={e => setIpWhitelist(e.target.value)}
                      helperText="Server IPs allowed by NSE for API access"
                    />
                  </div>
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
                    {loginUserId && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>Login User ID</span>
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{loginUserId}</span>
                      </div>
                    )}
                    {ipWhitelist && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>IP Whitelist</span>
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{ipWhitelist}</span>
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
                    { step: '1', text: 'Get credentials from the NSE NMF portal' },
                    { step: '2', text: 'Enter Member ID and Login User ID' },
                    { step: '3', text: 'Enter API Secret and Member License Key' },
                    { step: '4', text: 'Add whitelisted IPs if required by NSE' },
                    { step: '5', text: 'Save and test the connection' },
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

export default NMFSetupPage
