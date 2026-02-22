import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminTintedCard, AdminSpinner, AdminEmptyState, AdminModal } from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import { adminSettingsApi, SystemSetting } from '@/services/api/admin'

const isJsonString = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str)
    return typeof parsed === 'object' && parsed !== null
  } catch {
    return false
  }
}

const formatValue = (value: any): string => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

const SettingsPage = () => {
  const { colors, isDark } = useAdminTheme()

  // Data state
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Search
  const [search, setSearch] = useState('')

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editKey, setEditKey] = useState('')
  const [editValue, setEditValue] = useState('')
  const [isNewSetting, setIsNewSetting] = useState(false)
  const [confirmStep, setConfirmStep] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminSettingsApi.list()
      setSettings(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  // Filtered settings
  const filteredSettings = settings.filter((s) =>
    s.key.toLowerCase().includes(search.toLowerCase())
  )

  // Modal handlers
  const openAddModal = () => {
    setEditKey('')
    setEditValue('')
    setIsNewSetting(true)
    setConfirmStep(false)
    setEditModalOpen(true)
  }

  const openEditModal = (setting: SystemSetting) => {
    setEditKey(setting.key)
    setEditValue(formatValue(setting.value))
    setIsNewSetting(false)
    setConfirmStep(false)
    setEditModalOpen(true)
  }

  const closeModal = () => {
    setEditModalOpen(false)
    setConfirmStep(false)
    setEditKey('')
    setEditValue('')
  }

  const handleSave = async () => {
    if (!confirmStep) {
      setConfirmStep(true)
      return
    }

    setSaving(true)
    try {
      // Parse the value - try JSON first, otherwise use raw string
      let parsedValue: any = editValue
      try {
        parsedValue = JSON.parse(editValue)
      } catch {
        // Keep as string
      }

      await adminSettingsApi.update(editKey, parsedValue)
      setSuccessMessage(`Setting "${editKey}" saved successfully`)
      closeModal()
      loadSettings()
    } catch (err: any) {
      setError(err.message || 'Failed to save setting')
      setConfirmStep(false)
    } finally {
      setSaving(false)
    }
  }

  const isValueJson = isJsonString(editValue)

  return (
    <AdminLayout title="System Settings">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Manage system-wide configuration settings.
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Setting
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{
              background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${colors.success}`,
            }}
          >
            <span style={{ color: colors.success }}>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-sm underline" style={{ color: colors.success }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{
              background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${colors.error}`,
            }}
          >
            <span style={{ color: colors.error }}>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline" style={{ color: colors.error }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div
          className="p-4 rounded-xl mb-6"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: colors.textTertiary }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search settings by key..."
                  className="w-full h-10 pl-11 pr-4 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
            </div>
            <button
              onClick={loadSettings}
              className="h-10 px-4 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ background: colors.chipBg, color: colors.primary }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Settings List */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <AdminSpinner size="lg" />
          </div>
        ) : filteredSettings.length === 0 && !search ? (
          <AdminEmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="No settings configured"
            description="System settings will appear here once created."
            action={
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg mt-4"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`,
                }}
              >
                Add First Setting
              </button>
            }
          />
        ) : filteredSettings.length === 0 && search ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: colors.chipBg }}>
              <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              No settings match &quot;{search}&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                {filteredSettings.length} setting{filteredSettings.length !== 1 ? 's' : ''}
              </span>
            </div>
            {filteredSettings.map((setting) => (
              <AdminTintedCard key={setting.key} hover={false} padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-mono" style={{ color: colors.textPrimary }}>
                      {setting.key}
                    </p>
                    <p className="text-xs mt-1 truncate" style={{ color: colors.textSecondary }}>
                      {typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)}
                    </p>
                    <p className="text-[10px] mt-2" style={{ color: colors.textTertiary }}>
                      Updated {new Date(setting.updatedAt).toLocaleDateString()}{' '}
                      {setting.updatedBy ? `by ${setting.updatedBy}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditModal(setting)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all ml-4 shrink-0"
                    style={{ background: colors.chipBg, color: colors.textPrimary, border: `1px solid ${colors.chipBorder}` }}
                  >
                    Edit
                  </button>
                </div>
              </AdminTintedCard>
            ))}
          </div>
        )}

        {/* Edit / Add Modal */}
        <AdminModal
          isOpen={editModalOpen}
          onClose={closeModal}
          title={confirmStep ? 'Confirm Changes' : isNewSetting ? 'Add Setting' : `Edit: ${editKey}`}
          size="md"
        >
          <div className="space-y-4">
            {confirmStep ? (
              /* Confirmation Step */
              <>
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.06)',
                    border: `1px solid ${colors.warning}`,
                  }}
                >
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.warning }}>
                    Are you sure you want to save this setting?
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    This will update the system configuration immediately.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    KEY
                  </label>
                  <p className="text-sm font-mono px-4 py-2.5 rounded-xl" style={{ background: colors.chipBg, color: colors.textPrimary }}>
                    {editKey}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    VALUE PREVIEW
                  </label>
                  <pre
                    className="text-xs px-4 py-3 rounded-xl overflow-auto max-h-40 whitespace-pre-wrap break-words"
                    style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
                  >
                    {editValue}
                  </pre>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setConfirmStep(false)}
                    className="flex-1 h-10 rounded-full font-semibold text-sm transition-all hover:opacity-80"
                    style={{ background: colors.chipBg, color: colors.textSecondary }}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 h-10 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      boxShadow: `0 4px 14px ${colors.glassShadow}`,
                    }}
                  >
                    {saving ? 'Saving...' : 'Confirm & Save'}
                  </button>
                </div>
              </>
            ) : (
              /* Edit Form */
              <>
                {/* Key Input */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    KEY
                  </label>
                  <input
                    type="text"
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    disabled={!isNewSetting}
                    placeholder="e.g. MAINTENANCE_MODE"
                    className="w-full h-10 px-4 rounded-xl text-sm font-mono transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                  {!isNewSetting && (
                    <p className="text-[10px] mt-1" style={{ color: colors.textTertiary }}>
                      Key cannot be changed for existing settings.
                    </p>
                  )}
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    VALUE
                  </label>
                  {isValueJson || editValue.startsWith('{') || editValue.startsWith('[') ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl text-sm font-mono transition-all focus:outline-none resize-y"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Setting value"
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    />
                  )}
                  <p className="text-[10px] mt-1" style={{ color: colors.textTertiary }}>
                    {isValueJson ? 'Detected as JSON object.' : 'Enter a string value, or start with { or [ for JSON.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 h-10 rounded-full font-semibold text-sm transition-all hover:opacity-80"
                    style={{ background: colors.chipBg, color: colors.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!editKey.trim() || saving}
                    className="flex-1 h-10 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      boxShadow: `0 4px 14px ${colors.glassShadow}`,
                    }}
                  >
                    {isNewSetting ? 'Add Setting' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  )
}

export default SettingsPage
