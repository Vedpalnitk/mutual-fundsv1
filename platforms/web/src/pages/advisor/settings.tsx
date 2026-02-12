/**
 * Advisor Settings Page
 *
 * Manage advisor profile, preferences, and account settings.
 * Includes: Profile info, Notifications, Display, Security
 */

import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatDate } from '@/utils/fa'
import { AdvisorPreferences, ReportFormat } from '@/utils/faTypes'
import { notificationPreferencesApi, NotificationPreferences, authProfileApi, AuthProfile } from '@/services/api'
import {
  FACard,
  FALabel,
  FAInput,
  FASelect,
  FAButton,
} from '@/components/advisor/shared'
import StaffManagement from '@/components/advisor/StaffManagement'
import { useAuth } from '@/context/AuthContext'

// Settings tabs
type SettingsTab = 'profile' | 'notifications' | 'display' | 'security' | 'staff'

// Display preferences key in localStorage
const DISPLAY_PREFS_KEY = 'fa-display-preferences'

const defaultPreferences: AdvisorPreferences = {
  theme: 'system',
  defaultReportFormat: 'PDF',
  emailNotifications: true,
  smsNotifications: true,
  sipReminders: true,
  goalAlerts: true,
  marketAlerts: false,
  dashboardWidgets: ['kpi', 'pending-actions', 'recent-transactions', 'insights'],
}

function loadDisplayPrefs(): AdvisorPreferences {
  if (typeof window === 'undefined') return defaultPreferences
  try {
    const saved = localStorage.getItem(DISPLAY_PREFS_KEY)
    if (saved) return { ...defaultPreferences, ...JSON.parse(saved) }
  } catch {}
  return defaultPreferences
}

