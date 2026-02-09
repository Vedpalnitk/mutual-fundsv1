import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, ReactNode } from 'react'
import { useTheme } from '@/context/ThemeContext'
import NotificationCenter from '@/components/advisor/NotificationCenter'
import { FANotificationProvider } from '@/components/advisor/shared/FANotification'
import { getAuthToken, clearAuthToken } from '@/services/api'

// FA Portal color palette - Main Design (Blue/Cyan)
const COLORS_LIGHT = {
  // Primary Blue
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryDeep: '#1D4ED8',
  accent: '#60A5FA',

  // Secondary Cyan
  secondary: '#38BDF8',
  secondaryDark: '#0EA5E9',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  sidebarBg: 'rgba(255, 255, 255, 0.85)',
  cardBg: 'rgba(255, 255, 255, 0.9)',

  // Glass (Subtle)
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(59, 130, 246, 0.1)',
  glassShadow: 'rgba(59, 130, 246, 0.06)',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Borders & Effects
  separator: 'rgba(59, 130, 246, 0.1)',

  // States
  hoverBg: 'rgba(59, 130, 246, 0.08)',
  activeBg: 'rgba(59, 130, 246, 0.15)',

  // Cards
  cardBorder: 'rgba(59, 130, 246, 0.08)',
  cardGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(56, 189, 248, 0.01) 100%)',

  // Inputs
  inputBg: 'rgba(59, 130, 246, 0.02)',
  inputBorder: 'rgba(59, 130, 246, 0.1)',

  // Chips/Badges
  chipBg: 'rgba(59, 130, 246, 0.04)',
  chipBorder: 'rgba(59, 130, 246, 0.1)',
}

const COLORS_DARK = {
  // Primary Blue (Soft for dark mode)
  primary: '#93C5FD',
  primaryDark: '#60A5FA',
  primaryDeep: '#3B82F6',
  accent: '#BFDBFE',

  // Secondary Cyan
  secondary: '#7DD3FC',
  secondaryDark: '#38BDF8',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  // Backgrounds - Deep navy
  background: '#0B1120',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  sidebarBg: 'rgba(17, 24, 39, 0.85)',
  cardBg: 'rgba(17, 24, 39, 0.65)',

  // Glass (Subtle)
  glassBackground: 'rgba(17, 24, 39, 0.85)',
  glassBorder: 'rgba(147, 197, 253, 0.1)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textTertiary: '#94A3B8',

  // Borders & Effects
  separator: 'rgba(147, 197, 253, 0.1)',

  // States
  hoverBg: 'rgba(147, 197, 253, 0.1)',
  activeBg: 'rgba(147, 197, 253, 0.2)',

  // Cards
  cardBorder: 'rgba(147, 197, 253, 0.12)',
  cardGradient: 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(125, 211, 252, 0.03) 100%)',

  // Inputs
  inputBg: 'rgba(147, 197, 253, 0.04)',
  inputBorder: 'rgba(147, 197, 253, 0.12)',

  // Chips/Badges
  chipBg: 'rgba(147, 197, 253, 0.06)',
  chipBorder: 'rgba(147, 197, 253, 0.12)',
}

// Navigation items for Financial Advisor
const ADVISOR_NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/advisor/dashboard', icon: 'home' },
    ]
  },
  {
    section: 'Client Management',
    items: [
      { label: 'Clients', href: '/advisor/clients', icon: 'users' },
      { label: 'Prospects', href: '/advisor/prospects', icon: 'user-plus' },
      { label: 'Transactions', href: '/advisor/transactions', icon: 'arrows' },
      { label: 'Insights', href: '/advisor/insights', icon: 'insights' },
    ]
  },
  {
    section: 'Research',
    items: [
      { label: 'Funds', href: '/advisor/funds', icon: 'trending-up' },
      { label: 'Compare', href: '/advisor/compare', icon: 'scale' },
      { label: 'Analysis', href: '/advisor/analysis', icon: 'chart' },
      { label: 'Reports', href: '/advisor/reports', icon: 'document' },
    ]
  },
]

// Icon component
const NavIcon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    'home': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    'users': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    'user-plus': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
    'arrows': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    'insights': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    'trending-up': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    'chart': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    'document': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    'scale': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
    'chevron-left': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    ),
    'chevron-right': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    ),
    'sun': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    'moon': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ),
  }
  return icons[name] || null
}

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

interface AdvisorLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdvisorLayout({ children, title }: AdvisorLayoutProps) {
  const router = useRouter()
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = useDarkMode()
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT
  const [collapsed, setCollapsed] = useState(false)
  const [hasToken, setHasToken] = useState(true) // Assume true initially to avoid flash

  // Auth check - redirect to login if no token
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setHasToken(false)
      window.location.href = '/advisor/login'
    }
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    window.location.href = '/advisor/login'
  }

  // Don't render anything while redirecting
  if (!hasToken) {
    return null
  }

  const isActiveLink = (href: string) => {
    return router.pathname === href || router.asPath.startsWith(href + '?')
  }

  return (
    <FANotificationProvider>
    <div className="min-h-screen flex" style={{ background: colors.background }}>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        style={{
          background: colors.sidebarBg,
          backdropFilter: 'blur(50px) saturate(180%)',
          WebkitBackdropFilter: 'blur(50px) saturate(180%)',
          borderRight: `0.5px solid ${colors.glassBorder}`,
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-4"
          style={{ borderBottom: `0.5px solid ${colors.separator}` }}
        >
          <Link href="/advisor/dashboard" className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" d="M17 5H9a4 4 0 000 8h6a4 4 0 010 8H7"/>
              </svg>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  Sparrow
                </p>
                <p className="text-xs font-medium" style={{ color: colors.primary }}>
                  Financial Advisor
                </p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
          >
            <NavIcon name={collapsed ? 'chevron-right' : 'chevron-left'} className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {ADVISOR_NAV_ITEMS.map((section, idx) => (
            <div key={section.section} className={idx > 0 ? 'mt-6' : ''}>
              {!collapsed && (
                <p
                  className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: colors.textTertiary }}
                >
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isActiveLink(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        collapsed ? 'justify-center' : ''
                      }`}
                      style={{
                        background: isActive ? colors.activeBg : 'transparent',
                        color: isActive ? colors.primary : colors.textSecondary,
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <NavIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div
          className="p-4"
          style={{ borderTop: `0.5px solid ${colors.separator}` }}
        >
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
            style={{
              background: colors.hoverBg,
              color: colors.textSecondary,
            }}
          >
            <NavIcon name={isDark ? 'sun' : 'moon'} className="w-5 h-5" />
            {!collapsed && (
              <span className="text-sm font-medium">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-8"
          style={{
            background: colors.sidebarBg,
            backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
            borderBottom: `0.5px solid ${colors.glassBorder}`,
          }}
        >
          <div>
            {title && (
              <h1 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Client count badge */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: colors.chipBg,
                border: `1px solid ${colors.chipBorder}`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: colors.success }}
              />
              <span className="text-xs font-medium" style={{ color: colors.primary }}>
                12 Active Clients
              </span>
            </div>
            {/* Notification Center */}
            <NotificationCenter colors={colors} />
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-lg hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: '#FFFFFF',
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
    </FANotificationProvider>
  )
}

// Export colors for use in pages
export { COLORS_LIGHT, COLORS_DARK, useDarkMode }
export type { AdvisorLayoutProps }
