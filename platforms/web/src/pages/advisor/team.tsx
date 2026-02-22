import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import StaffManagement from '@/components/advisor/StaffManagement'
import { staffApi, teamApi } from '@/services/api'
import { biApi } from '@/services/api/business'
import { useFATheme, formatCurrency, formatCurrencyCompact } from '@/utils/fa'

interface StaffClient {
  id: string; name: string; email: string; aum: number
  sipCount: number; status: string
}

export default function TeamPage() {
  const { colors, isDark } = useFATheme()
  const [staffList, setStaffList] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [staffClients, setStaffClients] = useState<StaffClient[]>([])
  const [loading, setLoading] = useState(false)

  // RM Performance data (Change C)
  const [rmData, setRmData] = useState<{ id: string; name: string; aum: number; clientCount: number }[]>([])
  const [loadingRm, setLoadingRm] = useState(false)

  const fetchStaffList = useCallback(async () => {
    try {
      const data = await staffApi.list()
      setStaffList(data)
    } catch {}
  }, [])

  const fetchRmData = useCallback(async () => {
    try {
      setLoadingRm(true)
      const data = await biApi.getAumByRm()
      setRmData(data)
    } catch {} finally { setLoadingRm(false) }
  }, [])

  const fetchStaffClients = useCallback(async (staffId: string) => {
    if (!staffId) { setStaffClients([]); return }
    try {
      setLoading(true)
      const data = await teamApi.getStaffClients(staffId)
      setStaffClients(data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStaffList(); fetchRmData() }, [fetchStaffList, fetchRmData])

  useEffect(() => {
    if (selectedStaff) fetchStaffClients(selectedStaff)
  }, [selectedStaff, fetchStaffClients])

  return (
    <AdvisorLayout title="Team Management">
      {/* Staff List */}
      <StaffManagement />

      {/* RM Performance Scorecards (Change C) */}
      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
          Team Performance
        </h3>
        {loadingRm ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
          </div>
        ) : rmData.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>No performance data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rmData.map((rm) => {
              const staff = staffList.find((s: any) => s.id === rm.id)
              const aumPerClient = rm.clientCount > 0 ? rm.aum / rm.clientCount : 0
              return (
                <div key={rm.id} className="p-4 rounded-xl" style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(191, 219, 254, 0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(96, 165, 250, 0.01) 100%)',
                  border: `1px solid ${colors.cardBorder}`,
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{rm.name}</p>
                    {staff?.euin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>
                        {staff.euin}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 rounded-lg text-center" style={{ background: `${colors.primary}08` }}>
                      <p className="text-xs font-bold" style={{ color: colors.primary }}>{formatCurrencyCompact(rm.aum)}</p>
                      <p className="text-[10px]" style={{ color: colors.textTertiary }}>AUM</p>
                    </div>
                    <div className="flex-1 p-2 rounded-lg text-center" style={{ background: `${colors.secondary}08` }}>
                      <p className="text-xs font-bold" style={{ color: colors.secondary }}>{rm.clientCount}</p>
                      <p className="text-[10px]" style={{ color: colors.textTertiary }}>Clients</p>
                    </div>
                    <div className="flex-1 p-2 rounded-lg text-center" style={{ background: `${colors.success}08` }}>
                      <p className="text-xs font-bold" style={{ color: colors.success }}>{formatCurrencyCompact(aumPerClient)}</p>
                      <p className="text-[10px]" style={{ color: colors.textTertiary }}>AUM/Client</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Client Assignment */}
      <div className="mt-8">
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: colors.primary }}
        >
          Client Assignment
        </h3>

        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
            Select Staff Member
          </label>
          <select
            className="w-full max-w-sm h-10 px-4 rounded-xl text-sm focus:outline-none"
            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
          >
            <option value="">-- Select --</option>
            {staffList.filter((s: any) => s.isActive).map((s: any) => (
              <option key={s.id} value={s.id}>{s.displayName} ({s.staffRole || 'RM'})</option>
            ))}
          </select>
        </div>

        {selectedStaff && (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : staffClients.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No clients assigned to this staff member</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>
                {staffClients.length} Assigned Clients
              </p>
              {staffClients.map((client) => (
                <div
                  key={client.id}
                  className="p-3 rounded-xl flex items-center justify-between"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.name}</p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: colors.primary }}>
                      {formatCurrency(client.aum)}
                    </p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {client.sipCount} SIPs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AdvisorLayout>
  )
}
