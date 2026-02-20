/**
 * Command Center Page
 *
 * Unified workspace for tasks, activity tracking, and client communications.
 * Replaces CRM + Action Center + Communications pages.
 */

import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme } from '@/utils/fa'
import { staffApi, clientsApi } from '@/services/api'
import TasksTab from '@/components/advisor/command-center/TasksTab'
import ActivityTab from '@/components/advisor/command-center/ActivityTab'
import ComposeTab from '@/components/advisor/command-center/ComposeTab'

type TabKey = 'tasks' | 'activity' | 'compose'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'activity', label: 'Activity' },
  { key: 'compose', label: 'Compose' },
]

export default function CommandCenterPage() {
  const { colors } = useFATheme()
  const [activeTab, setActiveTab] = useState<TabKey>('tasks')
  const [staffList, setStaffList] = useState<any[]>([])
  const [clientList, setClientList] = useState<any[]>([])

  const fetchHelpers = useCallback(async () => {
    const [staff, clients] = await Promise.allSettled([
      staffApi.list(),
      clientsApi.list({ page: 1, limit: 200 }),
    ])
    if (staff.status === 'fulfilled') setStaffList(staff.value as any[])
    if (clients.status === 'fulfilled') setClientList((clients.value as any).data || [])
  }, [])

  useEffect(() => { fetchHelpers() }, [fetchHelpers])

  return (
    <AdvisorLayout title="Command Center">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.key
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                : colors.chipBg,
              color: activeTab === tab.key ? '#FFFFFF' : colors.textSecondary,
              border: activeTab === tab.key ? 'none' : `1px solid ${colors.chipBorder}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && <TasksTab staffList={staffList} clientList={clientList} />}
      {activeTab === 'activity' && <ActivityTab clientList={clientList} />}
      {activeTab === 'compose' && <ComposeTab />}
    </AdvisorLayout>
  )
}
