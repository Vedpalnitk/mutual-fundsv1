import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

// Unified Blue/Cyan palette (matches landing page)
const COLORS = {
  light: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    accent: '#38BDF8',
    background: '#FAFBFE',
    cardBg: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(59, 130, 246, 0.08)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(59, 130, 246, 0.15)',
    error: '#EF4444',
    shadow: 'rgba(59, 130, 246, 0.06)',
    shadowDeep: 'rgba(59, 130, 246, 0.12)',
  },
  dark: {
    primary: '#60A5FA',
    primaryDark: '#3B82F6',
    accent: '#38BDF8',
    background: '#06080F',
    cardBg: 'rgba(15, 23, 42, 0.72)',
    glassBorder: 'rgba(96, 165, 250, 0.1)',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
    inputBg: 'rgba(96, 165, 250, 0.08)',
    inputBorder: 'rgba(96, 165, 250, 0.15)',
    error: '#F87171',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDeep: 'rgba(0, 0, 0, 0.5)',
  },
}

const VALUE_PROPS = [
  {
    title: 'AI-Powered Portfolio Analysis',
    desc: 'Intelligent recommendations for every client',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2a5 5 0 015 5c0 .74-.16 1.44-.45 2.07A5 5 0 0120 14a5 5 0 01-3.5 4.77V22h-9v-3.23A5 5 0 014 14a5 5 0 013.45-4.93A5.01 5.01 0 017 7a5 5 0 015-5z" />
        <path d="M12 2v20M8 8h8M7 14h10" />
      </svg>
    ),
  },
  {
    title: 'Unified Client Management',
    desc: 'All families, goals, and portfolios in one place',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: 'Seamless Transactions',
    desc: 'Execute trades with BSE & MFU integration',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
]

export default function AdvisorLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    setMounted(true)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/advisor/dashboard')
    }
  }, [isAuthenticated, isLoading])

  const colors = isDark ? COLORS.dark : COLORS.light

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(email, password)
      router.push('/advisor/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: colors.background }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Advisor Login | Sparrow Invest</title>
      </Head>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatShape {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
      `}</style>

      <div className="min-h-screen flex" style={{ background: colors.background }}>
        {/* ─── Left: Branding Panel (dark always, hidden on mobile) ─── */}
        <div
          className="hidden md:flex w-[55%] relative overflow-hidden flex-col justify-between p-12"
          style={{
            background: 'linear-gradient(135deg, #0A0F1E 0%, #111827 40%, #0F172A 100%)',
          }}
        >
          {/* Decorative background elements */}
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
              transform: 'translate(-20%, 20%)',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Floating geometric shapes */}
          <div
            className="absolute top-[15%] right-[15%] w-16 h-16 rounded-2xl border opacity-[0.07]"
            style={{
              borderColor: '#60A5FA',
              animation: 'floatShape 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-[25%] left-[10%] w-12 h-12 rounded-full border opacity-[0.05]"
            style={{
              borderColor: '#38BDF8',
              animation: 'floatShape 10s ease-in-out infinite 2s',
            }}
          />
          <div
            className="absolute top-[60%] right-[25%] w-8 h-8 rounded-lg border opacity-[0.06]"
            style={{
              borderColor: '#818CF8',
              animation: 'floatShape 7s ease-in-out infinite 1s',
            }}
          />

          {/* Top: Logo + Title */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/icon-192.png"
                alt="Sparrow Invest"
                className="w-11 h-11 rounded-xl"
                style={{ boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)' }}
              />
              <span className="text-xl font-bold text-white tracking-tight">
                Sparrow Invest
              </span>
            </div>
            <p className="text-sm font-medium text-blue-300/70 ml-14">
              Financial Advisor Portal
            </p>
          </div>

          {/* Middle: Value propositions */}
          <div className="relative z-10 space-y-6">
            {VALUE_PROPS.map((prop, i) => (
              <div
                key={prop.title}
                className="flex items-start gap-4"
                style={{
                  animation: mounted ? `fadeInUp 0.5s ease-out ${0.2 + i * 0.15}s both` : 'none',
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(56, 189, 248, 0.1) 100%)',
                    border: '1px solid rgba(96, 165, 250, 0.15)',
                    color: '#60A5FA',
                  }}
                >
                  {prop.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">{prop.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{prop.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: Decorative text */}
          <div className="relative z-10">
            <p className="text-xs text-slate-500">
              Trusted by 500+ financial advisors across India
            </p>
          </div>
        </div>

        {/* ─── Right: Form Panel ─── */}
        <div
          className="w-full md:w-[45%] flex flex-col items-center justify-center px-6 py-12 relative"
          style={{
            background: isDark
              ? `linear-gradient(180deg, ${colors.background} 0%, #0C1220 100%)`
              : `linear-gradient(180deg, ${colors.background} 0%, #F0F4FF 100%)`,
          }}
        >
          {/* Mobile-only condensed header */}
          <div
            className="md:hidden flex flex-col items-center mb-8"
            style={{ animation: mounted ? 'fadeInUp 0.4s ease-out both' : 'none' }}
          >
            <img
              src="/icon-192.png"
              alt="Sparrow Invest"
              className="w-12 h-12 rounded-xl mb-3"
              style={{ boxShadow: `0 4px 16px ${colors.shadow}` }}
            />
            <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              Sparrow Invest
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: colors.primary }}>
              Financial Advisor Portal
            </p>
          </div>

          {/* Form Card */}
          <div
            className="w-full max-w-sm"
            style={{ animation: mounted ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none' }}
          >
            <div
              className="p-8 rounded-2xl"
              style={{
                background: colors.cardBg,
                backdropFilter: 'blur(50px) saturate(180%)',
                WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                border: `1px solid ${colors.glassBorder}`,
                boxShadow: `0 24px 64px ${colors.shadowDeep}`,
              }}
            >
              {/* Form Header */}
              <div className="mb-7">
                <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  Welcome back
                </h2>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Sign in to your advisor account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: colors.primary }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl text-sm transition-all focus:outline-none"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                    placeholder="advisor@sparrowinvest.com"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: colors.primary }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl text-sm transition-all focus:outline-none"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && (
                  <div
                    className="p-3 rounded-xl text-sm"
                    style={{
                      background: `${colors.error}15`,
                      color: colors.error,
                      border: `1px solid ${colors.error}30`,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-full text-white font-semibold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.light.primaryDark} 0%, ${COLORS.light.primary} 50%, ${COLORS.light.accent} 100%)`,
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>

            {/* Footer link */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: colors.textTertiary }}
              >
                Back to sparrowinvest.com
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
