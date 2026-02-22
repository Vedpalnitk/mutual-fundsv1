import { useState } from 'react'
import { useFATheme } from '@/utils/fa'
import { Client } from '@/utils/faTypes'
import {
  FACard,
  FASectionHeader,
  FAButton,
  FAEmptyState,
  FAShareButton,
  useNotification,
} from '@/components/advisor/shared'

interface ReportsTabProps {
  client: Client
  clientId: string
}

export default function ReportsTab({ client, clientId }: ReportsTabProps) {
  const { colors } = useFATheme()
  const notification = useNotification()

  const [reportType, setReportType] = useState<string>('portfolio-statement')
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')

  return (
    <FACard padding="md">
      <FASectionHeader title="Generate Reports" />
      <div className="space-y-4">
        {/* Report Type */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none"
            style={{
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              color: colors.textPrimary,
            }}
          >
            <option value="portfolio-statement">Portfolio Statement</option>
            <option value="tax-statement">Tax Statement (Capital Gains)</option>
            <option value="performance-report">Performance Report</option>
            <option value="transaction-report">Transaction Report</option>
            <option value="sip-summary">SIP Summary</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              From Date
            </label>
            <input
              type="date"
              value={reportDateFrom}
              onChange={(e) => setReportDateFrom(e.target.value)}
              className="w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              To Date
            </label>
            <input
              type="date"
              value={reportDateTo}
              onChange={(e) => setReportDateTo(e.target.value)}
              className="w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>
        </div>

        {/* Generate Buttons */}
        <div className="flex gap-3 pt-2">
          <FAButton
            onClick={() => notification.info('Coming Soon', 'PDF report generation will be available in the next release.')}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Download PDF
          </FAButton>
          <FAButton
            variant="secondary"
            onClick={() => notification.info('Coming Soon', 'Excel report generation will be available in the next release.')}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Download Excel
          </FAButton>
          <FAShareButton
            clientId={clientId}
            clientName={client.name}
            templateType="REPORT_SHARING"
            contextData={{ reportType: reportType }}
            label="Share Report"
            size="md"
          />
        </div>

        {/* Recent Reports Placeholder */}
        <div className="pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
          <FASectionHeader title="Recent Reports" />
          <FAEmptyState
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            title="No Reports Generated"
            description="Generate your first report using the form above"
          />
        </div>
      </div>
    </FACard>
  )
}
