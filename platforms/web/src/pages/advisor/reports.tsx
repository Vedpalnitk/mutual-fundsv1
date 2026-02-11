/**
 * Reports Page
 *
 * Generate and manage client financial reports.
 * Features: Report generation, preview, download, and scheduling
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, formatDate } from '@/utils/fa'
import { Report, ReportType, ReportFormat, ScheduledReport, SavedAnalysisSummary } from '@/utils/faTypes'
import { savedAnalysisApi } from '@/services/api'
import {
  FACard,
  FAStatCard,
  FAChip,
  FASelect,
  FAButton,
  FAInput,
  FASectionHeader,
  FAEmptyState,
  FATintedCard,
  FAFormSection,
  FASpinner,
} from '@/components/advisor/shared'

// Report types configuration
const REPORT_TYPES: { id: ReportType; name: string; description: string; icon: string; pastel: string; iconColor: string }[] = [
  { id: 'portfolio-statement', name: 'Portfolio Statement', description: 'Complete holdings with current value and gains', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', pastel: 'pastelIndigo', iconColor: '#4F46E5' },
  { id: 'transaction-report', name: 'Transaction Report', description: 'All transactions with dates and amounts', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', pastel: 'pastelMint', iconColor: '#059669' },
  { id: 'capital-gains', name: 'Capital Gains Report', description: 'STCG and LTCG breakdown for tax filing', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', pastel: 'pastelPeach', iconColor: '#D97706' },
  { id: 'performance-report', name: 'Performance Report', description: 'Returns analysis with benchmark comparison', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', pastel: 'pastelPurple', iconColor: '#7C3AED' },
  { id: 'sip-summary', name: 'SIP Summary', description: 'Active SIPs with contribution history', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', pastel: 'pastelSky', iconColor: '#0284C7' },
  { id: 'goal-report', name: 'Goal Progress Report', description: 'Track progress towards financial goals', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', pastel: 'pastelPink', iconColor: '#DB2777' },
]

// Mock clients
const MOCK_CLIENTS = [
  { id: 'c1', name: 'Rajesh Sharma', email: 'rajesh.sharma@email.com' },
  { id: 'c2', name: 'Priya Patel', email: 'priya.patel@email.com' },
  { id: 'c3', name: 'Amit Kumar', email: 'amit.kumar@email.com' },
  { id: 'c4', name: 'Sneha Gupta', email: 'sneha.gupta@email.com' },
  { id: 'c5', name: 'Vikram Singh', email: 'vikram.singh@email.com' },
  { id: 'all', name: 'All Clients (Batch)', email: '' },
]

// Mock generated reports
const MOCK_REPORTS: Report[] = [
  { id: 'r1', name: 'Portfolio Statement - Rajesh Sharma', type: 'portfolio-statement', client: 'Rajesh Sharma', clientId: 'c1', generatedAt: '2024-01-20T14:30:00', size: '245 KB', format: 'PDF' },
  { id: 'r2', name: 'Capital Gains FY23-24 - Priya Patel', type: 'capital-gains', client: 'Priya Patel', clientId: 'c2', generatedAt: '2024-01-19T10:15:00', size: '128 KB', format: 'PDF' },
  { id: 'r3', name: 'Transaction Report Jan 2024 - Amit Kumar', type: 'transaction-report', client: 'Amit Kumar', clientId: 'c3', generatedAt: '2024-01-18T16:45:00', size: '312 KB', format: 'Excel' },
  { id: 'r4', name: 'Performance Report Q4 2023 - All Clients', type: 'performance-report', client: 'All Clients', generatedAt: '2024-01-15T09:00:00', size: '1.2 MB', format: 'PDF' },
  { id: 'r5', name: 'SIP Summary - Sneha Gupta', type: 'sip-summary', client: 'Sneha Gupta', clientId: 'c4', generatedAt: '2024-01-14T11:30:00', size: '89 KB', format: 'PDF' },
]

// Mock scheduled reports
const MOCK_SCHEDULED: ScheduledReport[] = [
  { id: 'sr1', name: 'Monthly Portfolio Statement', type: 'portfolio-statement', clients: 'all', frequency: 'Monthly', nextRun: '2024-02-01', lastRun: '2024-01-01', status: 'Active' },
  { id: 'sr2', name: 'Quarterly Performance Review', type: 'performance-report', clients: ['c1', 'c2', 'c3', 'c4', 'c5'], frequency: 'Quarterly', nextRun: '2024-04-01', lastRun: '2024-01-01', status: 'Active' },
  { id: 'sr3', name: 'Annual Tax Report', type: 'capital-gains', clients: 'all', frequency: 'Annually', nextRun: '2024-04-15', status: 'Active' },
]

type TabType = 'generate' | 'recent' | 'scheduled' | 'deep-analysis'

const ReportsPage = () => {
  const { colors, isDark } = useFATheme()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('generate')
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedReport, setSelectedReport] = useState<ReportType | ''>('')
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('PDF')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null)

  // Deep Analysis state
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysisSummary[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)

  useEffect(() => {
    if (activeTab === 'deep-analysis') {
      const fetchAnalyses = async () => {
        setLoadingAnalyses(true)
        try {
          const data = await savedAnalysisApi.list()
          setSavedAnalyses(data)
        } catch {
          setSavedAnalyses([])
        } finally {
          setLoadingAnalyses(false)
        }
      }
      fetchAnalyses()
    }
  }, [activeTab])

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm('Delete this analysis and all versions?')) return
    try {
      await savedAnalysisApi.delete(id)
      setSavedAnalyses(prev => prev.filter(a => a.id !== id))
    } catch {
      // ignore
    }
  }

  const handleDownloadAnalysisPdf = async (id: string, latestVersion: number) => {
    try {
      await savedAnalysisApi.downloadPdf(id, latestVersion)
    } catch {
      alert('Failed to download PDF')
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'FINAL': return colors.success
      case 'SHARED': return colors.primary
      default: return colors.warning
    }
  }

  const getReportIcon = (typeId: ReportType) => {
    const report = REPORT_TYPES.find(r => r.id === typeId)
    return report?.icon || ''
  }

  const getReportName = (typeId: ReportType) => {
    const report = REPORT_TYPES.find(r => r.id === typeId)
    return report?.name || ''
  }

  const generateReport = async () => {
    if (!selectedClient || !selectedReport) return

    setIsGenerating(true)

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2500))

    const clientName = MOCK_CLIENTS.find(c => c.id === selectedClient)?.name || 'Unknown'
    const newReport: Report = {
      id: `r${Date.now()}`,
      name: `${getReportName(selectedReport)} - ${clientName}`,
      type: selectedReport,
      client: clientName,
      clientId: selectedClient,
      generatedAt: new Date().toISOString(),
      size: `${Math.floor(Math.random() * 500) + 100} KB`,
      format: selectedFormat,
    }

    setGeneratedReport(newReport)
    setIsGenerating(false)
    setShowPreview(true)
  }

  const renderPreviewModal = () => {
    if (!showPreview || !generatedReport) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        />
        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl"
          style={{
            background: colors.cardBackground,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: colors.cardBorder }}
          >
            <div>
              <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                Report Preview
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {generatedReport.name}
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ background: colors.chipBg, color: colors.textSecondary }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {/* Mock Report Preview */}
            <div
              className="p-8 rounded-xl"
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                border: `1px solid ${colors.cardBorder}`,
                minHeight: '400px',
              }}
            >
              {/* Report Header */}
              <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: `2px solid ${colors.primary}` }}>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {getReportName(generatedReport.type)}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    Generated on {new Date(generatedReport.generatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ background: `${colors.primary}15` }}
                >
                  <svg className="w-8 h-8" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={getReportIcon(generatedReport.type)} />
                  </svg>
                </div>
              </div>

              {/* Client Info */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
                  Client Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>Name</p>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{generatedReport.client}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>Report Period</p>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>
                      {dateRange.from || 'Apr 01, 2023'} - {dateRange.to || 'Mar 31, 2024'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>Format</p>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{generatedReport.format}</p>
                  </div>
                </div>
              </div>

              {/* Mock Summary Section */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
                  Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Invested', value: formatCurrency(1500000) },
                    { label: 'Current Value', value: formatCurrency(1850000) },
                    { label: 'Total Returns', value: formatCurrency(350000) },
                    { label: 'XIRR', value: '15.6%' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl"
                      style={{ background: colors.chipBg }}
                    >
                      <p className="text-xs" style={{ color: colors.textTertiary }}>{item.label}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: colors.textPrimary }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock Table */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
                  Holdings
                </h2>
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: colors.chipBg }}>
                      <th className="text-left p-3 text-xs font-semibold" style={{ color: colors.textTertiary }}>Fund Name</th>
                      <th className="text-right p-3 text-xs font-semibold" style={{ color: colors.textTertiary }}>Invested</th>
                      <th className="text-right p-3 text-xs font-semibold" style={{ color: colors.textTertiary }}>Current</th>
                      <th className="text-right p-3 text-xs font-semibold" style={{ color: colors.textTertiary }}>Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { fund: 'HDFC Flexi Cap Fund', invested: 500000, current: 625000, returns: 25.0 },
                      { fund: 'ICICI Prudential Bluechip', invested: 400000, current: 468000, returns: 17.0 },
                      { fund: 'Axis Long Term Equity', invested: 300000, current: 378000, returns: 26.0 },
                      { fund: 'SBI Corporate Bond', invested: 300000, current: 324000, returns: 8.0 },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                        <td className="p-3 text-sm" style={{ color: colors.textPrimary }}>{row.fund}</td>
                        <td className="p-3 text-sm text-right" style={{ color: colors.textSecondary }}>
                          {formatCurrency(row.invested)}
                        </td>
                        <td className="p-3 text-sm text-right" style={{ color: colors.textPrimary }}>
                          {formatCurrency(row.current)}
                        </td>
                        <td className="p-3 text-sm text-right font-medium" style={{ color: colors.success }}>
                          +{row.returns}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Mock Footer */}
              <div className="mt-8 pt-4 text-center" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <p className="text-xs" style={{ color: colors.textTertiary }}>
                  This is a preview. The full report contains additional sections and detailed analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4 border-t"
            style={{ borderColor: colors.cardBorder }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                Size: {generatedReport.size}
              </span>
              <span className="text-sm" style={{ color: colors.textTertiary }}>|</span>
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                Format: {generatedReport.format}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <FAButton variant="secondary" onClick={() => setShowPreview(false)}>
                Close
              </FAButton>
              <FAButton
                className="flex items-center gap-2"
                onClick={() => {
                  alert('Report downloaded successfully!')
                  setShowPreview(false)
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </FAButton>
              <FAButton
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => alert('Email sent to client!')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </FAButton>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdvisorLayout title="Reports">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Generate and manage client reports
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['generate', 'recent', 'scheduled', 'deep-analysis'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeTab === tab
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: activeTab === tab ? 'white' : colors.textSecondary,
                boxShadow: activeTab === tab ? `0 4px 14px ${colors.glassShadow}` : 'none'
              }}
            >
              {tab === 'generate' ? 'Generate Report' : tab === 'recent' ? 'Recent Reports' : tab === 'scheduled' ? 'Scheduled' : 'Deep Analysis'}
            </button>
          ))}
        </div>

        {/* Generate Report Tab */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2">
              <FACard className="mb-6">
                <FASectionHeader title="Generate New Report" />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <FASelect
                    label="Client"
                    options={[
                      { value: '', label: 'Select client...' },
                      ...MOCK_CLIENTS.map(c => ({ value: c.id, label: c.name })),
                    ]}
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  />
                  <FASelect
                    label="Report Type"
                    options={[
                      { value: '', label: 'Select report type...' },
                      ...REPORT_TYPES.map(t => ({ value: t.id, label: t.name })),
                    ]}
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                  />
                  <FAInput
                    label="From Date"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                  <FAInput
                    label="To Date"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
                    Format
                  </label>
                  <div className="flex gap-3">
                    {(['PDF', 'Excel', 'CSV'] as ReportFormat[]).map(format => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setSelectedFormat(format)}
                        className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: selectedFormat === format
                            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                            : colors.chipBg,
                          color: selectedFormat === format ? '#FFFFFF' : colors.textPrimary,
                          border: `1px solid ${selectedFormat === format ? 'transparent' : colors.cardBorder}`,
                        }}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <FAButton
                    onClick={generateReport}
                    disabled={!selectedClient || !selectedReport || isGenerating}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <FASpinner size="sm" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generate & Preview
                      </>
                    )}
                  </FAButton>
                </div>
              </FACard>

              {/* Report Types Grid */}
              <FASectionHeader title="Available Reports" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                {REPORT_TYPES.map(type => (
                  <div
                    key={type.id}
                    className="p-3 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
                    onClick={() => setSelectedReport(type.id)}
                    style={{
                      background: colors[type.pastel as keyof typeof colors],
                      border: selectedReport === type.id ? `2px solid ${type.iconColor}` : `1px solid ${colors.cardBorder}`,
                      boxShadow: `0 4px 20px ${colors.glassShadow}`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${type.iconColor}15` }}
                      >
                        <svg className="w-5 h-5" style={{ color: type.iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={type.icon} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm" style={{ color: colors.textPrimary }}>{type.name}</h3>
                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Sidebar */}
            <div>
              <FACard className="sticky top-24">
                <FASectionHeader title="Report Statistics" />
                <div className="space-y-3 mt-4">
                  {[
                    { label: 'Reports Generated', value: '156', period: 'This month' },
                    { label: 'Scheduled Reports', value: '12', period: 'Active' },
                    { label: 'Storage Used', value: '2.4 GB', period: 'Total' },
                    { label: 'Avg Generation Time', value: '8s', period: 'Per report' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: colors.chipBg }}>
                      <div>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>{stat.label}</p>
                        <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{stat.value}</p>
                      </div>
                      <FAChip color={colors.primary}>{stat.period}</FAChip>
                    </div>
                  ))}
                </div>
              </FACard>
            </div>
          </div>
        )}

        {/* Recent Reports Tab */}
        {activeTab === 'recent' && (
          <FACard className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: colors.chipBg }}>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Report Name</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Client</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Generated</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Size</th>
                  <th className="text-center p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Format</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_REPORTS.map((report, i) => (
                  <tr key={report.id} style={{ borderTop: i > 0 ? `1px solid ${colors.cardBorder}` : undefined }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.chipBg }}>
                          <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={getReportIcon(report.type)} />
                          </svg>
                        </div>
                        <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>{report.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>{report.client}</td>
                    <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>
                      {new Date(report.generatedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-sm text-right" style={{ color: colors.textSecondary }}>{report.size}</td>
                    <td className="p-4 text-center">
                      <FAChip color={colors.primary}>{report.format}</FAChip>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => alert('Downloading report...')}
                          className="p-2 rounded-lg transition-all hover:scale-105"
                          style={{ background: colors.chipBg, color: colors.primary }}
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => alert('Email sent!')}
                          className="p-2 rounded-lg transition-all hover:scale-105"
                          style={{ background: colors.chipBg, color: colors.primary }}
                          title="Email"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {MOCK_REPORTS.length === 0 && (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="No reports generated yet"
                description="Generate your first report from the Generate tab"
              />
            )}
          </FACard>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <FAButton className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Schedule New Report
              </FAButton>
            </div>

            <div className="space-y-3">
              {MOCK_SCHEDULED.map(report => (
                <FATintedCard key={report.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: colors.chipBg }}>
                        <svg className="w-6 h-6" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={getReportIcon(report.type)} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{report.name}</h3>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {report.clients === 'all' ? 'All Clients' : `${(report.clients as string[]).length} Clients`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Frequency</p>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{report.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Next Run</p>
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{report.nextRun}</p>
                      </div>
                      <FAChip color={colors.success}>{report.status}</FAChip>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 rounded-lg transition-all hover:scale-105"
                          style={{ background: colors.chipBg, color: colors.primary }}
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded-lg transition-all hover:scale-105"
                          style={{ background: colors.chipBg, color: colors.error }}
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </FATintedCard>
              ))}
            </div>

            {MOCK_SCHEDULED.length === 0 && (
              <FACard>
                <FAEmptyState
                  icon={
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  title="No scheduled reports"
                  description="Schedule automatic report generation"
                />
              </FACard>
            )}
          </div>
        )}
        {/* Deep Analysis Tab */}
        {activeTab === 'deep-analysis' && (
          <FACard className="overflow-hidden">
            {loadingAnalyses ? (
              <div className="flex justify-center py-12">
                <FASpinner />
              </div>
            ) : savedAnalyses.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                }
                title="No saved analyses"
                description="Generate a deep analysis from the Analysis page and save it to see it here"
              />
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: colors.chipBg }}>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Title</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Status</th>
                    <th className="text-center p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Versions</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Updated</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {savedAnalyses.map((analysis, i) => (
                    <tr key={analysis.id} style={{ borderTop: i > 0 ? `1px solid ${colors.cardBorder}` : undefined }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.chipBg }}>
                            <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>{analysis.title}</span>
                            {analysis.clientName && (
                              <p className="text-xs" style={{ color: colors.textTertiary }}>{analysis.clientName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <FAChip color={statusColor(analysis.status)}>{analysis.status}</FAChip>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>v{analysis.latestVersion}</span>
                      </td>
                      <td className="p-4 text-sm" style={{ color: colors.textSecondary }}>
                        {new Date(analysis.updatedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => router.push(`/advisor/analysis?id=${analysis.id}`)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                              color: '#fff',
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadAnalysisPdf(analysis.id, analysis.latestVersion)}
                            className="p-2 rounded-lg transition-all hover:scale-105"
                            style={{ background: colors.chipBg, color: colors.primary }}
                            title="Download PDF"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            className="p-2 rounded-lg transition-all hover:scale-105"
                            style={{ background: colors.chipBg, color: colors.error }}
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </FACard>
        )}
      </div>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </AdvisorLayout>
  )
}

export default ReportsPage
