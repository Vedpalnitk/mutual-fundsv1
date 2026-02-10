import { useFATheme } from '@/utils/fa'

interface VersionInfo {
  versionNumber: number
  editNotes?: string
  createdAt: string
}

interface VersionSelectorProps {
  versions: VersionInfo[]
  currentVersion: number
  onSelect: (v: number) => void
  onDownloadPdf: (v: number) => void
}

const VersionSelector = ({ versions, currentVersion, onSelect, onDownloadPdf }: VersionSelectorProps) => {
  const { colors } = useFATheme()

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
        Version
      </span>
      <div className="flex gap-1.5">
        {versions
          .sort((a, b) => a.versionNumber - b.versionNumber)
          .map(v => (
            <button
              key={v.versionNumber}
              onClick={() => onSelect(v.versionNumber)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: currentVersion === v.versionNumber
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: currentVersion === v.versionNumber ? '#fff' : colors.textSecondary,
                border: `1px solid ${currentVersion === v.versionNumber ? 'transparent' : colors.cardBorder}`,
              }}
              title={v.editNotes || `Version ${v.versionNumber}`}
            >
              v{v.versionNumber}
            </button>
          ))}
      </div>
      <button
        onClick={() => onDownloadPdf(currentVersion)}
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md"
        style={{
          background: colors.chipBg,
          color: colors.primary,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PDF
      </button>
    </div>
  )
}

export default VersionSelector
