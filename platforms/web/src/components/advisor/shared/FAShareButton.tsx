import { useState } from 'react'
import { useFATheme } from '@/utils/fa'
import ShareModal from '@/components/advisor/ShareModal'

interface FAShareButtonProps {
  clientId: string
  clientName: string
  templateType?: string
  contextData?: Record<string, any>
  label?: string
  size?: 'sm' | 'md'
}

export function FAShareButton({
  clientId,
  clientName,
  templateType,
  contextData,
  label,
  size = 'sm',
}: FAShareButtonProps) {
  const { colors } = useFATheme()
  const [showModal, setShowModal] = useState(false)

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const padding = size === 'sm' ? 'p-1.5' : 'p-2'

  return (
    <>
      {label ? (
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-sm"
          style={{
            background: `${colors.primary}10`,
            color: colors.primary,
            border: `1px solid ${colors.primary}20`,
          }}
          title="Share with client"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          {label}
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className={`${padding} rounded-lg transition-all hover:shadow-sm`}
          style={{ color: colors.primary, background: `${colors.primary}08` }}
          title="Share with client"
        >
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        </button>
      )}

      {showModal && (
        <ShareModal
          clientId={clientId}
          clientName={clientName}
          defaultType={templateType}
          contextData={contextData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
