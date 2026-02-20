import { useState, useEffect, useCallback } from 'react'
import { staffApi, StaffMember } from '@/services/api'
import { useFATheme } from '@/utils/fa'
import {
  FACard,
  FALabel,
  FAInput,
  FAButton,
} from '@/components/advisor/shared'

const PAGE_OPTIONS = [
  {
    section: 'Overview',
    pages: [
      { href: '/advisor/dashboard', label: 'Dashboard' },
    ],
  },
  {
    section: 'Client Management',
    pages: [
      { href: '/advisor/clients', label: 'Clients' },
      { href: '/advisor/pipeline', label: 'Pipeline' },
      { href: '/advisor/transactions', label: 'Transactions' },
      { href: '/advisor/command-center', label: 'Command Center' },
      { href: '/advisor/insights', label: 'Insights' },
    ],
  },
  {
    section: 'Business',
    pages: [
      { href: '/advisor/business', label: 'AUM & Analytics' },
      { href: '/advisor/commissions', label: 'Commissions' },
      { href: '/advisor/team', label: 'Team' },
      { href: '/advisor/branches', label: 'Branches' },
      { href: '/advisor/compliance', label: 'Compliance' },
    ],
  },
  {
    section: 'Research',
    pages: [
      { href: '/advisor/funds', label: 'Funds' },
      { href: '/advisor/compare', label: 'Compare' },
      { href: '/advisor/analysis', label: 'Deep Analysis' },
      { href: '/advisor/calculators', label: 'Calculators' },
      { href: '/advisor/reports', label: 'Reports' },
    ],
  },
]

