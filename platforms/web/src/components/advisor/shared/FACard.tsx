/**
 * FA Portal Card Components
 *
 * Reusable card components with consistent styling for the FA portal.
 * Import with: import { FACard, FAGlassCard, FAStatCard } from '@/components/advisor/shared/FACard'
 */

import { ReactNode, CSSProperties } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FAColorPalette } from '@/utils/faColors'

interface BaseCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

/**
 * Base Glass Card - Main container card with glass morphism effect
 */
export const FACard = ({
  children,
  className = '',
  style,
  onClick,
  padding = 'md',
  hover = false,
}: BaseCardProps & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}) => {
  const { isDark, colors } = useFATheme()

  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[padding]

  const hoverClass = hover ? 'transition-all hover:-translate-y-0.5 cursor-pointer' : ''

  return (
    <div
      className={`rounded-lg ${paddingClass} ${hoverClass} ${className}`}
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 1px 3px ${colors.glassShadow}`,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/**
 * Tinted Card - Card with subtle gradient background
 * Use for list items, clickable cards
 * Supports optional left accent border for semantic meaning
 */
export const FATintedCard = ({
  children,
  className = '',
  style,
  onClick,
  padding = 'md',
  accentColor,
  hover = true,
}: BaseCardProps & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accentColor?: string
  hover?: boolean
}) => {
  const { isDark, colors } = useFATheme()

  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[padding]

  const hoverClass = hover ? 'transition-colors cursor-pointer' : ''

  const bg = isDark
    ? 'rgba(147, 197, 253, 0.04)'
    : 'rgba(59, 130, 246, 0.02)'

  return (
    <div
      className={`rounded-lg ${hoverClass} ${paddingClass} ${className}`}
      style={{
        background: bg,
        border: `1px solid ${colors.cardBorder}`,
        borderLeft: accentColor ? `3px solid ${accentColor}` : `1px solid ${colors.cardBorder}`,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/**
 * Info Tile - Card with left border accent for semantic meaning
 * Use for info/success/warning/error tiles
 * Design system pattern: borderLeft: 4px solid ${accentColor}
 */
export const FAInfoTile = ({
  children,
  className = '',
  style,
  accentColor,
  padding = 'md',
  variant = 'info',
}: BaseCardProps & {
  accentColor?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'info' | 'success' | 'warning' | 'error'
}) => {
  const { isDark, colors } = useFATheme()

  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[padding]

  // Get accent color based on variant or use provided color
  const getAccentColor = () => {
    if (accentColor) return accentColor
    switch (variant) {
      case 'success': return colors.success
      case 'warning': return colors.warning
      case 'error': return colors.error
      case 'info':
      default: return colors.primary
    }
  }

  const accent = getAccentColor()

  return (
    <div
      className={`rounded-lg ${paddingClass} ${className}`}
      style={{
        background: colors.cardBackground,
        border: `1px solid ${isDark ? `${accent}20` : `${accent}15`}`,
        borderLeft: `3px solid ${accent}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Stat Card - For KPI/metric display
 */
export const FAStatCard = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  accentColor,
  className = '',
}: {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
  accentColor?: string
  className?: string
}) => {
  const { isDark, colors } = useFATheme()

  const changeColor = {
    positive: colors.success,
    negative: colors.error,
    neutral: colors.textTertiary,
  }[changeType]

  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        borderLeft: accentColor ? `3px solid ${accentColor}` : `1px solid ${colors.cardBorder}`,
        boxShadow: `0 1px 3px ${colors.glassShadow}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: colors.primary }}
          >
            {label}
          </p>
          <p className="text-xl font-bold mt-1" style={{ color: colors.textPrimary }}>
            {value}
          </p>
          {change && (
            <p className="text-xs mt-1" style={{ color: changeColor }}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: colors.chipBg }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Section Header - Consistent section title styling
 */
export const FASectionHeader = ({
  title,
  action,
  className = '',
}: {
  title: string
  action?: ReactNode
  className?: string
}) => {
  const { colors } = useFATheme()

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h2
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: colors.primary }}
      >
        {title}
      </h2>
      {action}
    </div>
  )
}

/**
 * Chip/Badge component
 */
export const FAChip = ({
  children,
  color,
  variant = 'filled',
  size = 'sm',
  className = '',
}: {
  children: ReactNode
  color?: string
  variant?: 'filled' | 'outlined'
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) => {
  const { colors } = useFATheme()
  const chipColor = color || colors.primary

  const sizeClass = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }[size]

  const variantStyle =
    variant === 'filled'
      ? {
          background: `${chipColor}15`,
          color: chipColor,
          border: `1px solid ${chipColor}30`,
        }
      : {
          background: 'transparent',
          color: chipColor,
          border: `1px solid ${chipColor}`,
        }

  return (
    <span className={`rounded-full font-medium ${sizeClass} ${className}`} style={variantStyle}>
      {children}
    </span>
  )
}

/**
 * Icon Container - Consistent icon wrapper
 */
export const FAIconContainer = ({
  children,
  color,
  size = 'md',
  className = '',
}: {
  children: ReactNode
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) => {
  const { colors } = useFATheme()
  const iconColor = color || colors.primary

  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size]

  return (
    <div
      className={`rounded-lg flex items-center justify-center ${sizeClass} ${className}`}
      style={{ background: `${iconColor}15` }}
    >
      {children}
    </div>
  )
}

/**
 * Empty State component
 */
export const FAEmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) => {
  const { colors } = useFATheme()

  return (
    <div className="text-center py-12" style={{ color: colors.textSecondary }}>
      {icon && <div className="w-12 h-12 mx-auto mb-4 opacity-50">{icon}</div>}
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-sm mt-1" style={{ color: colors.textTertiary }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Loading Spinner
 */
export const FASpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const { colors } = useFATheme()

  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size]

  return (
    <svg
      className={`animate-spin ${sizeClass}`}
      style={{ color: colors.primary }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Loading State component
 */
export const FALoadingState = ({ message = 'Loading...' }: { message?: string }) => {
  const { colors } = useFATheme()

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <FASpinner size="lg" />
      <p className="mt-4" style={{ color: colors.textSecondary }}>
        {message}
      </p>
    </div>
  )
}

export default FACard
