import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, ReactNode } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { getAuthToken, clearAuthToken } from '@/services/api'
import NavIcon from './NavIcon'
import { useDarkMode } from '@/utils/faHooks'

/**
 * Admin Layout - "Cyan & Slate" Design System
 *
 * A clean, modern aesthetic with vibrant cyan primaries and cool slate tones.
 * Sharp, professional, and contemporary.
 */

// Cyan & Slate color palette
const COLORS_LIGHT = {
  // Primary - Cyan
  primary: '#06B6D4',
  primaryLight: '#22D3EE',
  accent: '#67E8F9',

  // Secondary - Teal
  secondary: '#14B8A6',

  // Backgrounds - Cool slate
  background: '#F8FAFC',
  sidebarBg: '#FFFFFF',
  cardBg: '#FFFFFF',

  // Text - Cool neutrals
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',

  // Borders & Effects
  separator: 'rgba(6, 182, 212, 0.08)',
  border: 'rgba(6, 182, 212, 0.12)',
  shadow: 'rgba(6, 182, 212, 0.06)',

  // States
  hoverBg: 'rgba(6, 182, 212, 0.06)',
  activeBg: 'rgba(6, 182, 212, 0.1)',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
}

const COLORS_DARK = {
  // Primary - Lifted Cyan
  primary: '#22D3EE',
  primaryLight: '#67E8F9',
  accent: '#A5F3FC',

  // Secondary - Lifted Teal
  secondary: '#2DD4BF',

  // Backgrounds - Cool dark slate
  background: '#0F172A',
  sidebarBg: '#1E293B',
  cardBg: '#1E293B',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',

  // Borders & Effects
  separator: 'rgba(34, 211, 238, 0.1)',
  border: 'rgba(34, 211, 238, 0.15)',
  shadow: 'rgba(0, 0, 0, 0.2)',

  // States
  hoverBg: 'rgba(34, 211, 238, 0.08)',
  activeBg: 'rgba(34, 211, 238, 0.12)',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
}

