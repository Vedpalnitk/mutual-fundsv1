import Link from 'next/link';
import { useState, useEffect } from 'react';

// iOS 26 Liquid Glass Color Palette
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  // iOS 26 Glass - More transparent
  cardBackground: 'rgba(255, 255, 255, 0.35)',
  cardBorder: 'rgba(255, 255, 255, 0.2)',
  chipBg: 'rgba(255, 255, 255, 0.2)',
  chipBorder: 'rgba(255, 255, 255, 0.3)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  glassShadow: 'rgba(0, 0, 0, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.5)',
};

const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  secondary: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  background: '#0F172A',
  // iOS 26 Glass - More transparent
  cardBackground: 'rgba(30, 41, 59, 0.4)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  chipBg: 'rgba(255, 255, 255, 0.1)',
  chipBorder: 'rgba(255, 255, 255, 0.15)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  glassShadow: 'rgba(0, 0, 0, 0.4)',
  glassHighlight: 'rgba(255, 255, 255, 0.15)',
};

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

// Hook to get current V4 colors
const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

const Home = () => {
  const colors = useV4Colors();
  const isDark = useDarkMode();

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`
            }}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 5H9a4 4 0 000 8h6a4 4 0 010 8H7"/>
            </svg>
          </div>
          <span className="text-lg font-semibold" style={{ color: colors.primary }}>Sparrow Invest</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div
          className="p-10 md:p-14 rounded-3xl"
          style={{
            background: colors.cardBackground,
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 8px 32px ${colors.glassShadow}, inset 0 1px 0 ${colors.glassHighlight}`
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: colors.chipBg }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.success }} />
                <span className="text-xs font-medium" style={{ color: colors.primary }}>AI-Powered Platform</span>
              </div>
              <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                Intelligent mutual fund portfolios, crafted for{' '}
                <span
                  style={{
                    background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  smart investors
                </span>
              </h1>
              <p className="mt-4 leading-relaxed" style={{ color: colors.textSecondary }}>
                A modern, AI-first platform that builds investor personas, aligns portfolios to goals, and keeps recommendations transparent.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
              >
                iOS 26 Liquid Glass
              </span>
              <span
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
              >
                Persona-driven allocation
              </span>
              <span
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
              >
                Tax-aware fund mix
              </span>
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {/* Admin Access */}
            <Link
              href="/dashboard?mode=admin"
              className="p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 group"
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}, inset 0 1px 0 ${colors.glassHighlight}`
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.textSecondary }}>Admin Access</p>
                  <h2 className="text-2xl font-semibold mt-2 transition-colors" style={{ color: colors.textPrimary }}>
                    Recommendation Studio
                  </h2>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: colors.textSecondary }}>
                    Review personas, risk guardrails, fund scoring, and investor mappings.
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6">
                <button
                  className="px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}
                >
                  Enter Admin
                </button>
              </div>
            </Link>

            {/* User Access */}
            <Link
              href="/dashboard?mode=user"
              className="p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 group"
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}, inset 0 1px 0 ${colors.glassHighlight}`
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.textSecondary }}>User Access</p>
                  <h2 className="text-2xl font-semibold mt-2 transition-colors" style={{ color: colors.textPrimary }}>
                    Investor Journey
                  </h2>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: colors.textSecondary }}>
                    Create a profile, discover your persona, and track a goal-based portfolio.
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6">
                <button
                  className="px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}
                >
                  Enter User
                </button>
              </div>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              title: 'AI-Powered Analysis',
              desc: 'Advanced algorithms for smarter fund selection'
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
              title: 'Goal Tracking',
              desc: 'Real-time progress towards your financial goals'
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Risk Management',
              desc: 'Smart risk profiling and portfolio balancing'
            }
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-2xl"
              style={{
                background: colors.cardBackground,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}, inset 0 1px 0 ${colors.glassHighlight}`
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-3"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
              >
                {feature.icon}
              </div>
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{feature.title}</h3>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 text-center">
        <p className="text-xs" style={{ color: colors.textTertiary }}>
          2024 Sparrow Invest. Powered by AI. Built with Liquid Glass design.
        </p>
      </footer>
    </div>
  );
};

export default Home;
