import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import NotificationCenter from '@/components/advisor/NotificationCenter'
import OnboardingWizard from '@/components/advisor/onboarding/OnboardingWizard'
import { getAuthToken, clearAuthToken, authProfileApi, AuthProfile } from '@/services/api'
import { useDarkMode } from '@/utils/faHooks'
import { FA_COLORS_LIGHT, FA_COLORS_DARK } from '@/utils/faColors'
import NavIcon from './NavIcon'

const COLORS_LIGHT = FA_COLORS_LIGHT
const COLORS_DARK = FA_COLORS_DARK

// Navigation items for Financial Advisor
// "pinned" items always show; collapsible sections can be toggled
const ADVISOR_PINNED_ITEMS = [
  { label: 'Dashboard', href: '/advisor/dashboard', icon: 'home' },
]

const ADVISOR_NAV_SECTIONS = [
  {
    section: 'Clients',
    items: [
      { label: 'Clients', href: '/advisor/clients', icon: 'users' },
      { label: 'Pipeline', href: '/advisor/pipeline', icon: 'user-plus' },
      { label: 'Command Center', href: '/advisor/command-center', icon: 'clipboard' },
      { label: 'Insights', href: '/advisor/insights', icon: 'insights' },
    ]
  },
  {
    section: 'Transactions',
    items: [
      { label: 'Transactions', href: '/advisor/transactions', icon: 'arrows' },
      { label: 'CAS Imports', href: '/advisor/cas-imports', icon: 'upload' },
    ]
  },
  {
    section: 'Research',
    items: [
      { label: 'Funds', href: '/advisor/funds', icon: 'trending-up' },
      { label: 'Compare', href: '/advisor/compare', icon: 'scale' },
      { label: 'My Picks', href: '/advisor/my-picks', icon: 'star' },
      { label: 'Deep Analysis', href: '/advisor/analysis', icon: 'chart' },
      { label: 'Calculators', href: '/advisor/calculators', icon: 'calculator' },
      { label: 'Reports', href: '/advisor/reports', icon: 'document' },
    ]
  },
  {
    section: 'BSE StAR MF',
    items: [
      { label: 'BSE Setup', href: '/advisor/bse/setup', icon: 'bse' },
      { label: 'BSE Clients', href: '/advisor/bse/clients', icon: 'users' },
      { label: 'BSE Orders', href: '/advisor/bse/orders', icon: 'arrows' },
      { label: 'BSE Mandates', href: '/advisor/bse/mandates', icon: 'document' },
      { label: 'BSE Reports', href: '/advisor/bse/reports', icon: 'chart-bar' },
      { label: 'Transfer In', href: '/advisor/bse/cob', icon: 'arrows' },
    ]
  },
  {
    section: 'NSE NMF',
    items: [
      { label: 'NMF Setup', href: '/advisor/nmf/setup', icon: 'nmf' },
      { label: 'NMF Clients', href: '/advisor/nmf/clients', icon: 'users' },
      { label: 'NMF Orders', href: '/advisor/nmf/orders', icon: 'arrows' },
      { label: 'NMF Mandates', href: '/advisor/nmf/mandates', icon: 'document' },
      { label: 'NMF Systematic', href: '/advisor/nmf/systematic', icon: 'refresh' },
      { label: 'NMF Schemes', href: '/advisor/nmf/scheme-master', icon: 'search' },
      { label: 'NMF Reports', href: '/advisor/nmf/reports', icon: 'chart-bar' },
    ]
  },
  {
    section: 'Business',
    items: [
      { label: 'AUM & Analytics', href: '/advisor/business', icon: 'chart-bar' },
      { label: 'Commissions', href: '/advisor/commissions', icon: 'banknotes' },
      { label: 'Team', href: '/advisor/team', icon: 'user-group' },
      { label: 'Organization', href: '/advisor/organization', icon: 'building' },
      { label: 'Branches', href: '/advisor/branches', icon: 'building' },
      { label: 'Compliance', href: '/advisor/compliance', icon: 'shield-check' },
    ]
  },
  {
    section: 'Marketing',
    items: [
      { label: 'Marketing', href: '/advisor/marketing', icon: 'chart-bar' },
    ]
  },
  {
    section: 'Account',
    items: [
      { label: 'Settings', href: '/advisor/settings', icon: 'settings' },
      { label: 'Help', href: '/advisor/help', icon: 'help' },
    ]
  },
]


