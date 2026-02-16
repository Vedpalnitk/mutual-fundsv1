import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, ReactNode } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { getAuthToken, clearAuthToken } from '@/services/api'

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
      { label: 'Overview', href: '/admin/overview', icon: 'chart-bar' },
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
    section: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: 'user-circle' },
    ]
  },
]

// Icon component
const NavIcon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    'grid': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    'chart-bar': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    'trending-up': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    'cpu': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
      </svg>
    ),
    'sparkles': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    'user-circle': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'chevron-left': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    ),
    'chevron-right': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
    'palette': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
      </svg>
    ),
    'settings': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'logout': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
    ),
    'leaf': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-8-8-12a8 8 0 0116 0c0 4-4 8-8 12z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6m0 0l-2-2m2 2l2-2" />
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

  if (!hasToken) {
    return null
  }

  const isActiveLink = (href: string) => {
    return router.pathname === href || router.asPath.startsWith(href + '?')
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [router.pathname])

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