function saveDisplayPrefs(prefs: AdvisorPreferences) {
  try {
    localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

// Map backend categories to frontend preference keys
const NOTIFICATION_CATEGORY_MAP: Record<string, { label: string; description: string; section: 'channel' | 'alert' }> = {
  TRADE_ALERTS: { label: 'Trade Alerts', description: 'Order execution and trade updates', section: 'alert' },
  SIP_REMINDERS: { label: 'SIP Reminders', description: 'Get notified about upcoming SIP dates', section: 'alert' },
  CLIENT_REQUESTS: { label: 'Client Requests', description: 'New trade requests from clients', section: 'alert' },
  MARKET_UPDATES: { label: 'Market Alerts', description: 'Significant market movements and news', section: 'alert' },
  DAILY_DIGEST: { label: 'Daily Digest', description: 'Daily summary of portfolio activity', section: 'alert' },
  PORTFOLIO_ALERTS: { label: 'Portfolio Alerts', description: 'Updates on client goal progress and milestones', section: 'alert' },
  KYC_ALERTS: { label: 'KYC Alerts', description: 'KYC status changes and reminders', section: 'alert' },
}

const CHANNEL_LABELS: Record<string, { label: string; description: string; icon: string }> = {
  EMAIL: {
    label: 'Email Notifications',
    description: 'Receive updates via email',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  PUSH: {
    label: 'Push Notifications',
    description: 'Receive push notifications',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  WHATSAPP: {
    label: 'WhatsApp Notifications',
    description: 'Receive updates via WhatsApp',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
}

const DASHBOARD_WIDGETS = [
  { id: 'kpi', label: 'Key Metrics', description: 'AUM, clients, and growth stats' },
  { id: 'pending-actions', label: 'Pending Actions', description: 'Tasks requiring attention' },
  { id: 'recent-transactions', label: 'Recent Transactions', description: 'Latest client transactions' },
  { id: 'insights', label: 'AI Insights', description: 'Smart recommendations and alerts' },
  { id: 'top-clients', label: 'Top Clients', description: 'Highest AUM clients' },
  { id: 'upcoming-sips', label: 'Upcoming SIPs', description: 'SIPs scheduled this week' },
  { id: 'goal-progress', label: 'Goal Progress', description: 'Client goal tracking' },
  { id: 'market-summary', label: 'Market Summary', description: 'Index and sector performance' },
]

const SettingsPage = () => {
  const { colors, isDark } = useFATheme()
  const { user } = useAuth()
  const isAdvisor = user?.role === 'advisor'
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [preferences, setPreferences] = useState<AdvisorPreferences>(loadDisplayPrefs)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Profile from API
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profileDirty, setProfileDirty] = useState(false)

  // Notification preferences from API
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifDirty, setNotifDirty] = useState(false)

  // Security state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const showSuccess = (msg: string) => {
    setSavedMessage(msg)
    setErrorMessage('')
    setTimeout(() => setSavedMessage(''), 3000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setSavedMessage('')
    setTimeout(() => setErrorMessage(''), 4000)
  }

  // Load profile from API
  const loadProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const data = await authProfileApi.get()
      setProfile(data)
      setProfileForm({ name: data.name || '', phone: data.phone || '' })
      setProfileDirty(false)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // Load notification preferences from API
  const loadNotifPrefs = useCallback(async () => {
    setNotifLoading(true)
    try {
      const data = await notificationPreferencesApi.get()
      setNotifPrefs(data)
      setNotifDirty(false)
    } catch (err) {
      console.error('Failed to load notification preferences:', err)
    } finally {
      setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
    loadNotifPrefs()
  }, [loadProfile, loadNotifPrefs])

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'display', label: 'Display', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    ...(isAdvisor ? [{ id: 'staff' as SettingsTab, label: 'Staff', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' }] : []),
  ]

  const toggleNotifPref = (category: string, channel: string) => {
    if (!notifPrefs) return
    setNotifPrefs(prev => {
      if (!prev) return prev
      const current = prev[category]?.[channel] ?? false
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [channel]: !current,
        },
      }
    })
    setNotifDirty(true)
  }

  // Check if any channel is enabled for a category (for the category-level toggle)
  const isCategoryEnabled = (category: string): boolean => {
    if (!notifPrefs || !notifPrefs[category]) return false
    return Object.values(notifPrefs[category]).some(v => v)
  }

  // Toggle all channels for a category
  const toggleCategory = (category: string) => {
    if (!notifPrefs) return
    const allEnabled = isCategoryEnabled(category)
    setNotifPrefs(prev => {
      if (!prev || !prev[category]) return prev
      const updated: Record<string, boolean> = {}
      for (const channel of Object.keys(prev[category])) {
        updated[channel] = !allEnabled
      }
      return { ...prev, [category]: updated }
    })
    setNotifDirty(true)
  }

  const handleSaveNotifPrefs = async () => {
    if (!notifPrefs || !notifDirty) return
    setIsSaving(true)
    try {
      const updates: { category: string; channel: string; enabled: boolean }[] = []
      for (const [category, channels] of Object.entries(notifPrefs)) {
        for (const [channel, enabled] of Object.entries(channels)) {
          updates.push({ category, channel, enabled })
        }
      }
      const result = await notificationPreferencesApi.update(updates)
      setNotifPrefs(result)
      setNotifDirty(false)
      showSuccess('Notification preferences saved!')
    } catch (err) {
      console.error('Failed to save notification preferences:', err)
      showError('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileDirty) return
    setIsSaving(true)
    try {
      const updated = await authProfileApi.update({
        name: profileForm.name,
        phone: profileForm.phone,
      })
      setProfile(updated)
      setProfileDirty(false)
      showSuccess('Profile saved successfully!')
    } catch (err) {
      console.error('Failed to save profile:', err)
      showError('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return
    setPasswordSaving(true)
    try {
      await authProfileApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showSuccess('Password changed successfully!')
    } catch (err: any) {
      const msg = err?.message || 'Failed to change password'
      showError(msg.includes('incorrect') ? 'Current password is incorrect' : msg)
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSaveDisplayPrefs = () => {
    saveDisplayPrefs(preferences)
    showSuccess('Display settings saved!')
  }

  const toggleWidget = (widgetId: string) => {
    setPreferences(prev => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.includes(widgetId)
        ? prev.dashboardWidgets.filter(w => w !== widgetId)
        : [...prev.dashboardWidgets, widgetId]
    }))
  }

  return (
    <AdvisorLayout title="Settings">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Manage your account and preferences</p>
          </div>
          {savedMessage && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: `${colors.success}15`, color: colors.success }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">{savedMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: `${colors.error}15`, color: colors.error }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <FACard className="sticky top-4">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: activeTab === tab.id ? `${colors.primary}15` : 'transparent',
                      color: activeTab === tab.id ? colors.primary : colors.textSecondary,
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </FACard>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                {profileLoading && !profile ? (
                  <FACard>
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                        />
                        <span className="text-sm" style={{ color: colors.textSecondary }}>Loading profile...</span>
                      </div>
                    </div>
                  </FACard>
                ) : profile ? (
                  <>
                    {/* Personal Information */}
                    <FACard>
                      <div className="flex items-center gap-3 mb-6">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${colors.primary}15`, color: colors.primary }}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Personal Information</h3>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>Update your personal details</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FALabel>Full Name</FALabel>
                          <FAInput
                            value={profileForm.name}
                            onChange={(e) => { setProfileForm(f => ({ ...f, name: e.target.value })); setProfileDirty(true) }}
                          />
                        </div>
                        <div>
                          <FALabel>Email Address</FALabel>
                          <FAInput
                            type="email"
                            value={profile.email}
                            disabled
                          />
                        </div>
                        <div>
                          <FALabel>Phone Number</FALabel>
                          <FAInput
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => { setProfileForm(f => ({ ...f, phone: e.target.value })); setProfileDirty(true) }}
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                        <div>
                          <FALabel>Role</FALabel>
                          <FAInput
                            value={profile.role === 'advisor' ? 'Financial Advisor' : profile.role}
                            disabled
                          />
                        </div>
                      </div>
                    </FACard>

                    {/* Account Info */}
                    <FACard>
                      <div className="flex items-center gap-3 mb-6">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${colors.secondary}15`, color: colors.secondary }}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Account Status</h3>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>Your account verification and ID</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FALabel>Account ID</FALabel>
                          <FAInput value={profile.id} disabled />
                        </div>
                        <div>
                          <FALabel>Verification</FALabel>
                          <div className="flex items-center gap-2 h-10">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                background: profile.isVerified ? `${colors.success}15` : `${colors.warning}15`,
                                color: profile.isVerified ? colors.success : colors.warning,
                              }}
                            >
                              {profile.isVerified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </FACard>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <FAButton onClick={handleSaveProfile} disabled={isSaving || !profileDirty}>
                        {isSaving ? 'Saving...' : profileDirty ? 'Save Profile' : 'Saved'}
                      </FAButton>
                    </div>
                  </>
                ) : (
                  <FACard>
                    <div className="text-center py-8">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Failed to load profile.</p>
                      <button onClick={loadProfile} className="mt-2 text-sm font-medium" style={{ color: colors.primary }}>
                        Retry
                      </button>
                    </div>
                  </FACard>
                )}
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <>
                {notifLoading && !notifPrefs ? (
                  <FACard>
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                        />
                        <span className="text-sm" style={{ color: colors.textSecondary }}>Loading preferences...</span>
                      </div>
                    </div>
                  </FACard>
                ) : notifPrefs ? (
                  <>
                    {/* Per-category notification settings */}
                    {Object.entries(NOTIFICATION_CATEGORY_MAP).map(([category, meta]) => {
                      const channels = notifPrefs[category]
                      if (!channels) return null
                      const enabled = isCategoryEnabled(category)
                      return (
                        <FACard key={category}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${enabled ? colors.primary : colors.textTertiary}15`, color: enabled ? colors.primary : colors.textTertiary }}
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{meta.label}</h3>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>{meta.description}</p>
                              </div>
                            </div>
                            {/* Master toggle for category */}
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-12 h-6 rounded-full relative transition-all flex-shrink-0"
                              style={{
                                background: enabled
                                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                                  : colors.chipBg,
                                border: `1px solid ${enabled ? 'transparent' : colors.cardBorder}`,
                              }}
                            >
                              <div
                                className="w-5 h-5 rounded-full absolute top-0.5 transition-all shadow"
                                style={{
                                  background: 'white',
                                  left: enabled ? '26px' : '2px',
                                }}
                              />
                            </button>
                          </div>

                          {/* Channel toggles */}
                          {enabled && (
                            <div className="space-y-2 ml-13 pl-4" style={{ borderLeft: `2px solid ${colors.cardBorder}` }}>
                              {Object.entries(channels).map(([channel, isEnabled]) => {
                                const channelMeta = CHANNEL_LABELS[channel]
                                if (!channelMeta) return null
                                return (
                                  <div
                                    key={channel}
                                    className="p-3 rounded-lg flex items-center justify-between"
                                    style={{ background: colors.chipBg }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: `${isEnabled ? colors.secondary : colors.textTertiary}15`, color: isEnabled ? colors.secondary : colors.textTertiary }}
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d={channelMeta.icon} />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{channelMeta.label}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => toggleNotifPref(category, channel)}
                                      className="w-10 h-5 rounded-full relative transition-all"
                                      style={{
                                        background: isEnabled ? colors.secondary : colors.cardBorder,
                                      }}
                                    >
                                      <div
                                        className="w-4 h-4 rounded-full absolute top-0.5 transition-all shadow"
                                        style={{
                                          background: 'white',
                                          left: isEnabled ? '22px' : '2px',
                                        }}
                                      />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </FACard>
                      )
                    })}

                    <div className="flex justify-end">
                      <FAButton onClick={handleSaveNotifPrefs} disabled={isSaving || !notifDirty}>
                        {isSaving ? 'Saving...' : notifDirty ? 'Save Preferences' : 'Saved'}
                      </FAButton>
                    </div>
                  </>
                ) : (
                  <FACard>
                    <div className="text-center py-8">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Failed to load notification preferences.</p>
                      <button
                        onClick={loadNotifPrefs}
                        className="mt-2 text-sm font-medium"
                        style={{ color: colors.primary }}
                      >
                        Retry
                      </button>
                    </div>
                  </FACard>
                )}
              </>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <>
                <FACard>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.primary}15`, color: colors.primary }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Theme</h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Choose your preferred appearance</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
                      { value: 'dark', label: 'Dark', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
                      { value: 'system', label: 'System', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                    ].map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => setPreferences({ ...preferences, theme: theme.value as 'light' | 'dark' | 'system' })}
                        className="p-4 rounded-xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02]"
                        style={{
                          background: preferences.theme === theme.value ? `${colors.primary}15` : colors.chipBg,
                          border: `2px solid ${preferences.theme === theme.value ? colors.primary : 'transparent'}`,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: preferences.theme === theme.value ? `${colors.primary}25` : colors.cardBackground,
                            color: preferences.theme === theme.value ? colors.primary : colors.textSecondary,
                          }}
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={theme.icon} />
                          </svg>
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: preferences.theme === theme.value ? colors.primary : colors.textPrimary }}
                        >
                          {theme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </FACard>

                <FACard>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.secondary}15`, color: colors.secondary }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Dashboard Widgets</h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Customize your dashboard layout</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DASHBOARD_WIDGETS.map(widget => (
                      <button
                        key={widget.id}
                        onClick={() => toggleWidget(widget.id)}
                        className="p-3 rounded-xl flex items-start gap-3 text-left transition-all hover:scale-[1.01]"
                        style={{
                          background: preferences.dashboardWidgets.includes(widget.id)
                            ? `${colors.primary}10`
                            : colors.chipBg,
                          border: `1px solid ${preferences.dashboardWidgets.includes(widget.id) ? colors.primary : colors.cardBorder}`,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5"
                          style={{
                            background: preferences.dashboardWidgets.includes(widget.id) ? colors.primary : 'transparent',
                            border: `2px solid ${preferences.dashboardWidgets.includes(widget.id) ? colors.primary : colors.cardBorder}`,
                          }}
                        >
                          {preferences.dashboardWidgets.includes(widget.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{widget.label}</p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>{widget.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </FACard>

                <FACard>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.warning}15`, color: colors.warning }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Report Preferences</h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Default format for generated reports</p>
                    </div>
                  </div>

                  <div>
                    <FALabel>Default Report Format</FALabel>
                    <FASelect
                      options={[
                        { value: 'PDF', label: 'PDF Document' },
                        { value: 'Excel', label: 'Excel Spreadsheet' },
                        { value: 'CSV', label: 'CSV File' },
                      ]}
                      value={preferences.defaultReportFormat}
                      onChange={(e) => setPreferences({ ...preferences, defaultReportFormat: e.target.value as ReportFormat })}
                      containerClassName="max-w-xs"
                    />
                  </div>
                </FACard>

                <div className="flex justify-end">
                  <FAButton onClick={handleSaveDisplayPrefs}>
                    Save Display Settings
                  </FAButton>
                </div>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <FACard>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.primary}15`, color: colors.primary }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Change Password</h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Update your account password</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <FALabel>Current Password</FALabel>
                      <FAInput
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <FALabel>New Password</FALabel>
                      <FAInput
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <FALabel>Confirm New Password</FALabel>
                      <FAInput
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs" style={{ color: colors.error }}>Passwords do not match</p>
                    )}
                    <FAButton
                      onClick={handleChangePassword}
                      disabled={passwordSaving || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                    >
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </FAButton>
                  </div>
                </FACard>

                <FACard>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.success}15`, color: colors.success }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Two-Factor Authentication</h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Add an extra layer of security</p>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: `${colors.success}15`, color: colors.success }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>Authenticator App</p>
                        <p className="text-sm" style={{ color: colors.success }}>Enabled</p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        background: colors.chipBg,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      Configure
                    </button>
                  </div>
                </FACard>

                <FACard>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.secondary}15`, color: colors.secondary }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Active Sessions</h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Manage your logged-in devices</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { device: 'MacBook Pro', location: 'Mumbai, India', time: 'Current session', current: true },
                      { device: 'iPhone 15 Pro', location: 'Mumbai, India', time: '2 hours ago', current: false },
                      { device: 'Chrome on Windows', location: 'Bangalore, India', time: '3 days ago', current: false },
                    ].map((session, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg flex items-center justify-between"
                        style={{ background: colors.chipBg }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ background: colors.cardBackground, color: colors.textSecondary }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={session.device.includes('iPhone') ? 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' : 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'} />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                              {session.device}
                              {session.current && (
                                <span
                                  className="ml-2 text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: `${colors.success}15`, color: colors.success }}
                                >
                                  Current
                                </span>
                              )}
                            </p>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>
                              {session.location} · {session.time}
                            </p>
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            className="text-sm font-medium transition-all hover:underline"
                            style={{ color: colors.error }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </FACard>

                <FACard>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.error}15`, color: colors.error }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.error }}>Danger Zone</h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Irreversible account actions</p>
                    </div>
                  </div>

                  <button
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: `${colors.error}15`,
                      color: colors.error,
                      border: `1px solid ${colors.error}30`,
                    }}
                  >
                    Delete Account
                  </button>
                </FACard>
              </>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && isAdvisor && (
              <StaffManagement />
            )}
          </div>
        </div>
      </div>
    </AdvisorLayout>
  )
}

export default SettingsPage
