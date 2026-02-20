import { useState, useRef, useCallback, useEffect } from 'react'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { casApi, CASImportResult } from '@/services/api'

interface CASUploadFormProps {
  clientId?: string
  clientPan?: string
  clientDob?: string  // ISO date string (YYYY-MM-DD)
  onSuccess?: (result: CASImportResult) => void
}

export default function CASUploadForm({ clientId, clientPan, clientDob, onSuccess }: CASUploadFormProps) {
  const { colors, isDark } = useFATheme()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CASImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-fill password from PAN + DOB
  useEffect(() => {
    if (clientPan && clientDob) {
      const dob = new Date(clientDob)
      if (!isNaN(dob.getTime())) {
        const dd = String(dob.getDate()).padStart(2, '0')
        const mm = String(dob.getMonth() + 1).padStart(2, '0')
        const yyyy = dob.getFullYear()
        setPassword(`${clientPan}${dd}${mm}${yyyy}`)
      }
    }
  }, [clientPan, clientDob])

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleSubmit = async () => {
    if (!file || !password) return

    setUploading(true)
    setError(null)

    try {
      const res = await casApi.importCAS(file, password, clientId)
      setResult(res)
      onSuccess?.(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPassword('')
    setError(null)
    setResult(null)
  }

  if (result) {
    return (
      <div className="space-y-4">
        {/* Success Card */}
        <div className="p-5 rounded-2xl" style={{
          background: `linear-gradient(135deg, ${colors.success}08 0%, ${colors.success}03 100%)`,
          border: `1px solid ${isDark ? `${colors.success}30` : `${colors.success}20`}`,
        }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.success}15` }}>
              <svg className="w-5 h-5" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>Import Successful</p>
              {result.investorName && (
                <p className="text-sm" style={{ color: colors.textSecondary }}>{result.investorName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>Folios</p>
              <p className="text-lg font-bold" style={{ color: colors.primary }}>{result.foliosImported}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>Schemes</p>
              <p className="text-lg font-bold" style={{ color: colors.primary }}>{result.schemesImported}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>Value</p>
              <p className="text-lg font-bold" style={{ color: colors.success }}>
                {result.totalValue ? formatCurrency(result.totalValue) : '--'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="w-full py-2.5 rounded-full font-semibold text-sm transition-all hover:shadow-lg"
          style={{
            background: colors.chipBg,
            color: colors.primary,
            border: `1px solid ${colors.chipBorder}`,
          }}
        >
          Import Another CAS
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
          CAS PDF File
        </label>
        <div
          className="p-6 rounded-xl text-center cursor-pointer transition-all"
          style={{
            background: dragOver ? `${colors.primary}08` : colors.inputBg,
            border: `2px dashed ${dragOver ? colors.primary : colors.inputBorder}`,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
                <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{file.name}</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: `${colors.error}12` }}
              >
                <svg className="w-4 h-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${colors.primary}08` }}>
                <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
                Drop your CAS PDF here or click to browse
              </p>
              <p className="text-xs" style={{ color: colors.textTertiary }}>
                PDF up to 10MB from CAMS or KFintech
              </p>
            </>
          )}
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
          CAS Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="PAN + Date of Birth (e.g. ABCDE1234F01011990)"
          className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
          }}
        />
        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          Typically your PAN number followed by date of birth in DDMMYYYY format
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl" style={{
          background: `${colors.error}08`,
          border: `1px solid ${isDark ? `${colors.error}30` : `${colors.error}20`}`,
        }}>
          <p className="text-sm" style={{ color: colors.error }}>{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!file || !password || uploading}
        className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          boxShadow: `0 4px 14px ${colors.glassShadow}`,
        }}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Importing Portfolio...
          </span>
        ) : (
          'Import Portfolio'
        )}
      </button>
    </div>
  )
}