export default function StaffManagement() {
  const { colors } = useFATheme()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const [addForm, setAddForm] = useState({
    displayName: '',
    email: '',
    password: '',
    phone: '',
    allowedPages: [] as string[],
  })

  const [editForm, setEditForm] = useState({
    displayName: '',
    allowedPages: [] as string[],
    isActive: true,
  })

  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      const data = await staffApi.list()
      setStaff(data)
    } catch (err) {
      console.error('Failed to load staff:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStaff() }, [loadStaff])

  const flash = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAdd = async () => {
    if (!addForm.displayName || !addForm.email || !addForm.password) return
    setSaving(true)
    try {
      await staffApi.create({
        displayName: addForm.displayName,
        email: addForm.email,
        password: addForm.password,
        phone: addForm.phone || undefined,
        allowedPages: addForm.allowedPages,
      })
      setShowAddModal(false)
      setAddForm({ displayName: '', email: '', password: '', phone: '', allowedPages: [] })
      flash('Staff member added successfully', 'success')
      loadStaff()
    } catch (err: any) {
      flash(err?.message || 'Failed to add staff member', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingStaff) return
    setSaving(true)
    try {
      await staffApi.update(editingStaff.id, {
        displayName: editForm.displayName,
        allowedPages: editForm.allowedPages,
        isActive: editForm.isActive,
      })
      setEditingStaff(null)
      flash('Staff member updated', 'success')
      loadStaff()
    } catch (err: any) {
      flash(err?.message || 'Failed to update staff member', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await staffApi.deactivate(id)
      flash('Staff member deactivated', 'success')
      loadStaff()
    } catch (err: any) {
      flash(err?.message || 'Failed to deactivate', 'error')
    }
  }

  const openEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setEditForm({
      displayName: member.displayName,
      allowedPages: member.allowedPages,
      isActive: member.isActive,
    })
  }

  const togglePage = (pages: string[], setPages: (p: string[]) => void, href: string) => {
    setPages(pages.includes(href) ? pages.filter(p => p !== href) : [...pages, href])
  }

  const renderPageCheckboxes = (selected: string[], onChange: (pages: string[]) => void) => (
    <div className="space-y-4">
      {PAGE_OPTIONS.map(section => (
        <div key={section.section}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textTertiary }}>
            {section.section}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {section.pages.map(page => (
              <button
                key={page.href}
                type="button"
                onClick={() => togglePage(selected, onChange, page.href)}
                className="flex items-center gap-2 p-2 rounded-lg text-left transition-all"
                style={{
                  background: selected.includes(page.href) ? `${colors.primary}10` : colors.chipBg,
                  border: `1px solid ${selected.includes(page.href) ? colors.primary : colors.cardBorder}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: selected.includes(page.href) ? colors.primary : 'transparent',
                    border: `2px solid ${selected.includes(page.href) ? colors.primary : colors.cardBorder}`,
                  }}
                >
                  {selected.includes(page.href) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm" style={{ color: colors.textPrimary }}>{page.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {message && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{
            background: `${message.type === 'success' ? colors.success : colors.error}15`,
            color: message.type === 'success' ? colors.success : colors.error,
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={message.type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
          </svg>
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <FACard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${colors.primary}15`, color: colors.primary }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Staff Members</h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Manage your team's access</p>
            </div>
          </div>
          <FAButton onClick={() => setShowAddModal(true)}>Add Staff</FAButton>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
              />
              <span className="text-sm" style={{ color: colors.textSecondary }}>Loading staff...</span>
            </div>
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `${colors.primary}10` }}
            >
              <svg className="w-8 h-8" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: colors.textPrimary }}>No staff members yet</p>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Add staff to delegate access to specific pages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map(member => (
              <div
                key={member.id}
                className="p-4 rounded-xl flex items-center justify-between"
                style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold"
                    style={{
                      background: member.isActive ? `${colors.primary}15` : `${colors.textTertiary}15`,
                      color: member.isActive ? colors.primary : colors.textTertiary,
                    }}
                  >
                    {member.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {member.displayName}
                      {!member.isActive && (
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${colors.error}15`, color: colors.error }}
                        >
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {member.email} · {member.allowedPages.length} pages
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(member)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: `${colors.primary}10`, color: colors.primary }}
                  >
                    Edit
                  </button>
                  {member.isActive && (
                    <button
                      onClick={() => handleDeactivate(member.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{ background: `${colors.error}10`, color: colors.error }}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </FACard>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Add Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: colors.textSecondary }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <FALabel>Display Name</FALabel>
                <FAInput
                  value={addForm.displayName}
                  onChange={(e) => setAddForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. Neha Sharma"
                />
              </div>
              <div>
                <FALabel>Email</FALabel>
                <FAInput
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="staff@sparrow-invest.com"
                />
              </div>
              <div>
                <FALabel>Password</FALabel>
                <FAInput
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <FALabel>Phone (Optional)</FALabel>
                <FAInput
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <FALabel>Page Permissions</FALabel>
                {renderPageCheckboxes(addForm.allowedPages, (pages) => setAddForm(f => ({ ...f, allowedPages: pages })))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-full text-sm font-medium"
                style={{ color: colors.textSecondary, background: colors.chipBg }}
              >
                Cancel
              </button>
              <FAButton
                onClick={handleAdd}
                disabled={saving || !addForm.displayName || !addForm.email || !addForm.password || addForm.allowedPages.length === 0}
              >
                {saving ? 'Adding...' : 'Add Staff'}
              </FAButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Edit Staff Member</h3>
              <button onClick={() => setEditingStaff(null)} style={{ color: colors.textSecondary }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <FALabel>Display Name</FALabel>
                <FAInput
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                />
              </div>
              <div>
                <FALabel>Email</FALabel>
                <FAInput value={editingStaff.email} disabled />
              </div>
              <div>
                <FALabel>Status</FALabel>
                <div className="flex gap-3">
                  {(['Active', 'Inactive'] as const).map(status => {
                    const isSelected = editForm.isActive === (status === 'Active')
                    const statusColor = status === 'Active' ? colors.success : colors.error
                    return (
                      <button
                        key={status}
                        onClick={() => setEditForm(f => ({ ...f, isActive: status === 'Active' }))}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: isSelected ? `${statusColor}15` : colors.chipBg,
                          border: `1px solid ${isSelected ? statusColor : colors.cardBorder}`,
                          color: isSelected ? statusColor : colors.textSecondary,
                        }}
                      >
                        {status}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <FALabel>Page Permissions</FALabel>
                {renderPageCheckboxes(editForm.allowedPages, (pages) => setEditForm(f => ({ ...f, allowedPages: pages })))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2.5 rounded-full text-sm font-medium"
                style={{ color: colors.textSecondary, background: colors.chipBg }}
              >
                Cancel
              </button>
              <FAButton
                onClick={handleEdit}
                disabled={saving || !editForm.displayName || editForm.allowedPages.length === 0}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </FAButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
