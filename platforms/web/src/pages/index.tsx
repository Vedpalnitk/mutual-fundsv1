import Link from 'next/link'
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

// ─── Color System ─────────────────────────────────────────────
const COLORS_LIGHT = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryDeep: '#1D4ED8',
  accent: '#38BDF8',
  accentDark: '#0EA5E9',
  success: '#10B981',
  background: '#FAFBFE',
  backgroundAlt: '#F0F4FF',
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceSolid: '#FFFFFF',
  border: 'rgba(59, 130, 246, 0.08)',
  borderSubtle: 'rgba(59, 130, 246, 0.04)',
  shadow: 'rgba(59, 130, 246, 0.06)',
  shadowDeep: 'rgba(59, 130, 246, 0.12)',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  gradientMesh1: 'rgba(59, 130, 246, 0.06)',
  gradientMesh2: 'rgba(56, 189, 248, 0.04)',
  gradientMesh3: 'rgba(99, 102, 241, 0.03)',
}

const COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryDeep: '#2563EB',
  accent: '#38BDF8',
  accentDark: '#0EA5E9',
  success: '#34D399',
  background: '#06080F',
  backgroundAlt: '#0C1220',
  surface: 'rgba(15, 23, 42, 0.72)',
  surfaceSolid: '#111827',
  border: 'rgba(96, 165, 250, 0.1)',
  borderSubtle: 'rgba(96, 165, 250, 0.05)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDeep: 'rgba(0, 0, 0, 0.5)',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  textOnPrimary: '#FFFFFF',
  gradientMesh1: 'rgba(59, 130, 246, 0.08)',
  gradientMesh2: 'rgba(56, 189, 248, 0.05)',
  gradientMesh3: 'rgba(99, 102, 241, 0.04)',
}

// ─── Hooks ────────────────────────────────────────────────────
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

const useColors = () => {
  const isDark = useDarkMode()
  return isDark ? COLORS_DARK : COLORS_LIGHT
}

const useScrollY = () => {
  const [y, setY] = useState(0)
  useEffect(() => {
    const handle = () => setY(window.scrollY)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])
  return y
}

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

const useIsDevMode = () => {
  const [isDev, setIsDev] = useState(false)
  useEffect(() => {
    const appHost = process.env.NEXT_PUBLIC_APP_HOSTNAME?.split(':')[0] || ''
    const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOSTNAME?.split(':')[0] || ''
    const hostname = window.location.hostname
    setIsDev(!appHost || !adminHost || (hostname !== appHost && hostname !== adminHost))
  }, [])
  return isDev
}

