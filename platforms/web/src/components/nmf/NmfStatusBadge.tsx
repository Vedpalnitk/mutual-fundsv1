import { useFATheme } from '@/utils/fa'

interface NmfStatusBadgeProps {
  status: string
  type?: 'order' | 'mandate' | 'systematic' | 'payment'
  size?: 'sm' | 'md'
}

type ColorConfig = { bg: string; dot: string; text: string }

const COLOR_MAP: Record<string, ColorConfig> = {
  // Yellows
  yellow: { bg: 'rgba(245, 158, 11, 0.1)', dot: '#F59E0B', text: '#F59E0B' },
  // Oranges
  orange: { bg: 'rgba(249, 115, 22, 0.1)', dot: '#F97316', text: '#F97316' },
  // Blues
  blue: { bg: 'rgba(59, 130, 246, 0.1)', dot: '#3B82F6', text: '#3B82F6' },
  // Purples
  purple: { bg: 'rgba(139, 92, 246, 0.1)', dot: '#8B5CF6', text: '#8B5CF6' },
  // Teals
  teal: { bg: 'rgba(20, 184, 166, 0.1)', dot: '#14B8A6', text: '#14B8A6' },
  // Greens
  green: { bg: 'rgba(16, 185, 129, 0.1)', dot: '#10B981', text: '#10B981' },
  // Reds
  red: { bg: 'rgba(239, 68, 68, 0.1)', dot: '#EF4444', text: '#EF4444' },
  // Grays
  gray: { bg: 'rgba(107, 114, 128, 0.1)', dot: '#6B7280', text: '#6B7280' },
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PLACED: 'yellow',
  TWO_FA_PENDING: 'orange',
  AUTH_PENDING: 'orange',
  PAYMENT_PENDING: 'blue',
  PAYMENT_CONFIRMATION_PENDING: 'blue',
  PENDING_RTA: 'purple',
  VALIDATED_RTA: 'teal',
  ALLOTMENT_DONE: 'green',
  UNITS_TRANSFERRED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  FAILED: 'red',
  SUBMITTED: 'yellow',
}

const MANDATE_STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  PENDING_AUTH: 'orange',
}

const SYSTEMATIC_STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'yellow',
  REGISTERED: 'green',
  ACTIVE: 'green',
  PAUSED: 'orange',
  CANCELLED: 'gray',
  EXPIRED: 'gray',
  FAILED: 'red',
  PENDING_AUTH: 'orange',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  INITIATED: 'yellow',
  PENDING: 'blue',
  SUCCESS: 'green',
  FAILED: 'red',
}

const STATUS_MAP: Record<string, Record<string, string>> = {
  order: ORDER_STATUS_COLORS,
  mandate: MANDATE_STATUS_COLORS,
  systematic: SYSTEMATIC_STATUS_COLORS,
  payment: PAYMENT_STATUS_COLORS,
}

const formatStatusText = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

const resolveColor = (status: string, type?: string): ColorConfig => {
  const normalized = status?.toUpperCase() || ''
  const fallback = COLOR_MAP.gray

  if (type && STATUS_MAP[type]) {
    const colorName = STATUS_MAP[type][normalized]
    if (colorName && COLOR_MAP[colorName]) return COLOR_MAP[colorName]
  }

  // Try all maps as fallback
  for (const map of Object.values(STATUS_MAP)) {
    const colorName = map[normalized]
    if (colorName && COLOR_MAP[colorName]) return COLOR_MAP[colorName]
  }

  return fallback
}

export default function NmfStatusBadge({ status, type, size = 'sm' }: NmfStatusBadgeProps) {
  const { colors } = useFATheme()
  const colorConfig = resolveColor(status, type)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'
      }`}
      style={{
        background: colorConfig.bg,
        color: colorConfig.text,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <span
        className={`rounded-full flex-shrink-0 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ background: colorConfig.dot }}
      />
      {formatStatusText(status || 'Unknown')}
    </span>
  )
}
