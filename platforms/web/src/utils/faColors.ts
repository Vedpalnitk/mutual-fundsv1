/**
 * FA Portal Color Palette - Main Design (Blue/Cyan)
 *
 * Unified with Admin portal for consistent branding.
 * Uses Blue/Cyan theme with clean white backgrounds.
 * Category colors remain vibrant for data visualization.
 */

export interface FAColorPalette {
  // Primary - Blue (Main Design)
  primary: string
  primaryDark: string
  primaryDeep: string
  primaryLight: string
  accent: string

  // Secondary - Cyan accent
  secondary: string
  secondaryDark: string

  // Semantic
  success: string
  warning: string
  error: string
  info: string

  // Category Colors (vibrant, distinct)
  equity: string
  debt: string
  hybrid: string
  liquid: string
  gold: string
  international: string
  elss: string

  // Tile Colors (clean white/card backgrounds)
  pastelIndigo: string
  pastelPurple: string
  pastelPink: string
  pastelRose: string
  pastelMint: string
  pastelPeach: string
  pastelSky: string
  pastelBlue: string

  // Backgrounds
  background: string
  backgroundSecondary: string
  backgroundTertiary: string
  cardBackground: string
  cardBg: string // Alias for consistency
  sidebarBg: string

  // Glass
  glassBackground: string
  glassBorder: string
  glassShadow: string

  // Borders
  cardBorder: string
  inputBorder: string
  separator: string
  chipBg: string
  chipBorder: string

  // States
  hoverBg: string
  activeBg: string

  // Text
  textPrimary: string
  textSecondary: string
  textTertiary: string

  // Inputs
  inputBg: string

  // Progress
  progressBg: string

  // Cards
  cardGradient: string

  // Gradients (as CSS strings)
  gradientPrimary: string
  gradientSuccess: string
  gradientWarning: string
}

export const FA_COLORS_LIGHT: FAColorPalette = {
  // Primary - Blue (Main Design)
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryDeep: '#1D4ED8',
  primaryLight: '#60A5FA',
  accent: '#60A5FA',

  // Secondary - Cyan
  secondary: '#38BDF8',
  secondaryDark: '#0EA5E9',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Category Colors - Vibrant & Distinct (for data viz)
  equity: '#3B82F6',     // Bright Blue
  debt: '#10B981',       // Emerald Green
  hybrid: '#8B5CF6',     // Purple
  liquid: '#06B6D4',     // Cyan
  gold: '#F59E0B',       // Amber
  international: '#3B82F6', // Blue
  elss: '#EC4899',       // Pink

  // Tile Colors - Clean white backgrounds
  pastelIndigo: '#FFFFFF',
  pastelPurple: '#FFFFFF',
  pastelPink: '#FFFFFF',
  pastelRose: '#FFFFFF',
  pastelMint: '#FFFFFF',
  pastelPeach: '#FFFFFF',
  pastelSky: '#FFFFFF',
  pastelBlue: '#FFFFFF',

  // Backgrounds - Clean whites
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  cardBackground: '#FFFFFF',
  cardBg: 'rgba(255, 255, 255, 0.9)',
  sidebarBg: 'rgba(255, 255, 255, 0.85)',

  // Glass
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(59, 130, 246, 0.1)',
  glassShadow: 'rgba(59, 130, 246, 0.06)',

  // Borders
  cardBorder: 'rgba(59, 130, 246, 0.08)',
  inputBorder: 'rgba(59, 130, 246, 0.12)',
  separator: 'rgba(59, 130, 246, 0.1)',
  chipBg: 'rgba(59, 130, 246, 0.04)',
  chipBorder: 'rgba(59, 130, 246, 0.1)',

  // States
  hoverBg: 'rgba(59, 130, 246, 0.08)',
  activeBg: 'rgba(59, 130, 246, 0.15)',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Inputs
  inputBg: 'rgba(59, 130, 246, 0.02)',

  // Progress
  progressBg: 'rgba(59, 130, 246, 0.08)',

  // Cards
  cardGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(56, 189, 248, 0.01) 100%)',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  gradientSuccess: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  gradientWarning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
}

export const FA_COLORS_DARK: FAColorPalette = {
  // Primary - Sky Blue for dark mode (Main Design)
  primary: '#93C5FD',
  primaryDark: '#60A5FA',
  primaryDeep: '#3B82F6',
  primaryLight: '#BFDBFE',
  accent: '#BFDBFE',

  // Secondary - Cyan
  secondary: '#7DD3FC',
  secondaryDark: '#38BDF8',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Category Colors - Vibrant (for dark mode)
  equity: '#60A5FA',     // Light Blue
  debt: '#34D399',       // Light Emerald
  hybrid: '#A78BFA',     // Light Purple
  liquid: '#22D3EE',     // Light Cyan
  gold: '#FBBF24',       // Light Amber
  international: '#60A5FA', // Light Blue
  elss: '#F472B6',       // Light Pink

  // Tile Colors - Clean card backgrounds
  pastelIndigo: '#111827',
  pastelPurple: '#111827',
  pastelPink: '#111827',
  pastelRose: '#111827',
  pastelMint: '#111827',
  pastelPeach: '#111827',
  pastelSky: '#111827',
  pastelBlue: '#111827',

  // Backgrounds - Deep navy blue
  background: '#0B1120',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  cardBackground: '#111827',
  cardBg: 'rgba(17, 24, 39, 0.65)',
  sidebarBg: 'rgba(17, 24, 39, 0.85)',

  // Glass
  glassBackground: 'rgba(17, 24, 39, 0.85)',
  glassBorder: 'rgba(147, 197, 253, 0.1)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',

  // Borders
  cardBorder: 'rgba(147, 197, 253, 0.12)',
  inputBorder: 'rgba(147, 197, 253, 0.15)',
  separator: 'rgba(147, 197, 253, 0.1)',
  chipBg: 'rgba(147, 197, 253, 0.06)',
  chipBorder: 'rgba(147, 197, 253, 0.12)',

  // States
  hoverBg: 'rgba(147, 197, 253, 0.1)',
  activeBg: 'rgba(147, 197, 253, 0.2)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textTertiary: '#94A3B8',

  // Inputs
  inputBg: 'rgba(147, 197, 253, 0.04)',

  // Progress
  progressBg: 'rgba(147, 197, 253, 0.12)',

  // Cards
  cardGradient: 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(125, 211, 252, 0.03) 100%)',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
  gradientSuccess: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
  gradientWarning: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
}

