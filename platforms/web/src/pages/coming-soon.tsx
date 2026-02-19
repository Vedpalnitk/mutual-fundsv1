import Head from 'next/head'
import { useState, useEffect } from 'react'

const COLORS = {
  light: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    accent: '#38BDF8',
    background: '#FAFBFE',
    surface: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(59, 130, 246, 0.08)',
    shadow: 'rgba(59, 130, 246, 0.06)',
    shadowDeep: 'rgba(59, 130, 246, 0.12)',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    mesh1: 'rgba(59, 130, 246, 0.06)',
    mesh2: 'rgba(56, 189, 248, 0.04)',
    mesh3: 'rgba(99, 102, 241, 0.03)',
  },
  dark: {
    primary: '#60A5FA',
    primaryDark: '#3B82F6',
    accent: '#38BDF8',
    background: '#06080F',
    surface: 'rgba(15, 23, 42, 0.72)',
    border: 'rgba(96, 165, 250, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDeep: 'rgba(0, 0, 0, 0.5)',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
    mesh1: 'rgba(59, 130, 246, 0.08)',
    mesh2: 'rgba(56, 189, 248, 0.05)',
    mesh3: 'rgba(99, 102, 241, 0.04)',
  },
}

export default function ComingSoonPage() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    setMounted(true)
    return () => obs.disconnect()
  }, [])

  const colors = isDark ? COLORS.dark : COLORS.light

  return (
    <>
      <Head>
        <title>Coming Soon | Sparrow Invest</title>
        <meta name="description" content="Sparrow Invest — AI-powered wealth management for financial advisors. Launching soon." />
      </Head>

      <style jsx global>{`
        @keyframes floatShape {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
        style={{ background: colors.background, fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
      >
        {/* Background mesh */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.mesh1} 0%, transparent 70%)`, transform: 'translate(20%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.mesh2} 0%, transparent 70%)`, transform: 'translate(-20%, 30%)' }} />
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.mesh3} 0%, transparent 70%)`, transform: 'translate(-50%, -50%)' }} />
        </div>

        {/* Floating geometric shapes */}
        <div
          className="absolute top-[15%] right-[20%] w-16 h-16 rounded-2xl border opacity-[0.07]"
          style={{ borderColor: colors.primary, animation: 'floatShape 8s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-[20%] left-[15%] w-12 h-12 rounded-full border opacity-[0.05]"
          style={{ borderColor: colors.accent, animation: 'floatShape 10s ease-in-out infinite 2s' }}
        />
        <div
          className="absolute top-[60%] right-[10%] w-8 h-8 rounded-lg border opacity-[0.06]"
          style={{ borderColor: colors.primaryDark, animation: 'floatShape 7s ease-in-out infinite 1s' }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          {/* Logo */}
          <div
            className="flex items-center justify-center gap-3 mb-10"
            style={{ animation: mounted ? 'fadeInUp 0.6s ease-out both' : 'none' }}
          >
            <img
              src="/icon-192.png"
              alt="Sparrow Invest"
              className="w-14 h-14 rounded-2xl"
              style={{ boxShadow: `0 8px 24px ${colors.shadowDeep}` }}
            />
            <span className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
              Sparrow <span style={{ color: colors.primary }}>Invest</span>
            </span>
          </div>

          {/* Pulse ring indicator */}
          <div
            className="mx-auto mb-8 relative w-16 h-16 flex items-center justify-center"
            style={{ animation: mounted ? 'fadeInUp 0.6s ease-out 0.15s both' : 'none' }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `${colors.primary}15`,
                animation: 'pulse-ring 2s ease-in-out infinite',
              }}
            />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.accent} 100%)`,
                boxShadow: `0 4px 16px ${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1
            className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4"
            style={{
              color: colors.text,
              animation: mounted ? 'fadeInUp 0.6s ease-out 0.3s both' : 'none',
            }}
          >
            Something{' '}
            <span
              className="bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.accent} 60%, ${colors.primary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              amazing
            </span>{' '}
            is brewing
          </h1>

          <p
            className="text-lg leading-relaxed mb-10"
            style={{
              color: colors.textSecondary,
              animation: mounted ? 'fadeInUp 0.6s ease-out 0.45s both' : 'none',
            }}
          >
            We&apos;re building an AI-powered wealth management platform for financial advisors in India. Stay tuned for the launch.
          </p>

          {/* Feature pills */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
            style={{ animation: mounted ? 'fadeInUp 0.6s ease-out 0.6s both' : 'none' }}
          >
            {['AI Portfolio Analysis', 'Client Management', 'Transaction Execution'].map((label) => (
              <span
                key={label}
                className="text-xs font-semibold px-4 py-2 rounded-full"
                style={{
                  background: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(59,130,246,0.06)',
                  color: colors.primary,
                  border: `1px solid ${isDark ? 'rgba(96,165,250,0.15)' : 'rgba(59,130,246,0.1)'}`,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Contact */}
          <p
            className="text-sm"
            style={{
              color: colors.textTertiary,
              animation: mounted ? 'fadeInUp 0.6s ease-out 0.75s both' : 'none',
            }}
          >
            Get in touch:{' '}
            <a
              href="mailto:hello@sparrow-invest.com"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: colors.primary }}
            >
              hello@sparrow-invest.com
            </a>
          </p>
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-6 text-center"
          style={{ animation: mounted ? 'fadeInUp 0.6s ease-out 0.9s both' : 'none' }}
        >
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            2025 Sparrow Invest Technologies Pvt. Ltd.
          </p>
        </div>
      </div>
    </>
  )
}
