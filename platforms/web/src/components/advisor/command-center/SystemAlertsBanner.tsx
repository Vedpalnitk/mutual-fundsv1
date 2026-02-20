import { useState, useEffect } from 'react'
import { useFATheme, formatCurrency, formatDate } from '@/utils/fa'
import { SIP, Transaction, Client } from '@/utils/faTypes'
import {
  FACard,
  FATintedCard,
  FAChip,
  FAButton,
  FASectionHeader,
  FALoadingState,
  useNotification,
} from '@/components/advisor/shared'
import { sipsApi, transactionsApi, clientsApi } from '@/services/api'
import ShareModal from '@/components/advisor/ShareModal'

const AlertTriangleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

const ClockIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UserIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const PhoneIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
)

const BellIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

export default function SystemAlertsBanner() {
  const { colors, isDark } = useFATheme()
  const { showNotification } = useNotification()

  const [failedSips, setFailedSips] = useState<SIP[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [kycPendingClients, setKycPendingClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [shareModalClient, setShareModalClient] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [sipsResult, txnResult, clientsResult] = await Promise.allSettled([
        sipsApi.list<SIP>({ status: 'Failed' }),
        transactionsApi.list<Transaction>({ status: 'Pending' }),
        clientsApi.list<Client>({ status: 'Pending KYC' }),
      ])

      if (sipsResult.status === 'fulfilled') setFailedSips(sipsResult.value.data)
      else setFailedSips([])
      if (txnResult.status === 'fulfilled') setPendingTransactions(txnResult.value.data)
      else setPendingTransactions([])
      if (clientsResult.status === 'fulfilled') setKycPendingClients(clientsResult.value.data)
      else setKycPendingClients([])

      setLoading(false)
    }
    fetchAll()
  }, [])

  const failedSipCount = failedSips.length
  const pendingTxnCount = pendingTransactions.length
  const kycPendingCount = kycPendingClients.length
  const allEmpty = failedSipCount === 0 && pendingTxnCount === 0 && kycPendingCount === 0

  if (loading) return <FALoadingState message="Checking alerts..." />
  if (allEmpty) return null

  const handleSendReminder = (clientName: string) => {
    showNotification('success', `KYC reminder sent to ${clientName}`)
  }

  return (
    <div className="mb-6">
      {/* Collapsed: Count Chips */}
      <div
        className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: colors.warning }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>System Alerts</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {failedSipCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}
              >
                <AlertTriangleIcon className="w-3.5 h-3.5" style={{ color: colors.error }} />
                <span className="text-xs font-semibold" style={{ color: colors.error }}>Failed SIPs: {failedSipCount}</span>
              </div>
            )}
            {pendingTxnCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  background: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
                }}
              >
                <ClockIcon className="w-3.5 h-3.5" style={{ color: colors.warning }} />
                <span className="text-xs font-semibold" style={{ color: colors.warning }}>Pending Txns: {pendingTxnCount}</span>
              </div>
            )}
            {kycPendingCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  background: isDark ? `${colors.primary}15` : `${colors.primary}10`,
                  border: `1px solid ${isDark ? `${colors.primary}30` : `${colors.primary}20`}`,
                }}
              >
                <UserIcon className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                <span className="text-xs font-semibold" style={{ color: colors.primary }}>KYC: {kycPendingCount}</span>
              </div>
            )}
          </div>
          <svg
            className="w-4 h-4 transition-transform"
            style={{ color: colors.textTertiary, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded: Detail Cards */}
      {expanded && (
        <div className="mt-3 space-y-4">
          {failedSipCount > 0 && (
            <FACard padding="lg">
              <FASectionHeader
                title="Failed SIPs"
                action={<FAChip color={colors.error} size="sm">{failedSipCount} {failedSipCount === 1 ? 'item' : 'items'}</FAChip>}
              />
              <div className="space-y-3">
                {failedSips.map((sip) => (
                  <FATintedCard key={sip.id} accentColor={colors.error} padding="md" hover={false}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{sip.fundName}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>{sip.clientName}</span>
                          <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{formatCurrency(sip.amount)}</span>
                          <span className="text-xs" style={{ color: colors.textTertiary }}>{sip.lastSipDate ? formatDate(sip.lastSipDate) : formatDate(sip.startDate)}</span>
                        </div>
                      </div>
                      <FAButton
                        variant="secondary"
                        size="sm"
                        icon={<PhoneIcon className="w-3.5 h-3.5" />}
                        onClick={() => setShareModalClient({ id: sip.clientId || '', name: sip.clientName })}
                      >
                        Contact Client
                      </FAButton>
                    </div>
                  </FATintedCard>
                ))}
              </div>
            </FACard>
          )}

          {pendingTxnCount > 0 && (
            <FACard padding="lg">
              <FASectionHeader
                title="Pending Transactions"
                action={<FAChip color={colors.warning} size="sm">{pendingTxnCount} {pendingTxnCount === 1 ? 'item' : 'items'}</FAChip>}
              />
              <div className="space-y-3">
                {pendingTransactions.map((txn) => (
                  <FATintedCard key={txn.id} accentColor={colors.warning} padding="md" hover={false}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FAChip color={colors.warning} size="xs">{txn.type}</FAChip>
                          <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{txn.fundName}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>{txn.clientName}</span>
                          <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{formatCurrency(txn.amount)}</span>
                          <span className="text-xs" style={{ color: colors.textTertiary }}>{formatDate(txn.date)}</span>
                        </div>
                      </div>
                    </div>
                  </FATintedCard>
                ))}
              </div>
            </FACard>
          )}

          {kycPendingCount > 0 && (
            <FACard padding="lg">
              <FASectionHeader
                title="KYC Pending"
                action={<FAChip color={colors.primary} size="sm">{kycPendingCount} {kycPendingCount === 1 ? 'client' : 'clients'}</FAChip>}
              />
              <div className="space-y-3">
                {kycPendingClients.map((client) => (
                  <FATintedCard key={client.id} accentColor={colors.primary} padding="md" hover={false}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${colors.primary}15` }}
                        >
                          <UserIcon className="w-4 h-4" style={{ color: colors.primary }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{client.name}</p>
                          <span className="text-xs" style={{ color: colors.textTertiary }}>{client.email}</span>
                        </div>
                        <FAChip color={colors.warning} size="xs">{client.kycStatus || 'Pending'}</FAChip>
                      </div>
                      <FAButton
                        variant="secondary"
                        size="sm"
                        icon={<BellIcon className="w-3.5 h-3.5" />}
                        onClick={() => handleSendReminder(client.name)}
                      >
                        Send Reminder
                      </FAButton>
                    </div>
                  </FATintedCard>
                ))}
              </div>
            </FACard>
          )}
        </div>
      )}

      {/* Share Modal for Contact Client */}
      {shareModalClient && (
        <ShareModal
          clientId={shareModalClient.id}
          clientName={shareModalClient.name}
          onClose={() => setShareModalClient(null)}
        />
      )}
    </div>
  )
}