// Navigation items for Admin
const ADMIN_NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: 'grid' },
      { label: 'Analytics', href: '/admin/analytics', icon: 'chart-bar' },
      { label: 'Funds', href: '/admin/funds', icon: 'trending-up' },
    ]
  },
  {
    section: 'Machine Learning',
    items: [
      { label: 'ML Studio', href: '/admin/ml', icon: 'cpu' },
      { label: 'ML Config', href: '/admin/ml-config', icon: 'settings' },
      { label: 'Recommendations', href: '/admin/recommendations', icon: 'sparkles' },
    ]
  },
  {
    section: 'Operations',
    items: [
      { label: 'Advisors', href: '/admin/advisors', icon: 'briefcase' },
      { label: 'Transactions', href: '/admin/transactions', icon: 'arrows-exchange' },
      { label: 'Exchange Health', href: '/admin/exchange-health', icon: 'heartbeat' },
    ]
  },
  {
    section: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: 'user-circle' },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: 'scroll' },
      { label: 'Batch Jobs', href: '/admin/batch-jobs', icon: 'clock' },
      { label: 'Settings', href: '/admin/settings', icon: 'cog' },
    ]
  },
]

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter()
  const { toggleTheme } = useTheme()
  const isDark = useDarkMode()
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasToken, setHasToken] = useState(true)

  // Auth check - verify token exists AND user has admin role
  useEffect(() => {
    // Portal boundary check
    const appHost = process.env.NEXT_PUBLIC_APP_HOSTNAME?.split(':')[0] || ''
    if (appHost && window.location.hostname === appHost) {
      window.location.href = '/404'
      return
    }

    const token = getAuthToken()
    if (!token) {
      setHasToken(false)
      window.location.href = '/admin/login'
      return
    }
    // Decode JWT and check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'admin' && payload.role !== 'super_admin') {
        // Non-admin user — clear token and redirect to admin login
        clearAuthToken()
        setHasToken(false)
        window.location.href = '/admin/login'
      }
    } catch {
      clearAuthToken()
      setHasToken(false)
      window.location.href = '/admin/login'
    }
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    window.location.href = '/admin/login'
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [router.pathname])

  if (!hasToken) {
    return null
  }

  const isActiveLink = (href: string) => {
    return router.pathname === href || router.asPath.startsWith(href + '?')
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: colors.background,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-[260px] transition-all duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-40 ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
        `}
        style={{
          background: colors.sidebarBg,
          borderRight: `1px solid ${colors.border}`,
          boxShadow: isDark ? 'none' : '2px 0 20px rgba(6, 182, 212, 0.04)',
        }}
      >
        {/* Logo Area */}
        <div
          className="h-16 flex items-center justify-between px-5"
          style={{ borderBottom: `1px solid ${colors.separator}` }}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="Sparrow"
              className="w-10 h-10 rounded-xl flex-shrink-0"
              style={{
                boxShadow: `0 4px 12px ${colors.primary}30`,
                filter: isDark
                  ? 'hue-rotate(-30deg) brightness(1.3) saturate(1.1)'
                  : 'hue-rotate(-30deg)',
              }}
            />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
                  Sparrow
                </p>
                <p className="text-[11px] font-medium" style={{ color: colors.primary }}>
                  Admin Portal
                </p>
              </div>
            )}
          </Link>
          {/* Collapse button - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-all duration-200 hover:scale-105 hidden lg:block"
            style={{
              color: colors.textTertiary,
              background: colors.hoverBg,
            }}
          >
            <NavIcon name={collapsed ? 'chevron-right' : 'chevron-left'} className="w-4 h-4" />
          </button>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg transition-colors lg:hidden"
            style={{ color: colors.textTertiary }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3">
          {ADMIN_NAV_ITEMS.map((section, idx) => (
            <div key={section.section} className={idx > 0 ? 'mt-7' : ''}>
              {!collapsed && (
                <p
                  className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider"
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        collapsed ? 'lg:justify-center' : ''
                      }`}
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}08 100%)`
                          : 'transparent',
                        color: isActive ? colors.primary : colors.textSecondary,
                        fontWeight: isActive ? 600 : 500,
                        boxShadow: isActive && !isDark ? `0 2px 8px ${colors.primary}15` : 'none',
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <NavIcon name={item.icon} className="w-[18px] h-[18px] flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-[13px]">{item.label}</span>
                      )}
                      {collapsed && (
                        <span className="text-[13px] lg:hidden">{item.label}</span>
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
          className="p-3"
          style={{ borderTop: `1px solid ${colors.separator}` }}
        >
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 ${
              collapsed ? 'lg:justify-center' : ''
            }`}
            style={{
              color: colors.textSecondary,
              background: colors.hoverBg,
            }}
          >
            <NavIcon name={isDark ? 'sun' : 'moon'} className="w-[18px] h-[18px]" />
            {!collapsed && (
              <span className="text-[13px] font-medium">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
            {collapsed && (
              <span className="text-[13px] font-medium lg:hidden">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{
            background: isDark ? colors.background : 'rgba(248, 250, 252, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg transition-colors lg:hidden"
              style={{ color: colors.textSecondary }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {title && (
              <h1
                className="text-lg sm:text-xl font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status indicator - hidden on small screens */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: `${colors.success}12`,
                border: `1px solid ${colors.success}25`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: colors.success }}
              />
              <span className="text-[11px] font-semibold" style={{ color: colors.success }}>
                System Online
              </span>
            </div>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 hover:shadow-md"
              style={{
                background: colors.cardBg,
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
              }}
            >
              <NavIcon name="logout" className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Global styles for Plus Jakarta Sans font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}

// Export colors for use in pages
export { COLORS_LIGHT, COLORS_DARK, useDarkMode }
export type { AdminLayoutProps }