// ─── Animated Counter ─────────────────────────────────────────
const AnimatedNumber = ({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0)
  const { ref, visible } = useInView(0.3)

  useEffect(() => {
    if (!visible) return
    let start = 0
    const duration = 1800
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.floor(eased * value)
      setCount(start)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [visible, value])

  return <span ref={ref as any}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>
}

// ─── SVG Icons ────────────────────────────────────────────────
const icons = {
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a5 5 0 015 5c0 .74-.16 1.44-.45 2.07A5 5 0 0120 14a5 5 0 01-3.5 4.77V22h-9v-3.23A5 5 0 014 14a5 5 0 013.45-4.93A5.01 5.01 0 017 7a5 5 0 015-5z" />
      <path d="M12 2v20M8 8h8M7 14h10" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  exchange: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
  playStore: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.04l2.538 1.47a1 1 0 010 1.726l-2.538 1.47-2.539-2.333 2.539-2.333zM5.864 3.458L16.8 9.79l-2.302 2.302-8.635-8.635z" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 opacity-15">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.187 11 15c0 1.933-1.567 3.5-3.5 3.5-1.206 0-2.348-.546-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.187 21 15c0 1.933-1.567 3.5-3.5 3.5-1.206 0-2.348-.546-2.917-1.179z" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  chartBar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
}

// ─── Dashboard Mockup ─────────────────────────────────────────
const DashboardMockup = ({ colors, isDark }: { colors: typeof COLORS_LIGHT; isDark: boolean }) => (
  <div
    className="relative w-full max-w-lg mx-auto"
    style={{
      perspective: '1200px',
    }}
  >
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: colors.surfaceSolid,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 24px 80px ${colors.shadowDeep}, 0 8px 24px ${colors.shadow}`,
        transform: 'rotateY(-4deg) rotateX(2deg)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F59E0B' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
        </div>
        <div className="flex-1 mx-8">
          <div className="h-5 rounded-full mx-auto max-w-[200px]" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'AUM', value: '12.4 Cr', change: '+18.2%' },
            { label: 'Clients', value: '284', change: '+12' },
            { label: 'Returns', value: '24.5%', change: 'XIRR' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="p-3 rounded-xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(56,189,248,0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(56,189,248,0.02) 100%)',
                border: `1px solid ${colors.borderSubtle}`,
              }}
            >
              <p className="text-[10px] font-medium" style={{ color: colors.textTertiary }}>{kpi.label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: colors.text }}>{kpi.value}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: colors.success }}>{kpi.change}</p>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div
          className="rounded-xl p-3"
          style={{
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(59,130,246,0.02)',
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Portfolio Growth</p>
            <p className="text-[10px] font-medium" style={{ color: colors.success }}>+24.5% YTD</p>
          </div>
          <svg viewBox="0 0 300 80" className="w-full" style={{ height: 64 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
                <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 70 Q30 65 60 55 T120 40 T180 30 T240 18 T300 8"
              fill="none"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M0 70 Q30 65 60 55 T120 40 T180 30 T240 18 T300 8 V80 H0 Z"
              fill="url(#chartGrad)"
            />
            <circle cx="300" cy="8" r="3" fill={colors.primary} />
          </svg>
        </div>

        {/* Holdings list */}
        <div className="space-y-1.5">
          {[
            { name: 'HDFC Flexi Cap', alloc: '28%', ret: '+22.4%' },
            { name: 'Axis Bluechip', alloc: '24%', ret: '+18.7%' },
            { name: 'SBI Small Cap', alloc: '20%', ret: '+31.2%' },
          ].map((fund) => (
            <div
              key={fund.name}
              className="flex items-center justify-between p-2.5 rounded-lg"
              style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.primary }} />
                </div>
                <span className="text-xs font-medium" style={{ color: colors.text }}>{fund.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px]" style={{ color: colors.textTertiary }}>{fund.alloc}</span>
                <span className="text-[10px] font-medium" style={{ color: colors.success }}>{fund.ret}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Floating notification */}
    <div
      className="absolute -left-4 bottom-16 p-3 rounded-xl max-w-[180px]"
      style={{
        background: colors.surfaceSolid,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 12px 40px ${colors.shadowDeep}`,
        animation: 'floatUp 3s ease-in-out infinite',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${colors.success}15` }}>
          {icons.check}
        </div>
        <div>
          <p className="text-[10px] font-semibold" style={{ color: colors.text }}>SIP Executed</p>
          <p className="text-[9px]" style={{ color: colors.textTertiary }}>HDFC Flexi Cap</p>
        </div>
      </div>
    </div>
  </div>
)

// ─── Section Wrapper with Reveal ──────────────────────────────
const Section = ({ children, className = '', id, style }: { children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties }) => {
  const { ref, visible } = useInView(0.1)
  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {children}
    </section>
  )
}

// ─── Main Page ────────────────────────────────────────────────
const Home = () => {
  const colors = useColors()
  const isDark = useDarkMode()
  const scrollY = useScrollY()
  const isDev = useIsDevMode()
  const [mobileNav, setMobileNav] = useState(false)
  const navScrolled = scrollY > 20

  // Defense-in-depth: redirect if on admin subdomain
  useEffect(() => {
    const hostname = window.location.hostname
    const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOSTNAME?.split(':')[0] || ''
    if (adminHost && hostname === adminHost) {
      window.location.href = '/admin/login'
    }
  }, [])

  const features = [
    { icon: icons.brain, title: 'AI Portfolio Analysis', desc: 'Machine learning models analyze holdings, risk exposure, and market conditions to surface actionable insights for every client.' },
    { icon: icons.users, title: 'Client Management', desc: 'Unified view of family portfolios, KYC status, risk profiles, and communication history. Onboard clients in minutes.' },
    { icon: icons.exchange, title: 'Transaction Execution', desc: 'Execute lump sum, SIP, redemption, and switch orders across BSE and MFU platforms with a single click.' },
    { icon: icons.target, title: 'Goal-Based Planning', desc: 'Map client goals to investment strategies with automated rebalancing triggers and milestone tracking.' },
    { icon: icons.sparkles, title: 'Smart Recommendations', desc: 'Context-aware fund suggestions factoring in tax implications, expense ratios, rolling returns, and peer performance.' },
    { icon: icons.shield, title: 'Compliance & Reporting', desc: 'Automated SEBI-compliant reports, audit trails, and real-time regulatory checks built into every workflow.' },
  ]

  const steps = [
    { icon: icons.upload, num: '01', title: 'Onboard Clients', desc: 'Import existing portfolios via CAS statements or add clients manually. KYC verification happens automatically.' },
    { icon: icons.chartBar, num: '02', title: 'AI Analyzes', desc: 'Our ML engine evaluates portfolios against benchmarks, identifies gaps, and generates personalized recommendations.' },
    { icon: icons.bolt, num: '03', title: 'Execute & Monitor', desc: 'Act on recommendations with one-click transactions. Automated alerts keep you ahead of market shifts.' },
  ]

  const testimonials = [
    { name: 'Priya Sharma', title: 'IFA, Mumbai', text: 'Sparrow has fundamentally changed how I manage my practice. Portfolio analysis that used to take me hours now happens in seconds. My clients notice the difference.', rating: 5 },
    { name: 'Arun Mehta', title: 'Wealth Advisor, Bangalore', text: 'The transaction execution alone saves me 2 hours every day. But the real magic is the AI recommendations — they consistently surface funds I would have missed.', rating: 5 },
    { name: 'Kavitha Nair', title: 'CFP, Chennai', text: 'Finally, a platform built for Indian advisors. The goal-based planning tools and SEBI-compliant reporting give my clients and me complete confidence.', rating: 5 },
  ]

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
  ]

  return (
    <>
      <Head>
        <title>Sparrow Invest — AI-Powered Wealth Management for Financial Advisors</title>
        <meta name="description" content="The intelligent platform that helps financial advisors manage client portfolios, execute transactions, and deliver AI-driven recommendations. Built for the Indian market." />
      </Head>

      <style jsx global>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <div style={{ background: colors.background, fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>

        {/* ─── Background Mesh ─── */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.gradientMesh1} 0%, transparent 70%)`, transform: 'translate(20%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.gradientMesh2} 0%, transparent 70%)`, transform: 'translate(-20%, 30%)' }} />
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.gradientMesh3} 0%, transparent 70%)`, transform: 'translate(-50%, -50%)' }} />
        </div>

        {/* ─── Navbar ─── */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: navScrolled ? (isDark ? 'rgba(6,8,15,0.85)' : 'rgba(250,251,254,0.85)') : 'transparent',
            backdropFilter: navScrolled ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: navScrolled ? 'blur(20px) saturate(180%)' : 'none',
            borderBottom: navScrolled ? `1px solid ${colors.borderSubtle}` : '1px solid transparent',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/icon-192.png"
                alt="Sparrow Invest"
                className="w-9 h-9 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ boxShadow: `0 4px 12px ${colors.shadow}` }}
              />
              <span className="text-lg font-bold tracking-tight" style={{ color: colors.text }}>
                Sparrow <span style={{ color: colors.primary }}>Invest</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:opacity-100"
                  style={{ color: colors.textSecondary, opacity: 0.8 }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/advisor/login"
                className="text-sm font-semibold px-4 py-2 rounded-full transition-all hover:opacity-80"
                style={{ color: colors.primary }}
              >
                Log in
              </Link>
              <Link
                href="/advisor/login"
                className="text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
                  boxShadow: `0 4px 14px ${colors.shadow}`,
                }}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Toggle menu"
              style={{ color: colors.text }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                {mobileNav ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile nav panel */}
          {mobileNav && (
            <div
              className="md:hidden px-6 pb-4 space-y-1"
              style={{ background: isDark ? 'rgba(6,8,15,0.95)' : 'rgba(250,251,254,0.95)', backdropFilter: 'blur(20px)' }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileNav(false)}
                  className="block py-2.5 text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <Link href="/advisor/login" className="text-sm font-semibold py-2" style={{ color: colors.primary }}>Log in</Link>
                <Link
                  href="/advisor/login"
                  className="text-sm font-semibold px-5 py-2.5 rounded-full text-white text-center"
                  style={{ background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)` }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* ─── Hero ─── */}
        <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden" style={{ zIndex: 1 }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left — Copy */}
              <div className="max-w-xl">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
                  style={{
                    background: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(59,130,246,0.06)',
                    border: `1px solid ${isDark ? 'rgba(96,165,250,0.15)' : 'rgba(59,130,246,0.1)'}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.success }} />
                  <span className="text-xs font-semibold tracking-wide" style={{ color: colors.primary }}>AI-Powered Platform</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight" style={{ color: colors.text }}>
                  Wealth management,<br />
                  <span
                    className="bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.accent} 60%, ${colors.primary} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    reimagined.
                  </span>
                </h1>

                <p className="mt-6 text-lg leading-relaxed" style={{ color: colors.textSecondary }}>
                  The intelligent platform that helps financial advisors manage client portfolios, execute transactions, and deliver AI-driven recommendations. Built for the Indian market.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/advisor/login"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-xl hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryDeep} 0%, ${colors.primary} 50%, ${colors.accent} 100%)`,
                      backgroundSize: '200% 200%',
                      boxShadow: `0 8px 30px ${isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.2)'}`,
                    }}
                  >
                    Start Free Trial
                    {icons.arrowRight}
                  </Link>
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5"
                    style={{
                      color: colors.text,
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                      {icons.play}
                    </span>
                    Watch Demo
                  </button>
                </div>

                <div className="mt-10 flex items-center gap-6">
                  <div className="flex -space-x-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map((bg, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: bg, borderColor: colors.background, zIndex: 4 - i }}
                      >
                        {['PS', 'AM', 'KN', 'RV'][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
                      {[...Array(5)].map((_, i) => <span key={i}>{icons.star}</span>)}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>Trusted by 500+ advisors across India</p>
                  </div>
                </div>
              </div>

              {/* Right — Dashboard Mockup */}
              <div className="hidden lg:block">
                <DashboardMockup colors={colors} isDark={isDark} />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Stats Bar ─── */}
        <Section className="relative py-12 md:py-16" style={{ zIndex: 1 }} id="stats">
          <div className="max-w-6xl mx-auto px-6">
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 p-8 md:p-10 rounded-2xl"
              style={{
                background: colors.surface,
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: `1px solid ${colors.border}`,
                boxShadow: `0 8px 40px ${colors.shadow}`,
              }}
            >
              {[
                { value: 2400, suffix: ' Cr', prefix: '\u20B9', label: 'AUM Managed' },
                { value: 520, suffix: '+', prefix: '', label: 'Active Advisors' },
                { value: 15000, suffix: '+', prefix: '', label: 'Client Families' },
                { value: 99, suffix: '.9%', prefix: '', label: 'Platform Uptime' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: colors.text }}>
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                  </p>
                  <p className="text-xs font-medium mt-1.5 uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Features ─── */}
        <Section className="relative py-20 md:py-28" id="features" style={{ zIndex: 1 }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 inline-block" style={{ color: colors.primary }}>
                Platform Capabilities
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: colors.text }}>
                Everything you need to grow your practice
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: colors.textSecondary }}>
                Purpose-built tools for Indian financial advisors. From portfolio construction to compliance — we handle the complexity so you can focus on your clients.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: colors.surface,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 4px 24px ${colors.shadow}`,
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}12 0%, ${colors.accent}08 100%)`,
                      color: colors.primary,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: colors.text }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── How It Works ─── */}
        <Section className="relative py-20 md:py-28" id="how-it-works" style={{ zIndex: 1 }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 inline-block" style={{ color: colors.primary }}>
                How It Works
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: colors.text }}>
                Up and running in three steps
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: colors.textSecondary }}>
                Go from sign-up to managing your first client portfolio in under 15 minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-px" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}30, transparent)` }} />

              {steps.map((s, i) => (
                <div key={s.title} className="text-center relative">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.accent} 100%)`,
                      color: '#FFFFFF',
                      boxShadow: `0 8px 24px ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
                    }}
                  >
                    {s.icon}
                  </div>
                  <span className="text-xs font-bold tracking-[0.15em] uppercase mb-2 inline-block" style={{ color: colors.primary }}>{s.num}</span>
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: colors.textSecondary }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Testimonials ─── */}
        <Section className="relative py-20 md:py-28" id="testimonials" style={{ zIndex: 1 }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 inline-block" style={{ color: colors.primary }}>
                What Advisors Say
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: colors.text }}>
                Trusted by advisors who move markets
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: colors.surface,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 4px 24px ${colors.shadow}`,
                  }}
                >
                  {icons.quote}
                  <p className="text-sm leading-relaxed mt-3 mb-5" style={{ color: colors.textSecondary }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.accent})` }}
                    >
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: colors.text }}>{t.name}</p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>{t.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mt-3" style={{ color: '#F59E0B' }}>
                    {[...Array(t.rating)].map((_, i) => <span key={i}>{icons.star}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Mobile Apps ─── */}
        <Section className="relative py-20 md:py-28" id="apps" style={{ zIndex: 1 }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 inline-block" style={{ color: colors.primary }}>
                Mobile Apps
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: colors.text }}>
                Your portfolio, always in your pocket
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: colors.textSecondary }}>
                Native apps for both investors and financial advisors. Track portfolios, execute trades, and stay connected — anywhere, anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Consumer App */}
              <div
                className="relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: colors.surface,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${colors.border}`,
                  boxShadow: `0 8px 40px ${colors.shadow}`,
                }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: `${colors.primary}08` }} />
                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.accent} 100%)`,
                      color: '#FFFFFF',
                      boxShadow: `0 8px 24px ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
                    }}
                  >
                    {icons.phone}
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>For Investors</h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: colors.textSecondary }}>
                    Track your mutual fund portfolio, monitor goal progress, submit investment requests to your advisor, and get AI-driven insights — all from your phone.
                  </p>
                  <div className="space-y-2">
                    {[
                      'Real-time portfolio tracking & NAV updates',
                      'Goal-based progress monitoring',
                      'Submit trade requests to your FA',
                      'Family portfolio overview',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${colors.success}15`, color: colors.success }}>
                          {icons.check}
                        </div>
                        <span className="text-sm" style={{ color: colors.textSecondary }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-8">
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.85)',
                        color: isDark ? colors.text : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                      }}
                    >
                      {icons.apple}
                      App Store
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.85)',
                        color: isDark ? colors.text : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                      }}
                    >
                      {icons.playStore}
                      Google Play
                    </button>
                  </div>
                </div>
              </div>

              {/* Advisor App */}
              <div
                className="relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: colors.surface,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${colors.border}`,
                  boxShadow: `0 8px 40px ${colors.shadow}`,
                }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: `${colors.accent}08` }} />
                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primaryDeep} 100%)`,
                      color: '#FFFFFF',
                      boxShadow: `0 8px 24px ${isDark ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.15)'}`,
                    }}
                  >
                    {icons.users}
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>For Advisors</h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: colors.textSecondary }}>
                    Manage your entire practice on the go. Review client portfolios, approve trade requests, execute transactions, and receive real-time alerts.
                  </p>
                  <div className="space-y-2">
                    {[
                      'Client portfolio management & analytics',
                      'One-tap trade execution via BSE & MFU',
                      'AI-powered fund recommendations',
                      'SEBI-compliant reporting on the go',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${colors.success}15`, color: colors.success }}>
                          {icons.check}
                        </div>
                        <span className="text-sm" style={{ color: colors.textSecondary }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-8">
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.85)',
                        color: isDark ? colors.text : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                      }}
                    >
                      {icons.apple}
                      App Store
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.85)',
                        color: isDark ? colors.text : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                      }}
                    >
                      {icons.playStore}
                      Google Play
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── CTA ─── */}
        <Section className="relative py-20 md:py-28" style={{ zIndex: 1 }}>
          <div className="max-w-6xl mx-auto px-6">
            <div
              className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center"
              style={{
                background: `linear-gradient(135deg, ${colors.primaryDeep} 0%, ${colors.primaryDark} 40%, ${colors.accent} 100%)`,
                boxShadow: `0 24px 80px ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
              }}
            >
              {/* Decorative shapes */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />

              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  Ready to transform your practice?
                </h2>
                <p className="mt-4 text-base text-white/70 leading-relaxed">
                  Join 500+ financial advisors who use Sparrow to manage portfolios smarter, execute faster, and grow their AUM.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full sm:flex-1 h-12 px-5 rounded-full text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFFFFF',
                    }}
                  />
                  <button
                    className="w-full sm:w-auto whitespace-nowrap h-12 px-8 rounded-full font-semibold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{
                      background: '#FFFFFF',
                      color: colors.primaryDeep,
                    }}
                  >
                    Get Early Access
                  </button>
                </div>
                <p className="mt-4 text-xs text-white/50">
                  Free 30-day trial. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Footer ─── */}
        <footer className="relative py-16 md:py-20" style={{ zIndex: 1, borderTop: `1px solid ${colors.borderSubtle}` }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <img
                    src="/icon-192.png"
                    alt="Sparrow Invest"
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ boxShadow: `0 4px 12px ${colors.shadow}` }}
                  />
                  <span className="text-base font-bold" style={{ color: colors.text }}>Sparrow <span style={{ color: colors.primary }}>Invest</span></span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: colors.textTertiary }}>
                  AI-powered wealth management platform for financial advisors in India.
                </p>
              </div>

              {/* Links */}
              {[
                { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
                { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
                { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance'] },
                { title: 'Connect', links: ['Twitter', 'LinkedIn', 'YouTube', 'Support'] },
              ].map((col) => (
                <div key={col.title}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textTertiary }}>
                    {col.title}
                  </p>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm transition-colors hover:opacity-100"
                          style={{ color: colors.textSecondary, opacity: 0.8 }}
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div
              className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
            >
              <p className="text-xs" style={{ color: colors.textTertiary }}>
                2025 Sparrow Invest Technologies Pvt. Ltd. — sparrow-invest.com All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.success }} />
                <span className="text-xs font-medium" style={{ color: colors.textTertiary }}>All systems operational</span>
              </div>
            </div>
          </div>
        </footer>

        {/* ─── Dev Portal Selector (localhost only) ─── */}
        {isDev && (
          <div
            className="fixed bottom-4 right-4 z-50 p-3 rounded-xl"
            style={{
              background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 8px 32px ${colors.shadowDeep}`,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textTertiary }}>Dev Portals</p>
            <div className="flex gap-2">
              <Link
                href="/admin/login"
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ background: `${colors.primary}12`, color: colors.primary }}
              >
                Admin
              </Link>
              <Link
                href="/advisor/login"
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ background: `${colors.primary}12`, color: colors.primary }}
              >
                Advisor
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Home
