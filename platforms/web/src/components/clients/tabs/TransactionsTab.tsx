import { useState, useMemo } from 'react'
import { useFATheme, formatCurrency, formatDate, getTransactionTypeColor } from '@/utils/fa'
import { Client, Transaction } from '@/utils/faTypes'
import {
  FACard,
  FASectionHeader,
  FAChip,
  FAEmptyState,
} from '@/components/advisor/shared'

type TxnTypeFilter = 'All' | 'Buy' | 'Sell' | 'SIP' | 'Switch' | 'SWP' | 'STP'
type TxnStatusFilter = 'All' | 'Pending' | 'Completed' | 'Failed'
type TxnSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

interface TransactionsTabProps {
  client: Client
  transactions: Transaction[]
}

export default function TransactionsTab({ client, transactions }: TransactionsTabProps) {
  const { colors, isDark } = useFATheme()
  const [txnTypeFilter, setTxnTypeFilter] = useState<TxnTypeFilter>('All')
  const [txnStatusFilter, setTxnStatusFilter] = useState<TxnStatusFilter>('All')
  const [txnSort, setTxnSort] = useState<TxnSort>('date-desc')

  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    if (txnTypeFilter !== 'All') {
      result = result.filter(t => t.type === txnTypeFilter)
    }
    if (txnStatusFilter !== 'All') {
      result = result.filter(t => t.status === txnStatusFilter)
    }

    switch (txnSort) {
      case 'date-desc': result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break
      case 'date-asc': result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break
      case 'amount-desc': result.sort((a, b) => b.amount - a.amount); break
      case 'amount-asc': result.sort((a, b) => a.amount - b.amount); break
    }

    return result
  }, [transactions, txnTypeFilter, txnStatusFilter, txnSort])

  return (
    <FACard padding="md">
      <FASectionHeader title="Transactions" />

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {(['All', 'Buy', 'Sell', 'SIP', 'Switch', 'SWP', 'STP'] as TxnTypeFilter[]).map(type => (
              <button
                key={type}
                onClick={() => setTxnTypeFilter(type)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: txnTypeFilter === type
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : colors.chipBg,
                  color: txnTypeFilter === type ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['All', 'Pending', 'Completed', 'Failed'] as TxnStatusFilter[]).map(status => (
              <button
                key={status}
                onClick={() => setTxnStatusFilter(status)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: txnStatusFilter === status
                    ? `${status === 'Completed' ? colors.success : status === 'Failed' ? colors.error : status === 'Pending' ? colors.warning : colors.primary}20`
                    : colors.chipBg,
                  color: txnStatusFilter === status
                    ? (status === 'Completed' ? colors.success : status === 'Failed' ? colors.error : status === 'Pending' ? colors.warning : colors.textSecondary)
                    : colors.textSecondary,
                  border: txnStatusFilter === status ? `1px solid ${status === 'Completed' ? colors.success : status === 'Failed' ? colors.error : status === 'Pending' ? colors.warning : colors.primary}40` : '1px solid transparent',
                }}
              >
                {status}
              </button>
            ))}
          </div>
          <select
            value={txnSort}
            onChange={(e) => setTxnSort(e.target.value as TxnSort)}
            className="px-3 py-1.5 rounded-md text-xs font-medium focus:outline-none"
            style={{
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              color: colors.textPrimary,
            }}
          >
            <option value="date-desc">Date: Newest First</option>
            <option value="date-asc">Date: Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <FAEmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          }
          title="No Transactions Found"
          description="No transactions match the selected filters"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{
                  background: isDark
                    ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                    : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                  borderBottom: `1px solid ${colors.cardBorder}`,
                }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Units</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `${getTransactionTypeColor(txn.type, colors)}15` }}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          style={{ color: getTransactionTypeColor(txn.type, colors) }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          {txn.type === 'Buy' || txn.type === 'SIP' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          ) : txn.type === 'Sell' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          )}
                        </svg>
                      </div>
                      <span className="font-medium" style={{ color: getTransactionTypeColor(txn.type, colors) }}>{txn.type}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{txn.fundName}</p>
                  </td>
                  <td className="py-3 pr-4" style={{ color: colors.textSecondary }}>{formatDate(txn.date)}</td>
                  <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(txn.amount)}</td>
                  <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{txn.units.toFixed(2)}</td>
                  <td className="py-3">
                    <FAChip
                      size="xs"
                      color={txn.status === 'Completed' ? colors.success : txn.status === 'Failed' ? colors.error : colors.warning}
                    >
                      {txn.status}
                    </FAChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FACard>
  )
}
