import { useState, useRef } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FAButton } from '@/components/advisor/shared/FAForm'
import { bulkImportApi, BulkImportResult } from '@/services/api'
import type { OnboardingImportStatus } from '@/services/api'

interface Props {
  onComplete: (data?: any) => Promise<void>
  onSkip: () => Promise<void>
  loading: boolean
  importStatus: OnboardingImportStatus | undefined
}

type ImportType = 'cams-wbr' | 'kfintech-mis'

export default function ImportBookStep({ onComplete, onSkip, loading, importStatus }: Props) {
  const { isDark, colors } = useFATheme()
  const camsRef = useRef<HTMLInputElement>(null)
  const kfinRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState<ImportType | null>(null)
  const [results, setResults] = useState<Record<string, BulkImportResult>>({})
  const [error, setError] = useState<string | null>(null)
  const [skipping, setSkipping] = useState(false)

  const camsUploaded = importStatus?.camsWbrUploaded || !!results['cams-wbr']
  const kfinUploaded = importStatus?.kfintechMisUploaded || !!results['kfintech-mis']

  const handleUpload = async (type: ImportType, file: File) => {
    setUploading(type)
    setError(null)
    try {
      const result = type === 'cams-wbr'
        ? await bulkImportApi.uploadCamsWbr(file)
        : await bulkImportApi.uploadKfintechMis(file)
      setResults(prev => ({ ...prev, [type]: result }))
    } catch (err) {
      setError(`${type === 'cams-wbr' ? 'CAMS WBR' : 'KFintech MIS'} upload failed: ${(err as Error).message}`)
    } finally {
      setUploading(null)
    }
  }

  const handleFileSelect = (type: ImportType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(type, file)
    e.target.value = '' // reset for re-upload
  }

  const handleContinue = async () => {
    await onComplete({ camsUploaded, kfinUploaded })
  }

  const handleSkip = async () => {
    setSkipping(true)
    try {
      await onSkip()
    } finally {
      setSkipping(false)
    }
  }

  const FileCard = ({ type, label, description, uploaded, result }: {
    type: ImportType
    label: string
    description: string
    uploaded: boolean
    result?: BulkImportResult
  }) => (
    <div
      className="p-4 rounded-xl"
      style={{
        background: uploaded ? `${colors.success}06` : colors.cardBackground,
        border: `1px solid ${uploaded ? colors.success + '25' : colors.cardBorder}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{label}</h3>
            {uploaded && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${colors.success}15`, color: colors.success }}
              >
                Uploaded
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{description}</p>
        </div>

        <FAButton
          size="sm"
          variant={uploaded ? 'secondary' : 'primary'}
          onClick={() => type === 'cams-wbr' ? camsRef.current?.click() : kfinRef.current?.click()}
          loading={uploading === type}
          disabled={!!uploading}
        >
          {uploaded ? 'Re-upload' : 'Upload'}
        </FAButton>
      </div>

      {/* Result summary */}
      {result && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
          <div className="flex gap-4 text-xs">
            <span style={{ color: colors.textSecondary }}>
              <strong style={{ color: colors.textPrimary }}>{result.importedClients}</strong> clients
            </span>
            <span style={{ color: colors.textSecondary }}>
              <strong style={{ color: colors.textPrimary }}>{result.importedHoldings}</strong> holdings
            </span>
            {result.skippedRecords > 0 && (
              <span style={{ color: colors.warning }}>
                {result.skippedRecords} skipped
              </span>
            )}
            {result.errorRecords > 0 && (
              <span style={{ color: colors.error }}>
                {result.errorRecords} errors
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            Import Your Client Book
          </h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: colors.chipBg, color: colors.textTertiary, border: `1px solid ${colors.chipBorder}` }}
          >
            Optional
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Upload RTA reports to automatically import your existing clients and their holdings.
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={camsRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect('cams-wbr')}
      />
      <input
        ref={kfinRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect('kfintech-mis')}
      />

      <div className="space-y-3">
        <FileCard
          type="cams-wbr"
          label="CAMS WBR Report"
          description="Whole Book Report from CAMS (.csv or .xlsx)"
          uploaded={camsUploaded}
          result={results['cams-wbr']}
        />
        <FileCard
          type="kfintech-mis"
          label="KFintech MIS Report"
          description="MIS Report from KFintech/KFIN (.csv or .xlsx)"
          uploaded={kfinUploaded}
          result={results['kfintech-mis']}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: colors.error }}>{error}</p>
      )}

      {/* Info */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: `${colors.primary}08`,
          border: `1px solid ${colors.primary}15`,
        }}
      >
        <div className="flex gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              Supported formats
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              CSV and Excel files (.csv, .xlsx, .xls). You can also upload CAS PDFs later from the CAS Imports page.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <FAButton variant="ghost" onClick={handleSkip} loading={skipping}>
          Skip for Now
        </FAButton>
        <FAButton
          onClick={handleContinue}
          loading={loading}
          disabled={!camsUploaded && !kfinUploaded}
        >
          Continue
        </FAButton>
      </div>
    </div>
  )
}