/**
 * Category color map for quick access
 */
export const CATEGORY_COLORS = {
  light: {
    equity: '#3B82F6',
    debt: '#10B981',
    hybrid: '#8B5CF6',
    liquid: '#06B6D4',
    gold: '#F59E0B',
    international: '#6366F1',
    elss: '#EC4899',
  },
  dark: {
    equity: '#60A5FA',
    debt: '#34D399',
    hybrid: '#A78BFA',
    liquid: '#22D3EE',
    gold: '#FBBF24',
    international: '#818CF8',
    elss: '#F472B6',
  }
}

/**
 * Risk profile colors
 */
export const getRiskColor = (risk: string, colors: FAColorPalette): string => {
  switch (risk) {
    case 'Conservative':
    case 'Low':
      return colors.success
    case 'Moderate':
    case 'Medium':
      return colors.info
    case 'Aggressive':
    case 'High':
      return colors.warning
    case 'Very High':
      return colors.error
    default:
      return colors.textSecondary
  }
}

/**
 * Transaction type colors
 */
export const getTransactionTypeColor = (type: string, colors: FAColorPalette): string => {
  switch (type) {
    case 'Buy':
    case 'Purchase':
      return colors.success
    case 'Sell':
    case 'Redeem':
      return colors.error
    case 'SIP':
      return colors.primary
    case 'SWP':
      return colors.warning
    case 'Switch':
    case 'STP':
      return colors.secondary
    default:
      return colors.textSecondary
  }
}

/**
 * Transaction status colors
 */
export const getStatusColor = (status: string, colors: FAColorPalette): string => {
  switch (status) {
    case 'Completed':
    case 'Success':
    case 'Active':
      return colors.success
    case 'Pending':
    case 'Awaiting':
      return colors.warning
    case 'Processing':
    case 'In Progress':
      return colors.info
    case 'Failed':
    case 'Rejected':
    case 'Cancelled':
      return colors.error
    case 'Paused':
      return colors.secondary
    default:
      return colors.textSecondary
  }
}

/**
 * Asset class colors - Now using dedicated category colors
 */
export const getAssetClassColor = (assetClass: string, colors: FAColorPalette): string => {
  switch (assetClass.toLowerCase()) {
    case 'equity':
      return colors.equity
    case 'debt':
      return colors.debt
    case 'hybrid':
      return colors.hybrid
    case 'liquid':
      return colors.liquid
    case 'gold':
      return colors.gold
    case 'international':
      return colors.international
    case 'elss':
      return colors.elss
    default:
      return colors.textTertiary
  }
}

/**
 * Severity/Alert colors
 */
export const getSeverityColor = (severity: string, colors: FAColorPalette): string => {
  switch (severity) {
    case 'success':
      return colors.success
    case 'warning':
      return colors.warning
    case 'error':
    case 'danger':
      return colors.error
    case 'info':
      return colors.info
    default:
      return colors.textSecondary
  }
}

/**
 * Prospect pipeline stage colors
 */
export const getStageColor = (stage: string, colors: FAColorPalette): string => {
  switch (stage) {
    case 'Discovery':
      return colors.textTertiary
    case 'Analysis':
      return colors.info
    case 'Proposal':
      return colors.primary
    case 'Negotiation':
      return colors.warning
    case 'Closed Won':
      return colors.success
    case 'Closed Lost':
      return colors.error
    default:
      return colors.textSecondary
  }
}

/**
 * Goal status colors
 */
export const getGoalStatusColor = (onTrack: boolean, colors: FAColorPalette): string => {
  return onTrack ? colors.success : colors.warning
}

/**
 * Risk rating info (1-5 scale)
 */
export const getRiskRatingInfo = (rating?: number): { label: string; color: string } => {
  switch (rating) {
    case 1:
      return { label: 'Low Risk', color: '#10B981' }
    case 2:
      return { label: 'Moderately Low', color: '#3B82F6' }
    case 3:
      return { label: 'Moderate', color: '#F59E0B' }
    case 4:
      return { label: 'Moderately High', color: '#F97316' }
    case 5:
      return { label: 'Very High Risk', color: '#EF4444' }
    default:
      return { label: 'Unknown', color: '#94A3B8' }
  }
}

/**
 * Get category badge style (background + text color)
 */
export const getCategoryBadgeStyle = (category: string, colors: FAColorPalette) => {
  const color = getAssetClassColor(category, colors)
  return {
    background: `${color}15`,
    color: color,
    border: `1px solid ${color}25`,
  }
}