interface AdvisorLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdvisorLayout({ children, title }: AdvisorLayoutProps) {
  const router = useRouter()
  const isDark = useDarkMode()
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [hasToken, setHasToken] = useState(true) // Assume true initially to avoid flash
  const [advisorProfile, setAdvisorProfile] = useState<AuthProfile | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Auth check - redirect to login if no token or wrong role
  useEffect(() => {
    // Portal boundary check
    const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOSTNAME?.split(':')[0] || ''
    if (adminHost && window.location.hostname === adminHost) {
      window.location.href = '/404'
      return
    }

    const token = getAuthToken()
    if (!token) {
      setHasToken(false)
      window.location.href = '/advisor/login'
      return
    }
    // Verify user has advisor/fa_staff role (not admin)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const validRoles = ['advisor', 'fa_staff']
      if (!validRoles.includes(payload.role)) {
        clearAuthToken()
        setHasToken(false)
        window.location.href = '/advisor/login'
      }
    } catch {
      clearAuthToken()
      setHasToken(false)
      window.location.href = '/advisor/login'
    }
  }, [])

  // Fetch advisor profile for sidebar + check onboarding
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    authProfileApi.get()
      .then(data => {
        setAdvisorProfile(data)
        // Show onboarding wizard for advisors who haven't completed it
        if (data.role === 'advisor' && data.onboarding && !data.onboarding.isComplete) {
          setShowOnboarding(true)
        }
      })
      .catch(() => {}) // Silently fail — non-critical for layout
  }, [])

  // Load collapsed sidebar sections from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fa-sidebar-sections')
      if (saved) setCollapsedSections(JSON.parse(saved))
    } catch {}
  }, [])

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [sectionName]: !prev[sectionName] }
      try { localStorage.setItem('fa-sidebar-sections', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const handleLogout = () => {
    clearAuthToken()
    window.location.href = '/advisor/login'
  }

  // Decode JWT to check if user is staff
  const staffInfo = useMemo(() => {
    try {
      const token = getAuthToken()
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role === 'fa_staff') {
        return {
          allowedPages: (payload.allowedPages as string[]) || [],
        }
      }
    } catch {}
    return null
  }, [])

  // Filter nav items for staff users
  const { pinnedItems, navSections } = useMemo(() => {
    if (!staffInfo) return { pinnedItems: ADVISOR_PINNED_ITEMS, navSections: ADVISOR_NAV_SECTIONS }
    const allowed = new Set(staffInfo.allowedPages)
    return {
      pinnedItems: ADVISOR_PINNED_ITEMS.filter(item => allowed.has(item.href)),
      navSections: ADVISOR_NAV_SECTIONS
        .map(section => ({
          ...section,
          items: section.items.filter(item => allowed.has(item.href)),
        }))
        .filter(section => section.items.length > 0),
    }
  }, [staffInfo])

  // Route guard: redirect staff to first allowed page if on disallowed page
  useEffect(() => {
    if (!staffInfo) return
    const currentPath = router.asPath.split('?')[0]
    const isAllowed = staffInfo.allowedPages.some(
      page => currentPath === page || currentPath.startsWith(page + '/')
    )
    if (!isAllowed) {
      const firstAllowed = staffInfo.allowedPages[0] || '/advisor/dashboard'
      router.replace(firstAllowed)
    }
  }, [router.asPath, staffInfo])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [router.pathname])

  // Don't render anything while redirecting
  if (!hasToken) {
    return null
  }

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
    // Refresh profile to pick up updated onboarding status
    authProfileApi.get()
      .then(data => setAdvisorProfile(data))
      .catch(() => {})
  }, [])

  const isActiveLink = (href: string) => {
    return router.pathname === href || router.asPath.startsWith(href + '?') || router.asPath.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen flex" style={{ background: colors.background, fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      {/* Onboarding Wizard Overlay */}
      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-64 transition-all duration-300 flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-40 ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
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
            <img
              src="/icon-192.png"
              alt="Sparrow"
              className="w-10 h-10 rounded-xl flex-shrink-0"
              style={{
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
                filter: isDark
                  ? 'brightness(1.25) saturate(1.1)'
                  : undefined,
              }}
            />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  Sparrow
                </p>
                <p className="text-xs font-medium" style={{ color: staffInfo ? colors.warning : colors.primary }}>
                  {staffInfo ? 'Staff Access' : 'Financial Advisor'}
                </p>
              </div>
            )}
          </Link>
          {/* Collapse button - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors hidden lg:block"
            style={{ color: colors.textSecondary }}
          >
            <NavIcon name={collapsed ? 'chevron-right' : 'chevron-left'} className="w-4 h-4" />
          </button>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg transition-colors lg:hidden"
            style={{ color: colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Pinned items — always visible */}
          {pinnedItems.length > 0 && (
            <div className="space-y-1 mb-2">
              {pinnedItems.map((item) => {
                const isActive = isActiveLink(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      collapsed ? 'lg:justify-center' : ''
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
                    {collapsed && (
                      <span className="text-sm font-medium lg:hidden">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Collapsible sections */}
          {navSections.map((section) => {
            const isOpen = !collapsedSections[section.section]
            const itemsHiddenClass = !isOpen ? (collapsed ? 'hidden lg:block' : 'hidden') : ''
            return (
              <div key={section.section} className="mt-1">
                {/* Section header — full when expanded, separator when icon-only */}
                {!collapsed ? (
                  <button
                    onClick={() => toggleSection(section.section)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: colors.textTertiary }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {section.section}
                    </span>
                    <NavIcon
                      name="chevron-down"
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                    />
                  </button>
                ) : (
                  <>
                    <div className="my-2 mx-3 hidden lg:block" style={{ borderTop: `1px solid ${colors.separator}` }} />
                    <button
                      onClick={() => toggleSection(section.section)}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors lg:hidden"
                      style={{ color: colors.textTertiary }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {section.section}
                      </span>
                      <NavIcon
                        name="chevron-down"
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                      />
                    </button>
                  </>
                )}
                <div className={`space-y-1 ${itemsHiddenClass}`}>
                  {section.items.map((item) => {
                    const isActive = isActiveLink(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                          collapsed ? 'lg:justify-center' : ''
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
                        {collapsed && (
                          <span className="text-sm font-medium lg:hidden">{item.label}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* FA Profile Card */}
        {advisorProfile && (
          <div
            className="px-3 pb-4"
            style={{ borderTop: `0.5px solid ${colors.separator}` }}
          >
            <Link
              href="/advisor/settings"
              className={`flex items-center gap-3 px-3 py-3 mt-3 rounded-xl transition-all hover:scale-[1.01] ${
                collapsed ? 'lg:justify-center' : ''
              }`}
              style={{
                background: colors.chipBg,
                border: `1px solid ${colors.chipBorder}`,
              }}
              title={collapsed ? `${advisorProfile.advisorProfile?.companyName || advisorProfile.advisorProfile?.displayName || advisorProfile.name}` : undefined}
            >
              {/* Logo / Avatar / Initials */}
              {advisorProfile.advisorProfile?.companyLogoUrl ? (
                <img
                  src={advisorProfile.advisorProfile.companyLogoUrl}
                  alt="Company logo"
                  className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                  style={{ border: `1px solid ${colors.chipBorder}` }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    color: '#FFFFFF',
                  }}
                >
                  {(advisorProfile.advisorProfile?.displayName || advisorProfile.name || 'A')
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <div className="overflow-hidden min-w-0">
                  {advisorProfile.advisorProfile?.companyName && (
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: colors.textPrimary }}
                    >
                      {advisorProfile.advisorProfile.companyName}
                    </p>
                  )}
                  <p
                    className="text-xs truncate"
                    style={{ color: colors.textTertiary }}
                  >
                    {advisorProfile.advisorProfile?.displayName || advisorProfile.name}
                  </p>
                </div>
              )}
              {/* Always show name on mobile sidebar */}
              {collapsed && (
                <div className="overflow-hidden min-w-0 lg:hidden">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: colors.textPrimary }}
                  >
                    {advisorProfile.advisorProfile?.companyName || advisorProfile.advisorProfile?.displayName || advisorProfile.name}
                  </p>
                </div>
              )}
            </Link>
          </div>
        )}

      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{
            background: colors.sidebarBg,
            backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
            borderBottom: `0.5px solid ${colors.glassBorder}`,
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
              <h1 className="text-lg sm:text-xl font-semibold" style={{ color: colors.textPrimary }}>
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Client count badge - hidden on small screens */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
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
              className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all hover:shadow-lg hover:opacity-90"
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
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

// Export colors for use in pages
export type { AdvisorLayoutProps }
